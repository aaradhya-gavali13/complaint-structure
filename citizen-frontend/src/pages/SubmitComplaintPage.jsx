import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  User,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Shield,
  Loader2,
  Lock,
  ArrowRight,
  Info,
  LogIn,
  Camera,
  Upload,
  X,
  Image as ImageIcon,
} from "../components/Icons";
import { submitComplaint, uploadAttachment, getMediaUrl } from "../api";

export default function SubmitComplaintPage({
  user,
  onOpenAuth,
  onSubmissionSuccess,
  setActivePage,
}) {
  const [formData, setFormData] = useState({
    name: user?.full_name || "",
    phone: user?.phone || "",
    address: "",
    pincode: "",
    complaint: "",
  });

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.full_name || "",
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  // Real-time field validator
  const validateField = (field, value) => {
    let error = "";
    const trimmed = (value || "").trim();

    if (field === "name") {
      if (!trimmed) {
        error = "Full Name is required.";
      } else if (trimmed.length < 2) {
        error = "Full Name must contain at least 2 characters.";
      }
    }

    if (field === "phone") {
      if (!trimmed) {
        error = "Phone number is required.";
      } else {
        const cleaned = trimmed.replace(/[\s\-\(\)]/g, "");
        if (!/^\+?[0-9]{7,15}$/.test(cleaned)) {
          error = "Please enter a valid phone number (7 to 15 digits).";
        }
      }
    }

    if (field === "address") {
      if (!trimmed) {
        error = "Address is required.";
      } else if (trimmed.length < 5) {
        error = "Please provide a complete address (minimum 5 characters).";
      }
    }

    if (field === "complaint") {
      if (!trimmed) {
        error = "Complaint description is required.";
      } else if (trimmed.length < 5) {
        error = "Complaint description must have a minimum length of 5 characters.";
      }
    }

    return error;
  };

  const validateAll = () => {
    const newErrors = {};
    ["name", "phone", "address", "complaint"].forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5 MB.");
      return;
    }

    setAttachmentFile(file);
    const localUrl = URL.createObjectURL(file);
    setAttachmentPreview(localUrl);

    // Auto-upload in background
    setIsUploadingAttachment(true);
    try {
      const uploadRes = await uploadAttachment(file);
      setUploadedUrl(uploadRes.url);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.message || "Failed to upload photo attachment. Please retry.");
      setAttachmentFile(null);
      setAttachmentPreview(null);
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentFile(null);
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentPreview(null);
    setUploadedUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!user) {
      setApiError("Authentication required: Please log in or sign up to submit your complaint.");
      onOpenAuth("login");
      return;
    }

    // Mark all touched
    setTouched({
      name: true,
      phone: true,
      address: true,
      complaint: true,
    });

    if (!validateAll()) {
      const firstKey = Object.keys(errors)[0];
      const el = document.getElementById(firstKey);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        pincode: formData.pincode.trim(),
        complaint: formData.complaint.trim(),
        attachment_url: uploadedUrl,
      };

      const result = await submitComplaint(payload);

      onSubmissionSuccess({
        complaint_id: result.complaint_id,
        status: result.status,
        name: payload.name,
        created_at: result.created_at,
        attachment_url: uploadedUrl,
      });
    } catch (err) {
      setApiError(err.message || "Failed to submit complaint. Please check your inputs and try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not logged in, show the required authentication gate
  if (!user) {
    return (
      <div className="gov-container main-wrapper">
        <div style={{ maxWidth: "640px", margin: "2rem auto" }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.2rem" }}>
            <span style={{ cursor: "pointer" }} onClick={() => setActivePage("home")}>
              Home
            </span>{" "}
            / <strong style={{ color: "#0b2545" }}>Citizen Verification</strong>
          </div>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "2.5rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 12px 30px rgba(0, 0, 0, 0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "#e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <Lock size={28} color="#0369a1" />
            </div>

            <h1 style={{ fontSize: "1.75rem", color: "#0b2545", marginBottom: "0.5rem" }}>
              Citizen Sign-In Required
            </h1>
            <p style={{ color: "#475569", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.75rem" }}>
              In accordance with civic governance and data privacy policies, all public grievances must be submitted under a verified <strong>Citizen User ID</strong>. Without logging in, complaint filing is restricted.
            </p>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: "1.5rem",
              }}
            >
              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{ minWidth: "180px" }}
                onClick={() => onOpenAuth("login")}
              >
                <LogIn size={18} />
                <span>Log In with User ID</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                style={{ minWidth: "180px" }}
                onClick={() => onOpenAuth("register")}
              >
                <User size={18} />
                <span>New Citizen Register</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gov-container main-wrapper">
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.2rem" }}>
          <span style={{ cursor: "pointer" }} onClick={() => setActivePage("home")}>
            Home
          </span>{" "}
          / <strong style={{ color: "#0b2545" }}>Citizen Grievance Submission</strong>
        </div>

        {/* Page Title */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", backgroundColor: "#e0f2fe", color: "#0369a1", padding: "0.25rem 0.65rem", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            <User size={13} />
            <span>Authenticated Citizen: @{user.user_id}</span>
          </div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Submit a Public Grievance
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Please fill out all required details accurately. Your complaint will be registered into the central redressal registry and allocated to the competent municipal authority.
          </p>
        </div>

        {/* API Error Notification */}
        {apiError && (
          <div
            style={{
              backgroundColor: "#ffe4e6",
              border: "1px solid #fecdd3",
              borderRadius: "8px",
              padding: "1rem 1.25rem",
              color: "#9f1239",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Submission Error:</strong> {apiError}
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <form onSubmit={handleSubmit} className="civic-card" noValidate>
          {/* Section 1: Citizen Particulars */}
          <div className="form-section-header">
            <User size={18} />
            <span>Section 1: Citizen Particulars & Locality</span>
          </div>

          <div className="form-grid">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                <span>
                  Full Name <span className="required-star">*</span>
                </span>
                <span className="helper-text">As per official records</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`form-input ${touched.name && errors.name ? "has-error" : ""}`}
                placeholder="e.g. Aaradhya Gavali"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                autoComplete="name"
              />
              {touched.name && errors.name && (
                <div className="error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                <span>
                  Phone Number <span className="required-star">*</span>
                </span>
                <span className="helper-text">For SMS grievance updates</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`form-input ${touched.phone && errors.phone ? "has-error" : ""}`}
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                autoComplete="tel"
              />
              {touched.phone && errors.phone && (
                <div className="error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="form-group full-width">
              <label htmlFor="address" className="form-label">
                <span>
                  Complete Incident / Residence Address <span className="required-star">*</span>
                </span>
                <span className="helper-text">House / Street / Locality / Landmark</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                className={`form-input ${touched.address && errors.address ? "has-error" : ""}`}
                placeholder="e.g. Flat 302, Green Valley Apartments, Civil Lines, Sector 4, Pune"
                value={formData.address}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
                autoComplete="street-address"
              />
              {touched.address && errors.address && (
                <div className="error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.address}</span>
                </div>
              )}
            </div>


            {/* Pincode */}
            <div className="form-group">
              <label htmlFor="pincode" className="form-label">
                <span>Postal Pincode</span>
                <span className="helper-text">6-digit area code</span>
              </label>
              <input
                id="pincode"
                name="pincode"
                type="text"
                className="form-input"
                placeholder="e.g. 411001"
                value={formData.pincode}
                onChange={handleChange}
                disabled={isSubmitting}
                maxLength={6}
              />
            </div>

            {/* Section 2: Grievance Description */}
            <div className="form-section-header">
              <FileText size={18} />
              <span>Section 2: Statement of Grievance & Photographic Proof</span>
            </div>

            <div className="form-group full-width">
              <label htmlFor="complaint" className="form-label">
                <span>
                  Complaint Description <span className="required-star">*</span>
                </span>
                <span className="char-counter">
                  {formData.complaint.trim().length} characters (min 5 required)
                </span>
              </label>
              <textarea
                id="complaint"
                name="complaint"
                rows={5}
                className={`form-textarea ${touched.complaint && errors.complaint ? "has-error" : ""}`}
                placeholder="Describe your grievance in detail. State what happened, the institution or service involved, dates, location landmarks, and the redressal sought..."
                value={formData.complaint}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={isSubmitting}
              />
              {touched.complaint && errors.complaint && (
                <div className="error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.complaint}</span>
                </div>
              )}
            </div>

            {/* Evidence Image Upload Field */}
            <div className="form-group full-width">
              <label className="form-label">
                <span>📸 Photographic Evidence / Document (Optional)</span>
                <span className="helper-text">Upload photo of broken road, garbage, leak, or document (JPG, PNG, PDF &lt; 5MB)</span>
              </label>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={handleFileSelect}
              />

              {!attachmentPreview ? (
                <div
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "10px",
                    padding: "1.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: "#f8fafc",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Camera size={28} color="#0284c7" style={{ margin: "0 auto 0.5rem" }} />
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.92rem" }}>
                    Click to attach photo evidence or document
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px" }}>
                    Helps municipal inspection teams verify location & assess urgency faster
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#f0f9ff",
                  }}
                >
                  <img
                    src={attachmentPreview}
                    alt="Uploaded proof"
                    style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "6px" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#0369a1" }}>
                      {attachmentFile?.name || "Evidence Attached"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {isUploadingAttachment ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                          <Loader2 size={12} className="animate-spin" /> Uploading image to central storage...
                        </span>
                      ) : (
                        <span style={{ color: "#16a34a", fontWeight: 600 }}>✓ Uploaded successfully</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="btn btn-secondary btn-sm"
                    title="Remove attachment"
                  >
                    <X size={15} />
                    <span>Remove</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submission Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.82rem" }}>
              <Shield size={16} color="#059669" />
              <span>Official Protected Submission • Confidential Triage</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isUploadingAttachment}
              className="btn btn-primary btn-lg"
              style={{ minWidth: "220px" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Submitting Grievance...</span>
                </>
              ) : (
                <>
                  <span>Submit Grievance</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
