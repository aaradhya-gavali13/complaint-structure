/**
 * API client for Citizen Grievance Portal.
 * Automatically communicates with FastAPI backend.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://complaint-structure.onrender.com";

const CITIZEN_TOKEN_KEY = "citizen_token";
const CITIZEN_USER_KEY = "citizen_user";

export function getStoredCitizenToken() {
  return localStorage.getItem(CITIZEN_TOKEN_KEY);
}

export function getStoredCitizenUser() {
  try {
    const raw = localStorage.getItem(CITIZEN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeCitizenSession(token, user) {
  if (token) localStorage.setItem(CITIZEN_TOKEN_KEY, token);
  if (user) localStorage.setItem(CITIZEN_USER_KEY, JSON.stringify(user));
}

export function clearCitizenSession() {
  localStorage.removeItem(CITIZEN_TOKEN_KEY);
  localStorage.removeItem(CITIZEN_USER_KEY);
}

export async function citizenRegister(data) {
  const response = await fetch(`${API_BASE_URL}/citizen/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || "Registration failed. Please check your details.");
  }
  storeCitizenSession(result.access_token, result.user);
  return result;
}

export async function citizenLogin(credentials) {
  const response = await fetch(`${API_BASE_URL}/citizen/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || "Invalid User ID or Password.");
  }
  storeCitizenSession(result.access_token, result.user);
  return result;
}

export async function fetchCurrentCitizen() {
  const token = getStoredCitizenToken();
  if (!token) return null;
  const response = await fetch(`${API_BASE_URL}/citizen/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    clearCitizenSession();
    return null;
  }
  const user = await response.json();
  localStorage.setItem(CITIZEN_USER_KEY, JSON.stringify(user));
  return user;
}

export async function submitComplaint(data) {
  try {
    const token = getStoredCitizenToken();
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      let errorMessage = "Unable to submit grievance. Please verify your details.";
      if (result.detail) {
        if (Array.isArray(result.detail)) {
          errorMessage = result.detail.map((err) => `${err.loc ? err.loc.slice(-1)[0] + ': ' : ''}${err.msg}`).join(" | ");
        } else if (typeof result.detail === "string") {
          errorMessage = result.detail;
        }
      }
      throw new Error(errorMessage);
    }

    return result;
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("Unable to connect to Grievance Server. Please verify the FastAPI backend is running on port 8000.");
    }
    throw err;
  }
}

export async function trackComplaint(complaintId) {
  const cleanId = encodeURIComponent(complaintId.trim().toUpperCase());
  const token = getStoredCitizenToken();
  const headers = { Accept: "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/complaints/${cleanId}`, {
      method: "GET",
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      let errorMessage = `Complaint '${complaintId}' was not found.`;
      if (result.detail && typeof result.detail === "string") {
        errorMessage = result.detail;
      }
      throw new Error(errorMessage);
    }

    return result;
  } catch (err) {
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error("Unable to connect to Grievance Server. Please verify the FastAPI backend is running on port 8000.");
    }
    throw err;
  }
}

export async function fetchMyComplaints() {
  const token = getStoredCitizenToken();
  if (!token) throw new Error("Please log in to view your filed grievances.");

  const response = await fetch(`${API_BASE_URL}/citizen/my-complaints`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || "Failed to fetch your grievances.");
  }
  return result;
}

export async function uploadAttachment(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/complaints/upload`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || "Failed to upload evidence attachment.");
  }
  return result;
}

export async function submitCitizenFeedback(complaintId, { rating, comment }) {
  const token = getStoredCitizenToken();
  if (!token) throw new Error("Please log in to submit feedback.");

  const response = await fetch(`${API_BASE_URL}/citizen/complaints/${encodeURIComponent(complaintId)}/feedback`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rating, comment }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.detail || "Failed to submit feedback.");
  }
  return result;
}

export function getMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function checkBackendStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

