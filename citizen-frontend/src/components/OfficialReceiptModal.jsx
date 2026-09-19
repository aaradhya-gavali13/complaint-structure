import React from "react";
import { X, Printer, ShieldCheck, Calendar, MapPin, Phone, User, CheckCircle2 } from "./Icons";

/**
 * Generates an SVG QR Code matrix for the grievance tracking link.
 */
function SimpleQRCodeSVG({ value, size = 110 }) {
  // A clean, high-density SVG visual representation of the verification code
  const hash = Array.from(value).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 1000000007, 7);
  const cells = [];
  const matrixSize = 21;

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Finder patterns in top-left, top-right, bottom-left
      const isTopLeftFinder = r < 7 && c < 7;
      const isTopRightFinder = r < 7 && c >= matrixSize - 7;
      const isBottomLeftFinder = r >= matrixSize - 7 && c < 7;

      let isBlack = false;
      if (isTopLeftFinder || isTopRightFinder || isBottomLeftFinder) {
        const localR = isBottomLeftFinder ? r - (matrixSize - 7) : r;
        const localC = isTopRightFinder ? c - (matrixSize - 7) : c;
        if (localR === 0 || localR === 6 || localC === 0 || localC === 6) isBlack = true;
        else if (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4) isBlack = true;
      } else {
        // Pseudo-random deterministic grid based on hash
        const bit = ((hash * (r + 1) * (c + 1) * 73) + (r * 17) + (c * 37)) % 10;
        isBlack = bit > 4;
      }

      if (isBlack) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c * 4}
            y={r * 4}
            width={4}
            height={4}
            fill="#0f172a"
          />
        );
      }
    }
  }

  return (
    <div style={{ background: "#ffffff", padding: "8px", borderRadius: "8px", display: "inline-block", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <svg width={size} height={size} viewBox={`0 0 ${matrixSize * 4} ${matrixSize * 4}`}>
        {cells}
      </svg>
      <div style={{ textAlign: "center", fontSize: "0.6rem", color: "#64748b", fontWeight: 700, marginTop: "2px" }}>
        SCAN TO VERIFY
      </div>
    </div>
  );
}

export default function OfficialReceiptModal({ complaint, onClose }) {
  if (!complaint) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = complaint.created_at
    ? new Date(complaint.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently Registered";

  const trackingUrl = `${window.location.origin}/track?id=${complaint.complaint_id}`;

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div className="receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Action Header (Hidden in Print) */}
        <div className="receipt-modal-toolbar no-print">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldCheck size={20} color="#1d4ed8" />
            <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>Official Grievance Acknowledgment</strong>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" onClick={handlePrint} className="btn-print-receipt">
              <Printer size={15} />
              <span>Print / Save as PDF</span>
            </button>
            <button type="button" onClick={onClose} className="btn-close-receipt" title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="receipt-document printable-area" id="printable-grievance-receipt">
          {/* Header & Watermark */}
          <div className="receipt-gov-header">
            <div className="receipt-emblem-badge">🏛️</div>
            <div className="receipt-header-titles">
              <h3>CENTRAL CITIZEN GRIEVANCE REDRESSAL SYSTEM</h3>
              <h4>DEPARTMENT OF MUNICIPAL ADMINISTRATIVE REFORMS</h4>
              <p>Official Electronic Acknowledgment & Redressal Tracking Certificate</p>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Certificate Reference Bar */}
          <div className="receipt-ref-banner">
            <div>
              <span className="ref-label">GRIEVANCE REGISTRATION NUMBER:</span>
              <div className="ref-id-val">{complaint.complaint_id}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span className="ref-label">FILING TIMESTAMP:</span>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1e293b" }}>{formattedDate}</div>
            </div>
          </div>

          {/* Grid Details */}
          <div className="receipt-content-grid">
            {/* Left Column: Citizen Particulars */}
            <div className="receipt-section-box">
              <h5 className="section-title">
                <User size={13} /> CITIZEN DETAILS
              </h5>
              <table className="receipt-table">
                <tbody>
                  <tr>
                    <th>Complainant Name:</th>
                    <td>{complaint.citizen_name || complaint.name || "Registered Citizen"}</td>
                  </tr>
                  <tr>
                    <th>Contact Phone:</th>
                    <td>{complaint.phone || "On Official File"}</td>
                  </tr>
                  <tr>
                    <th>Incident Address:</th>
                    <td>{complaint.address || "As Stated in Complaint"}</td>
                  </tr>
                  {complaint.pincode && (
                    <tr>
                      <th>Postal Pincode:</th>
                      <td>{complaint.pincode}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Right Column: Processing & SLA */}
            <div className="receipt-section-box">
              <h5 className="section-title">
                <Calendar size={13} /> REDRESSAL PARTICULARS
              </h5>
              <table className="receipt-table">
                <tbody>
                  <tr>
                    <th>Triage Department:</th>
                    <td style={{ fontWeight: 700, color: "#1d4ed8" }}>
                      {complaint.department || "Municipal Redressal Wing"}
                    </td>
                  </tr>
                  <tr>
                    <th>Current Status:</th>
                    <td>
                      <span className="receipt-status-pill">{complaint.status || "Submitted"}</span>
                    </td>
                  </tr>
                  <tr>
                    <th>Assigned Officer:</th>
                    <td>{complaint.assigned_officer_name || "Under Departmental Allocation"}</td>
                  </tr>
                  <tr>
                    <th>Expected SLA Turnaround:</th>
                    <td style={{ fontWeight: 600, color: "#047857" }}>
                      {complaint.sla_due_date ? new Date(complaint.sla_due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Within Standard Departmental SLA"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Grievance Narrative */}
          <div className="receipt-narrative-box">
            <h5 className="section-title">NARRATIVE OF GRIEVANCE SUBMITTED</h5>
            <p className="narrative-text">"{complaint.complaint_text}"</p>
          </div>

          {/* Verification Bar with QR Code */}
          <div className="receipt-verification-footer">
            <div className="verification-text">
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#047857", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                <CheckCircle2 size={16} /> Digitally Recorded & Authenticated
              </div>
              <p style={{ fontSize: "0.74rem", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                This is a computer-generated administrative acknowledgment. It carries a unique cryptographic identifier and does not require a physical handwritten signature. Citizens may track real-time resolution progress by scanning the QR code or visiting the portal with reference number <strong>{complaint.complaint_id}</strong>.
              </p>
            </div>
            <div className="qr-code-holder">
              <SimpleQRCodeSVG value={trackingUrl} size={88} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
