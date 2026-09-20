import React, { useState, useEffect } from "react";
import {
  Search,
  Clock,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  FileText,
  RotateCcw,
  Sparkles,
  User,
  ArrowRight,
  RefreshCw,
  XCircle,
  MessageSquare,
  Printer,
  Star,
  Camera,
  Check,
  MapPin,
  HelpCircle,
} from "../components/Icons";
import { trackComplaint, submitCitizenFeedback, getMediaUrl } from "../api";
import { StatusBadge } from "../components/StatusBadge";
import OfficialReceiptModal from "../components/OfficialReceiptModal";
import FindGrievanceModal from "../components/FindGrievanceModal";

export default function TrackComplaintPage({
  initialTrackId,
  setActivePage,
  user,
}) {
  const [complaintId, setComplaintId] = useState(initialTrackId || "");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showFindModal, setShowFindModal] = useState(false);

  // Feedback rating states
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  // Auto-search if an initial track ID is passed from Success or Home
  useEffect(() => {
    if (initialTrackId) {
      setComplaintId(initialTrackId);
      performSearch(initialTrackId);
    }
  }, [initialTrackId]);

  const performSearch = async (idToSearch) => {
    const trimmed = (idToSearch || "").trim();
    if (!trimmed) {
      setError("Please enter a valid Complaint ID.");
      return;
    }

    setIsLoading(true);
    setError("");
    setHasSearched(true);
    setResult(null);
    setFeedbackSuccess(false);
    setFeedbackError("");

    try {
      const data = await trackComplaint(trimmed);
      setResult(data);
      if (data.feedback_rating) {
        setFeedbackRating(data.feedback_rating);
        setFeedbackComment(data.feedback_comment || "");
      }
    } catch (err) {
      setError(err.message || "Unable to locate grievance. Please verify your Registration ID.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(complaintId);
  };

  const handleRefresh = () => {
    if (result && result.complaint_id) {
      performSearch(result.complaint_id);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!result) return;
    setIsSubmittingFeedback(true);
    setFeedbackError("");

    try {
      await submitCitizenFeedback(result.complaint_id, {
        rating: feedbackRating,
        comment: feedbackComment.trim(),
      });
      setFeedbackSuccess(true);
      setResult((prev) => ({
        ...prev,
        feedback_rating: feedbackRating,
        feedback_comment: feedbackComment.trim(),
      }));
    } catch (err) {
      setFeedbackError(err.message || "Failed to submit feedback.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Determine stage for progress stepper
  const getStepStatus = (statusStr) => {
    const s = (statusStr || "").toLowerCase();
    if (s.includes("reject")) return -1; // Special rejected state
    if (s.includes("resolved") || s.includes("closed")) return 4;
    if (s.includes("progress") || s.includes("assigned")) return 3;
    if (s.includes("review") || s.includes("investigat")) return 2;
    return 1; // Submitted
  };

  const currentStep = result ? getStepStatus(result.status) : 1;
  const isRejected = result && (result.status || "").toLowerCase().includes("reject");
  const isResolved = result && (result.status || "").toLowerCase().includes("resolved");

  // Get prominent admin message
  const adminMessage = result ? (
    result.admin_message ||
    (result.history && result.history.find((h) => h.admin_note && h.admin_note.trim())?.admin_note) ||
    ""
  ) : "";

  const adminMessageDate = result?.admin_message_updated_at ||
    (result?.history && result.history.find((h) => h.admin_note && h.admin_note.trim())?.created_at);

  const formatDate = (isoStr) => {
    if (!isoStr) return "N/A";
    return new Date(isoStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="gov-container main-wrapper">
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.2rem" }}>
          <span style={{ cursor: "pointer" }} onClick={() => setActivePage("home")}>
            Home
          </span>{" "}
          / <strong style={{ color: "#0b2545" }}>Track Public Grievance</strong>
        </div>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Track Grievance Redressal Status
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Monitor real-time status updates, field actions, and official administrative messages.
          </p>
        </div>

        {/* Search Card */}
        <div className="civic-card">
          <form onSubmit={handleSubmit}>
            <label htmlFor="trackInput" className="form-label" style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>
              Enter Complaint Registration Number
            </label>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <input
                id="trackInput"
                type="text"
                className="form-input"
                style={{ flex: 1, minWidth: "260px", textTransform: "uppercase" }}
                placeholder="e.g. GRV-20260918-00001"
                value={complaintId}
                onChange={(e) => setComplaintId(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ minWidth: "150px" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Check Status</span>
                  </>
                )}
              </button>
            </div>
            <div
              style={{
                marginTop: "0.75rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.6rem",
              }}
            >
              <div className="helper-text" style={{ margin: 0 }}>
                Case-insensitive. Look up the ID provided in your official submission acknowledgment.
              </div>
              <button
                type="button"
                onClick={() => setShowFindModal(true)}
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "6px",
                  color: "#1d4ed8",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.75rem",
                  transition: "all 0.15s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#dbeafe")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#eff6ff")}
              >
                <HelpCircle size={15} />
                <span>Forgot Grievance ID? Find by Mobile Number</span>
              </button>
            </div>
          </form>
        </div>

        {/* Error Notification */}
        {error && (
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
              <strong>Search Notice:</strong> {error}
            </div>
          </div>
        )}

        {/* Results Card */}
        {result && (
          <div className="civic-card" style={{ marginTop: "1rem" }}>
            <div className="civic-card-header">
              <div>
                <span style={{ fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Official Grievance Record
                </span>
                <h2 style={{ fontSize: "1.5rem", fontFamily: "monospace", letterSpacing: "0.05em", color: "#0b2545", marginTop: "0.2rem" }}>
                  {result.complaint_id}
                </h2>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="btn btn-secondary"
                  style={{
                    padding: "0.4rem 0.8rem",
                    fontSize: "0.82rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    borderColor: "#3b82f6",
                    color: "#2563eb",
                    backgroundColor: "#eff6ff",
                  }}
                  title="Generate Official Printable Receipt with QR Code"
                >
                  <Printer size={15} />
                  <span>Official Receipt (PDF)</span>
                </button>

                <StatusBadge status={result.status} />

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="btn btn-secondary"
                  style={{
                    padding: "0.35rem 0.65rem",
                    fontSize: "0.8rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                  title="Check for live status updates from authority"
                >
                  <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Prominent Official Administrative Message Callout */}
            <div
              className={`admin-message-banner ${
                isRejected ? "rejected" : isResolved ? "resolved" : ""
              }`}
            >
              <div className="admin-message-header">
                <div className="admin-message-title">
                  {isRejected ? (
                    <XCircle size={18} color="#e11d48" />
                  ) : isResolved ? (
                    <CheckCircle2 size={18} color="#16a34a" />
                  ) : (
                    <MessageSquare size={18} color="#1d4ed8" />
                  )}
                  <span>Official Administrative Message</span>
                </div>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                    color: isRejected ? "#9f1239" : isResolved ? "#166534" : "#1e40af",
                  }}
                >
                  Current Status: {result.status}
                </span>
              </div>

              <div className="admin-message-content">
                {adminMessage ? (
                  <p style={{ margin: 0, fontWeight: 500, fontSize: "0.95rem" }}>
                    {adminMessage}
                  </p>
                ) : isRejected ? (
                  <p style={{ margin: 0 }}>
                    This grievance was reviewed and marked as <strong>Rejected</strong> by municipal authorities.
                  </p>
                ) : isResolved ? (
                  <p style={{ margin: 0 }}>
                    This grievance has been formally <strong>Resolved</strong> by the designated department following on-site remediation.
                  </p>
                ) : (
                  <p style={{ margin: 0 }}>
                    Your complaint has been acknowledged by municipal authorities and is currently in the <strong>{result.status}</strong> stage.
                  </p>
                )}
              </div>

              {adminMessageDate && (
                <div className="admin-message-footer">
                  <Clock size={13} />
                  <span>Admin action logged on {formatDate(adminMessageDate)}</span>
                </div>
              )}
            </div>

            {/* Visual Workflow Stepper (Standard or Rejected) */}
            {isRejected ? (
              <div
                style={{
                  margin: "1.5rem 0",
                  backgroundColor: "#fff1f2",
                  border: "1px solid #fecdd3",
                  borderRadius: "8px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <XCircle size={22} color="#e11d48" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "#9f1239", fontSize: "0.95rem" }}>
                    Lifecycle Status: Grievance Rejected &amp; Closed
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#881337", marginTop: "0.2rem" }}>
                    The jurisdictional officer has reviewed this submission and marked the status as <strong>Rejected</strong>. Refer to the official administrative message above for explanation.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ margin: "2rem 0" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "0.75rem" }}>
                  Redressal Progress Stepper
                </div>

                <div className="stepper-container">
                  <div
                    className="stepper-progress-bar"
                    style={{
                      width: currentStep === 1 ? "10%" : currentStep === 2 ? "40%" : currentStep === 3 ? "75%" : "100%",
                    }}
                  ></div>

                  <div className={`step-node ${currentStep >= 1 ? "completed" : ""}`}>
                    <div className="step-circle">1</div>
                    <div className="step-label">Submitted</div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Complaint Logged</span>
                  </div>

                  <div className={`step-node ${currentStep >= 2 ? (currentStep === 2 ? "active" : "completed") : ""}`}>
                    <div className="step-circle">2</div>
                    <div className="step-label">Department Allocated</div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Triage &amp; Intake</span>
                  </div>

                  <div className={`step-node ${currentStep >= 3 ? (currentStep === 3 ? "active" : "completed") : ""}`}>
                    <div className="step-circle">3</div>
                    <div className="step-label">In Review / Assigned</div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Field Officer Action</span>
                  </div>

                  <div className={`step-node ${currentStep >= 4 ? "completed" : ""}`}>
                    <div className="step-circle">4</div>
                    <div className="step-label">Resolved</div>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Action Completed</span>
                  </div>
                </div>
              </div>
            )}

            {/* Before & After Photo Evidence Gallery */}
            {(result.attachment_url || result.resolution_attachment_url) && (
              <div
                style={{
                  marginBottom: "1.5rem",
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontWeight: 700, color: "#0b2545", marginBottom: "0.85rem", fontSize: "0.95rem" }}>
                  <Camera size={18} color="#0284c7" />
                  <span>Visual Evidence &amp; Remediation Proof</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                  {result.attachment_url && (
                    <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.75rem", background: "#f8fafc" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                        📸 Complainant's Evidence (Before)
                      </div>
                      <a href={getMediaUrl(result.attachment_url)} target="_blank" rel="noreferrer">
                        <img
                          src={getMediaUrl(result.attachment_url)}
                          alt="Citizen evidence"
                          style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "6px" }}
                        />
                      </a>
                    </div>
                  )}

                  {result.resolution_attachment_url && (
                    <div style={{ border: "1px solid #86efac", borderRadius: "8px", padding: "0.75rem", background: "#f0fdf4" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                        ✅ Official Proof of Resolution (After)
                      </div>
                      <a href={getMediaUrl(result.resolution_attachment_url)} target="_blank" rel="noreferrer">
                        <img
                          src={getMediaUrl(result.resolution_attachment_url)}
                          alt="Remediation proof"
                          style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "6px" }}
                        />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Particulars Grid (Authority, SLA, Locality) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1.25rem",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                  Assigned Authority
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", fontWeight: 600, color: "#0b2545" }}>
                  <Building2 size={16} color="#134074" />
                  <span>{result.department}</span>
                </div>
              </div>

              {result.pincode && (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                    Postal Pincode
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", color: "#334155", fontSize: "0.9rem", fontWeight: 600 }}>
                    <MapPin size={16} color="#0284c7" />
                    <span>PIN {result.pincode}</span>
                  </div>
                </div>
              )}

              {result.assigned_officer_name && (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                    Assigned Field Officer
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", color: "#0b2545", fontSize: "0.9rem", fontWeight: 600 }}>
                    <User size={16} color="#16a34a" />
                    <span>{result.assigned_officer_name}</span>
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                  Submission Date
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", color: "#334155", fontSize: "0.9rem" }}>
                  <Calendar size={16} color="#134074" />
                  <span>{formatDate(result.created_at)}</span>
                </div>
              </div>

              {result.sla_due_date && (
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                    SLA Target Deadline
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", color: "#047857", fontSize: "0.9rem", fontWeight: 600 }}>
                    <Clock size={16} color="#047857" />
                    <span>{formatDate(result.sla_due_date)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Grievance Narrative */}
            {result.complaint_text && (
              <div
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "1.25rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Registered Grievance Narrative
                </div>
                <p style={{ color: "#334155", lineHeight: 1.6, fontSize: "0.95rem", margin: 0 }}>
                  {result.complaint_text}
                </p>
              </div>
            )}

            {/* Citizen Resolution Feedback & Star Rating Section (When Resolved) */}
            {isResolved && (
              <div
                style={{
                  marginBottom: "1.5rem",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  padding: "1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <Star size={20} color="#eab308" fill="#eab308" />
                  <strong style={{ color: "#166534", fontSize: "1rem" }}>
                    Citizen Redressal Satisfaction Rating
                  </strong>
                </div>

                {result.feedback_rating ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: "0.5rem 0" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={22}
                          color="#eab308"
                          fill={star <= result.feedback_rating ? "#eab308" : "none"}
                        />
                      ))}
                      <span style={{ fontWeight: 700, color: "#166534", marginLeft: "0.5rem" }}>
                        {result.feedback_rating} / 5 Stars
                      </span>
                    </div>
                    {result.feedback_comment && (
                      <p style={{ margin: "0.35rem 0 0", color: "#1e293b", fontSize: "0.9rem", fontStyle: "italic" }}>
                        "{result.feedback_comment}"
                      </p>
                    )}
                    <div style={{ fontSize: "0.78rem", color: "#16a34a", marginTop: "0.5rem" }}>
                      ✓ Your feedback was recorded into the municipal accountability audit.
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit}>
                    <p style={{ fontSize: "0.88rem", color: "#334155", margin: "0 0 0.75rem" }}>
                      How satisfied are you with the resolution of this grievance? Please rate your experience:
                    </p>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "0.75rem" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                          onClick={() => setFeedbackRating(star)}
                          onMouseEnter={() => setFeedbackHover(star)}
                          onMouseLeave={() => setFeedbackHover(0)}
                        >
                          <Star
                            size={26}
                            color="#eab308"
                            fill={(feedbackHover || feedbackRating) >= star ? "#eab308" : "none"}
                          />
                        </button>
                      ))}
                      <span style={{ fontWeight: 600, color: "#166534", marginLeft: "0.5rem", fontSize: "0.9rem" }}>
                        {feedbackRating} / 5 Stars
                      </span>
                    </div>

                    <textarea
                      rows={2}
                      className="form-textarea"
                      placeholder="Optional feedback: Was the issue resolved properly? Were the staff courteous? (Max 1000 chars)"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      disabled={isSubmittingFeedback}
                      style={{ marginBottom: "0.75rem", fontSize: "0.88rem" }}
                    />

                    {feedbackError && (
                      <div style={{ color: "#dc2626", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                        ⚠️ {feedbackError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingFeedback}
                      className="btn btn-primary btn-sm"
                      style={{ backgroundColor: "#15803d", borderColor: "#15803d" }}
                    >
                      {isSubmittingFeedback ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Submit Citizen Feedback</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Administrative Action Trail & Updates */}
            {result.history && result.history.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0b2545", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span>Official Administrative Action &amp; Progress Updates</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {result.history.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderLeft: `4px solid ${
                          item.new_status.toLowerCase().includes("reject")
                            ? "#e11d48"
                            : item.new_status.toLowerCase().includes("resolved")
                            ? "#16a34a"
                            : "#134074"
                        }`,
                        borderRadius: "6px",
                        padding: "0.85rem 1.15rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.35rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0b2545" }}>
                            Status: {item.new_status}
                          </span>
                          {item.old_status && item.old_status !== "None" && (
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              (from {item.old_status})
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }}>
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {item.admin_note ? (
                        <div style={{ fontSize: "0.88rem", color: "#334155", lineHeight: 1.5 }}>
                          <strong>Admin Message: </strong>
                          <span>{item.admin_note}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.82rem", color: "#64748b", fontStyle: "italic" }}>
                          Status updated to {item.new_status} by {item.changed_by}.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy Compliance Assurance */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#64748b",
                fontSize: "0.8rem",
                borderTop: "1px solid #e2e8f0",
                paddingTop: "1rem",
              }}
            >
              <ShieldCheck size={16} color="#059669" />
              <span>
                Protected Grievance Record: Citizen private details remain strictly confidential and secured under citizen identity authentication.
              </span>
            </div>
          </div>
        )}

        {/* Empty State when no search has been done yet */}
        {!result && !error && !isLoading && (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
              background: "#ffffff",
              border: "1px dashed #cbd5e1",
              borderRadius: "10px",
            }}
          >
            <Search size={36} color="#94a3b8" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ color: "#475569", marginBottom: "0.5rem" }}>Ready to Track Your Grievance</h3>
            <p style={{ color: "#64748b", fontSize: "0.875rem", maxWidth: "460px", margin: "0 auto 1.5rem" }}>
              Enter your complaint registration code above to view official status updates, competent authority assignment, and administrative remarks.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button className="btn btn-secondary" onClick={() => setActivePage("submit")}>
                Need to file a new grievance?
              </button>
              {user && (
                <button className="btn btn-primary" onClick={() => setActivePage("my-complaints")}>
                  View My Filed Grievances
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Official Printable Receipt Modal */}
      {showReceiptModal && result && (
        <OfficialReceiptModal
          complaint={result}
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* Find Grievance Number by Mobile / Citizen ID Modal */}
      <FindGrievanceModal
        isOpen={showFindModal}
        onClose={() => setShowFindModal(false)}
        onSelectComplaint={(selectedId) => {
          setComplaintId(selectedId);
          performSearch(selectedId);
        }}
      />
    </div>
  );
}
