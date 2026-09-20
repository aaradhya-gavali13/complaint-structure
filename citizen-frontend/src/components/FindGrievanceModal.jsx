import React, { useState } from "react";
import { X, Search, Phone, FileText, ArrowRight, Loader2, AlertCircle, CheckCircle2, Copy } from "./Icons";
import { lookupComplaintsByContact } from "../api";
import StatusBadge from "./StatusBadge";

export default function FindGrievanceModal({ isOpen, onClose, onSelectComplaint }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [copiedId, setCopiedId] = useState("");

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 3) {
      setError("Please enter at least 3 digits of your mobile number or Citizen User ID.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const data = await lookupComplaintsByContact(query.trim());
      setResults(data);
      if (data.length === 0) {
        setError("No registered grievances found matching this mobile number or ID.");
      }
    } catch (err) {
      setError(err.message || "Failed to search grievances. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(11, 37, 69, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        animation: "modalFadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0b2545 0%, #1d4e89 100%)",
            color: "#ffffff",
            padding: "1.25rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search size={20} color="#fef9e7" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                Find Grievance Number
              </h2>
              <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                Retrieve lost Registration Numbers by registered contact
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              border: "none",
              color: "#ffffff",
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          <form onSubmit={handleSearch} style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="findQuery"
              style={{
                display: "block",
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: "0.4rem",
              }}
            >
              Registered Mobile Number or Citizen User ID:
            </label>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Phone
                  size={16}
                  color="#94a3b8"
                  style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  id="findQuery"
                  type="text"
                  placeholder="e.g. 9876543210 or aaradhya"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 0.75rem 0.75rem 2.25rem",
                    borderRadius: "8px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.95rem",
                    outline: "none",
                  }}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ minWidth: "110px", padding: "0.75rem 1rem", fontSize: "0.9rem" }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                <span>Find</span>
              </button>
            </div>
            <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "0.35rem" }}>
              Enter the phone number or user ID you used when submitting the grievance.
            </div>
          </form>

          {/* Error / No Result Alert */}
          {error && (
            <div
              style={{
                backgroundColor: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: "8px",
                padding: "0.85rem 1rem",
                color: "#9f1239",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Results List */}
          {results && results.length > 0 && (
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Found {results.length} Registered {results.length === 1 ? "Grievance" : "Grievances"}:
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {results.map((item) => (
                  <div
                    key={item.complaint_id}
                    style={{
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "1rem",
                      backgroundColor: "#f8fafc",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "1.05rem", fontWeight: 800, color: "#0b2545" }}>
                          {item.complaint_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.complaint_id)}
                          title="Copy Complaint ID"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "2px 4px",
                            color: copiedId === item.complaint_id ? "#059669" : "#64748b",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          {copiedId === item.complaint_id ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                        </button>
                      </div>

                      <StatusBadge status={item.status} />
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                      <strong>Department:</strong> {item.department}
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      <strong>Filed On:</strong> {item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recently"} &bull; <strong>Complainant:</strong> {item.citizen_name}
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        onSelectComplaint(item.complaint_id);
                        onClose();
                      }}
                      style={{
                        padding: "0.55rem 0.85rem",
                        fontSize: "0.85rem",
                        marginTop: "0.25rem",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <span>Track This Grievance Status</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
