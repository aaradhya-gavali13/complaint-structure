import React, { useState, useEffect } from "react";
import { fetchMyComplaints, getMediaUrl } from "../api";
import { StatusBadge } from "../components/StatusBadge";
import OfficialReceiptModal from "../components/OfficialReceiptModal";
import {
  FileText,
  Clock,
  Building2,
  Calendar,
  Search,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  PlusCircle,
  MessageSquare,
  Printer,
  Camera,
  Star,
  MapPin,
} from "../components/Icons";

export default function MyComplaintsPage({ user, setActivePage, setTrackId, onOpenAuth }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReceiptComplaint, setSelectedReceiptComplaint] = useState(null);

  const loadComplaints = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyComplaints();
      setComplaints(data || []);
    } catch (err) {
      setError(err.message || "Failed to load your complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [user]);

  const formatDate = (isoStr) => {
    if (!isoStr) return "-";
    return new Date(isoStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (!user) {
    return (
      <div className="gov-container main-wrapper">
        <div style={{ maxWidth: "600px", margin: "3rem auto", textAlign: "center" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "2.5rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
            }}
          >
            <ShieldAlert size={48} color="#134074" style={{ margin: "0 auto 1rem" }} />
            <h2 style={{ fontSize: "1.5rem", color: "#0b2545", marginBottom: "0.5rem" }}>
              Citizen Sign-In Required
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              To view your registered grievances and check administrative progress, please authenticate with your Citizen User ID and password.
            </p>
            <button className="btn btn-primary" onClick={onOpenAuth}>
              Sign In to Your Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gov-container main-wrapper">
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "1.75rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.35rem" }}>
              Citizen Dashboard &bull; User ID: <strong style={{ color: "#0b2545" }}>@{user.user_id}</strong>
            </div>
            <h1 style={{ fontSize: "1.85rem", color: "#0b2545", margin: 0 }}>
              My Filed Grievances
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              All complaints registered under your account with real-time status progression.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              className="btn btn-secondary"
              onClick={loadComplaints}
              disabled={loading}
              title="Refresh your grievances"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setActivePage("submit")}
            >
              <PlusCircle size={15} />
              <span>File New Grievance</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              backgroundColor: "#ffe4e6",
              border: "1px solid #fecdd3",
              borderRadius: "8px",
              padding: "1rem 1.25rem",
              color: "#9f1239",
              marginBottom: "1.5rem",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748b" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
            <p>Loading your registered grievances...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && complaints.length === 0 && (
          <div
            className="civic-card"
            style={{
              textAlign: "center",
              padding: "3.5rem 1.5rem",
            }}
          >
            <FileText size={48} color="#94a3b8" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ color: "#0b2545", marginBottom: "0.5rem" }}>No Grievances Filed Yet</h3>
            <p style={{ color: "#64748b", fontSize: "0.92rem", maxWidth: "440px", margin: "0 auto 1.5rem" }}>
              You haven't submitted any complaints under this Citizen User ID. If you have a civic issue to report, file a new grievance.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => setActivePage("submit")}>
              <PlusCircle size={18} />
              <span>Submit Your First Grievance</span>
            </button>
          </div>
        )}

        {/* List of complaints */}
        {!loading && !error && complaints.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {complaints.map((c) => {
              const latestHistory = c.history && c.history.length > 0 ? c.history[0] : null;
              return (
                <div
                  key={c.complaint_id}
                  className="civic-card"
                  style={{
                    padding: "1.25rem 1.5rem",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setTrackId(c.complaint_id);
                    setActivePage("track");
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      borderBottom: "1px solid #f1f5f9",
                      paddingBottom: "0.85rem",
                      marginBottom: "0.85rem",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "1.1rem",
                            color: "#0b2545",
                          }}
                        >
                          {c.complaint_id}
                        </span>
                        <StatusBadge status={c.status} />
                        {c.feedback_rating && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", fontSize: "0.75rem", fontWeight: 700, color: "#eab308", background: "#fef9c3", padding: "2px 6px", borderRadius: "4px" }}>
                            <Star size={12} fill="#eab308" /> {c.feedback_rating}/5
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          marginTop: "0.25rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <Building2 size={14} color="#134074" />
                          Department: <strong>{c.department}</strong>
                        </span>
                        {c.pincode && (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <MapPin size={14} color="#0284c7" />
                            PIN {c.pincode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: "right", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{
                          padding: "0.35rem 0.65rem",
                          fontSize: "0.78rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          borderColor: "#3b82f6",
                          color: "#2563eb",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReceiptComplaint(c);
                        }}
                        title="Print Official PDF Receipt"
                      >
                        <Printer size={13} />
                        <span>Receipt (PDF)</span>
                      </button>

                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: "0.35rem 0.65rem",
                          fontSize: "0.78rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrackId(c.complaint_id);
                          setActivePage("track");
                        }}
                      >
                        <span>View Details</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Complaint excerpt & Photos */}
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    {c.complaint_text && (
                      <div
                        style={{
                          flex: 1,
                          fontSize: "0.88rem",
                          color: "#334155",
                          backgroundColor: "#f8fafc",
                          padding: "0.75rem 1rem",
                          borderRadius: "6px",
                          lineHeight: 1.5,
                        }}
                      >
                        <strong style={{ color: "#0b2545" }}>Grievance: </strong>
                        {c.complaint_text.length > 180
                          ? c.complaint_text.slice(0, 180) + "..."
                          : c.complaint_text}
                      </div>
                    )}

                    {c.attachment_url && (
                      <div style={{ flexShrink: 0 }}>
                        <img
                          src={getMediaUrl(c.attachment_url)}
                          alt="Attached proof"
                          style={{ width: "54px", height: "54px", objectFit: "cover", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                          title="Evidence Photo Attached"
                        />
                      </div>
                    )}
                  </div>

                  {/* Official Administrative Message */}
                  <div
                    className={`admin-message-box ${
                      (c.status || "").toLowerCase().includes("reject")
                        ? "rejected"
                        : (c.status || "").toLowerCase().includes("resolved")
                        ? "resolved"
                        : ""
                    }`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem", flexWrap: "wrap", gap: "0.25rem" }}>
                      <strong style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem" }}>
                        <MessageSquare size={14} color="#1d4ed8" />
                        Official Administrative Message:
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Status: <strong>{c.status}</strong>
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                      {c.admin_message || (latestHistory && latestHistory.admin_note) || "Your grievance is registered and undergoing administrative review."}
                    </div>
                    {(c.admin_message_updated_at || (latestHistory && latestHistory.created_at)) && (
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.35rem" }}>
                        Updated on {formatDate(c.admin_message_updated_at || latestHistory.created_at)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for PDF Receipt */}
        {selectedReceiptComplaint && (
          <OfficialReceiptModal
            complaint={selectedReceiptComplaint}
            onClose={() => setSelectedReceiptComplaint(null)}
          />
        )}
      </div>
    </div>
  );
}
