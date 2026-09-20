/**
 * Admin Dashboard API Client.
 * Manages JWT tokens and administrative REST requests to FastAPI.
 */
const API_BASE = import.meta.env.VITE_API_URL || "https://complaint-structure.onrender.com";

const TOKEN_KEY = "grievance_admin_jwt";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function authFetch(url, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredToken();
    window.dispatchEvent(new Event("admin-unauthorized"));
    throw new Error("Session expired or unauthorized. Please log in again.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || "Server request failed. Please try again.";
    throw new Error(errorMsg);
  }

  return data;
}

export async function adminLogin(username, password) {
  const response = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Invalid administrative credentials.");
  }

  setStoredToken(data.access_token);
  return data;
}

export async function fetchAdminMe() {
  return authFetch("/admin/me");
}

export async function getCurrentAdmin() {
  const token = getStoredToken();
  if (!token) {
    throw new Error("No token stored");
  }
  return fetchAdminMe();
}

export function adminLogout() {
  clearStoredToken();
}

export async function fetchStatistics() {
  return authFetch("/admin/statistics");
}

export async function fetchComplaints(params = {}) {
  const query = new URLSearchParams();

  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.search) query.append("search", params.search);
  if (params.priority && params.priority !== "ALL") query.append("priority", params.priority);
  if (params.department && params.department !== "ALL") query.append("department", params.department);
  if (params.status && params.status !== "ALL") query.append("status", params.status);
  if (params.human_review !== undefined && params.human_review !== null && params.human_review !== "ALL") {
    query.append("human_review", Boolean(params.human_review));
  }

  return authFetch(`/admin/complaints?${query.toString()}`);
}

export async function fetchComplaintDetail(complaintId) {
  const cleanId = encodeURIComponent(complaintId.trim().toUpperCase());
  return authFetch(`/admin/complaints/${cleanId}`);
}

export async function updateComplaintStatus(complaintId, status, adminNote = "", resolutionAttachmentUrl = null) {
  const cleanId = encodeURIComponent(complaintId.trim().toUpperCase());
  const body = {
    status,
    admin_note: adminNote,
  };
  if (resolutionAttachmentUrl) {
    body.resolution_attachment_url = resolutionAttachmentUrl;
  }
  return authFetch(`/admin/complaints/${cleanId}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchDepartments() {
  return authFetch("/admin/departments");
}

export async function fetchPriorities() {
  return authFetch("/admin/priorities");
}

export async function fetchCitizens(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.search) query.append("search", params.search);

  return authFetch(`/admin/citizens?${query.toString()}`);
}

export async function downloadCitizensCSV() {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}/admin/citizens/export-csv`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || "Failed to export customer directory CSV");
  }

  // Extract filename from Content-Disposition header if present
  let filename = `customers_directory_${new Date().toISOString().slice(0, 10)}.csv`;
  const disposition = res.headers.get("Content-Disposition");
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename=["']?([^"';]+)["']?/);
    if (match && match[1]) {
      filename = match[1].trim();
    }
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 200);
}

export async function fetchAnalytics() {
  return authFetch("/admin/analytics");
}

export async function bulkUpdateStatus(payload) {
  return authFetch("/admin/complaints/bulk-status", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function assignOfficer(complaintId, payload) {
  const cleanId = encodeURIComponent(complaintId.trim().toUpperCase());
  return authFetch(`/admin/complaints/${cleanId}/assign-officer`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendOfficerDirectMessage(complaintId, payload = {}) {
  const cleanId = encodeURIComponent(complaintId.trim().toUpperCase());
  return authFetch(`/admin/complaints/${cleanId}/send-officer-message`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetCitizenPassword(userId, payload) {
  const cleanId = encodeURIComponent(userId.trim());
  return authFetch(`/admin/citizens/${cleanId}/reset-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function toggleCitizenStatus(userId, payload) {
  const cleanId = encodeURIComponent(userId.trim());
  return authFetch(`/admin/citizens/${cleanId}/toggle-status`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadResolutionProof(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/complaints/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to upload resolution evidence file");
  }

  return data;
}

export function getMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_BASE}${url}`;
}

