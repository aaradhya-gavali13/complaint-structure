import React, { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  Search,
  FilePlus,
  Shield,
  Printer,
  Calendar,
  Tag,
  Lock,
} from "../components/Icons";
import { StatusBadge } from "../components/StatusBadge";

export default function SuccessPage({ submissionData, setActivePage, setTrackId }) {
  const [copied, setCopied] = useState(false);

  if (!submissionData) {
    return (
      <div className="gov-container main-wrapper" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h2>No Recent Submission Found</h2>
        <p style={{ color: "#64748b", margin: "1rem 0 2rem" }}>
          You have not submitted a grievance during this session.
        </p>
        <button className="btn btn-primary" onClick={() => setActivePage("submit")}>
          Submit a Complaint
        </button>
      </div>
    );
  }

  const { complaint_id, status, created_at, message } = submissionData;

  const handleCopy = () => {
    navigator.clipboard.writeText(complaint_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTrackDirect = () => {
    setTrackId(complaint_id);
    setActivePage("track");
  };

  const formattedDate = created_at
    ? new Date(created_at).toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "medium",
      })
    : new Date().toLocaleString();

  return (
    <div className="gov-container main-wrapper">
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        {/* Official Digital Acknowledgment Receipt */}
        <div className="civic-card" style={{ padding: "2.5rem", position: "relative" }}>
          {/* Official Stamp Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              background: "#ecfdf5",
              color: "#065f46",
              padding: "0.75rem",
              borderRadius: "8px",
              marginBottom: "2rem",
              fontWeight: 600,
              fontSize: "0.95rem",
              border: "1px solid #a7f3d0",
            }}
          >
            <CheckCircle2 size={22} color="#059669" />
            <span>Complaint submitted successfully</span>
          </div>

          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h1 style={{ fontSize: "1.8rem", color: "#0b2545", marginBottom: "0.5rem" }}>
              Official Grievance Acknowledgment
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
              Your public grievance has been received and indexed into the National Grievance Monitoring System. Please save your registration credentials below.
            </p>
          </div>

          {/* Registration Number Highlight Box */}
          <div className="receipt-box">
            <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Official Complaint Registration ID
            </span>

            <div>
              <div className="receipt-id-display">
                <span className="receipt-id-text">{complaint_id}</span>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={handleCopy}
                  title="Copy Complaint ID"
                >
                  {copied ? (
                    <>
                      <Check size={14} color="#059669" />
                      <span style={{ color: "#059669" }}>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Keep this Registration ID safe. You will need it to track your grievance status and communicate with grievance officers.
            </p>
          </div>

          {/* Submission Particulars (Safeguarding citizen personal info) */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                  Submission Date &amp; Time
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem", color: "#1e293b", fontWeight: 500, fontSize: "0.9rem" }}>
                  <Calendar size={15} color="#134074" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                  Current Status
                </span>
                <div style={{ marginTop: "0.25rem" }}>
                  <StatusBadge status={status || "Submitted"} />
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Protection Notice */}
          <div className="civic-callout" style={{ marginBottom: "2rem" }}>
            <Lock className="civic-callout-icon" size={18} />
            <div>
              <strong>Privacy Protocol:</strong> In accordance with civic confidentiality guidelines, your personal identity credentials (Name, Phone Number, and Postal Address) are strictly locked to authorized government investigators and are not displayed on this acknowledgment or public tracking interfaces.
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-lg" onClick={handleTrackDirect}>
              <Search size={18} />
              Track Complaint
            </button>

            <button
              className="btn btn-secondary btn-lg"
              onClick={() => window.print()}
            >
              <Printer size={18} />
              Print Receipt
            </button>

            <button
              className="btn btn-secondary btn-lg"
              onClick={() => setActivePage("submit")}
            >
              <FilePlus size={18} />
              Lodge Another Grievance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
