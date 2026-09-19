import React, { useState } from "react";
import {
  X,
  User,
  Phone,
  MapPin,
  FileText,
  Cpu,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Check,
  Star,
  Camera,
  Upload,
  UserCheck,
} from "./Icons";
import {
  assignOfficer,
  uploadResolutionProof,
  getMediaUrl,
} from "../api";

export default function ComplaintDetailDrawer({
  complaint,
  onClose,
  onStatusUpdate,
  updating = false,
}) {
  const [newStatus, setNewStatus] = useState(complaint?.status || "Submitted");
  const [adminNotes, setAdminNotes] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Officer Assignment State
  const [officerName, setOfficerName] = useState(complaint?.assigned_officer_name || "");
  const [officerPhone, setOfficerPhone] = useState(complaint?.assigned_officer_phone || "");
  const [slaHours, setSlaHours] = useState(48);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Resolution Proof Upload State
  const [resolutionProofFile, setResolutionProofFile] = useState(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [resolutionAttachmentUrl, setResolutionAttachmentUrl] = useState(
    complaint?.resolution_attachment_url || ""
  );

  // Zoom Image Modal State
  const [zoomedImage, setZoomedImage] = useState(null);

  if (!complaint) return null;

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    let finalProofUrl = resolutionAttachmentUrl;

    // If file is selected and not uploaded yet, upload it
    if (resolutionProofFile) {
      setIsUploadingProof(true);
      try {
        const uploadRes = await uploadResolutionProof(resolutionProofFile);
        finalProofUrl = uploadRes.attachment_url;
        setResolutionAttachmentUrl(finalProofUrl);
      } catch (err) {
        alert("Failed to upload resolution proof: " + err.message);
        setIsUploadingProof(false);
        return;
      } finally {
        setIsUploadingProof(false);
      }
    }

    const ok = await onStatusUpdate(
      complaint.complaint_id,
      newStatus,
      adminNotes,
      finalProofUrl || undefined
    );
    if (ok) {
      setUpdateSuccess(true);
      setAdminNotes("");
      setResolutionProofFile(null);
      setTimeout(() => setUpdateSuccess(false), 3000);
    }
  };

  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    if (!officerName.trim()) {
      alert("Please specify the officer's name.");
      return;
    }
    setIsAssigning(true);
    try {
      await assignOfficer(complaint.complaint_id, {
        officer_name: officerName.trim(),
        officer_phone: officerPhone.trim() || undefined,
        sla_hours: Number(slaHours) || 48,
      });
      setAssignSuccess(true);
      setTimeout(() => setAssignSuccess(false), 3000);
      // Refresh status via parent callback
      onStatusUpdate(complaint.complaint_id, complaint.status, `Assigned to ${officerName}`);
    } catch (err) {
      alert("Failed to assign officer: " + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return isoString;
    }
  };

  const rawConfidence =
    complaint.ai_confidence !== undefined ? complaint.ai_confidence : complaint.confidence;
  const confidencePct = Math.round((rawConfidence || 0) * 100);

  const historyList =
    complaint.status_history?.length > 0
      ? complaint.status_history
      : complaint.history || [];

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <div className="drawer-meta-sub">
              Official Grievance Dossier • Submitted {formatDate(complaint.created_at)}
            </div>
            <div className="drawer-title-row">
              <span className="drawer-cid">{complaint.complaint_id}</span>
              <span className={`status-pill ${complaint.status.replace(/\s+/g, "-")}`}>
                {complaint.status}
              </span>
              <span className={`prio-badge ${complaint.priority}`}>
                {complaint.priority}
              </span>
            </div>
          </div>
          <button className="drawer-close-btn" onClick={onClose} title="Close Panel">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Dossier Content */}
        <div className="drawer-body">
          {/* Section 1: Confidential Citizen Info */}
          <div className="drawer-card">
            <div className="drawer-card-header">
              <div className="drawer-card-title">
                <User size={15} color="#3b82f6" />
                <span>Citizen Dossier (Confidential PII)</span>
              </div>
              <span className="admin-badge-confidential">Admin Protected</span>
            </div>

            <div className="citizen-info-grid">
              <div className="citizen-info-item">
                <label>Citizen Account ID</label>
                <span style={{ fontFamily: "var(--font-mono)", color: "#60a5fa" }}>
                  {complaint.citizen_user_id ? `@${complaint.citizen_user_id}` : "Unlinked"}
                </span>
              </div>
              <div className="citizen-info-item">
                <label>Citizen Full Name</label>
                <span>{complaint.citizen_name || complaint.name || "Anonymous"}</span>
              </div>
              <div className="citizen-info-item">
                <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Phone size={11} /> Contact Phone
                </label>
                <span style={{ fontFamily: "var(--font-mono)" }}>
                  {complaint.citizen_phone || complaint.phone || "Not specified"}
                </span>
              </div>
              {complaint.pincode ? (
                <div className="citizen-info-item">
                  <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={11} /> Postal Pincode
                  </label>
                  <span>PIN {complaint.pincode}</span>
                </div>
              ) : null}
              <div className="citizen-info-item" style={{ gridColumn: "span 2" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={11} /> Registered Address
                </label>
                <span>{complaint.citizen_address || complaint.address || "Not specified"}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Statement Narrative */}
          <div className="drawer-card">
            <div className="drawer-card-header">
              <div className="drawer-card-title">
                <FileText size={15} color="#f97316" />
                <span>Citizen Statement Narrative</span>
              </div>
            </div>
            <div className="narrative-box">{complaint.complaint_text}</div>
          </div>

          {/* Section 2b: Photographic Evidence Gallery */}
          <div className="drawer-card">
            <div className="drawer-card-header">
              <div className="drawer-card-title">
                <Camera size={15} color="#38bdf8" />
                <span>Photographic Evidence & Site Verification</span>
              </div>
            </div>

            <div className="evidence-grid-split">
              {/* Citizen Initial Photo */}
              <div className="evidence-col">
                <div className="evidence-col-title">Citizen Incident Photo ("Before")</div>
                {complaint.attachment_url ? (
                  <div
                    className="evidence-img-wrap"
                    onClick={() => setZoomedImage(getMediaUrl(complaint.attachment_url))}
                  >
                    <img
                      src={getMediaUrl(complaint.attachment_url)}
                      alt="Citizen Evidence"
                      className="evidence-thumb"
                    />
                    <div className="evidence-zoom-hint">Click to enlarge</div>
                  </div>
                ) : (
                  <div className="evidence-empty-box">No photo uploaded by citizen</div>
                )}
              </div>

              {/* Resolution Proof Photo */}
              <div className="evidence-col">
                <div className="evidence-col-title">Official Resolution Proof ("After")</div>
                {complaint.resolution_attachment_url ? (
                  <div
                    className="evidence-img-wrap"
                    onClick={() =>
                      setZoomedImage(getMediaUrl(complaint.resolution_attachment_url))
                    }
                  >
                    <img
                      src={getMediaUrl(complaint.resolution_attachment_url)}
                      alt="Resolution Proof"
                      className="evidence-thumb"
                    />
                    <div className="evidence-zoom-hint">Click to enlarge</div>
                  </div>
                ) : (
                  <div className="evidence-empty-box">No resolution proof uploaded yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: AI Diagnostic */}
          <div className="drawer-card">
            <div className="drawer-card-header">
              <div className="drawer-card-title">
                <Cpu size={15} color="#06b6d4" />
                <span>AI Triage Diagnostic & Routing</span>
              </div>
              {complaint.needs_human_review && (
                <span
                  className="prio-badge HIGH"
                  style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <ShieldAlert size={12} />
                  Human Review Required
                </span>
              )}
            </div>

            <div className="ai-meta-grid">
              <div className="ai-meta-tile">
                <label>Allocated Department</label>
                <span>{complaint.department}</span>
              </div>
              <div className="ai-meta-tile">
                <label>Assessed Priority</label>
                <span>{complaint.priority}</span>
              </div>
            </div>

            <div className="confidence-bar-wrap">
              <div className="confidence-meta">
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  Classification Confidence
                </span>
                <strong style={{ fontFamily: "var(--font-mono)", color: "#ffffff" }}>
                  {confidencePct}%
                </strong>
              </div>
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{
                    width: `${confidencePct}%`,
                    backgroundColor:
                      confidencePct >= 85 ? "#10b981" : confidencePct >= 70 ? "#eab308" : "#ef4444",
                  }}
                />
              </div>
            </div>

            {(complaint.ai_reason || complaint.reason) && (
              <div className="ai-rationale-box">
                <strong
                  style={{
                    display: "block",
                    marginBottom: "0.25rem",
                    color: "#94a3b8",
                    fontStyle: "normal",
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                  }}
                >
                  Model Rationale
                </strong>
                "{complaint.ai_reason || complaint.reason}"
              </div>
            )}
          </div>

          {/* Section 4: Departmental Officer Assignment & SLA */}
          <form className="drawer-card" onSubmit={handleAssignOfficer}>
            <div className="drawer-card-header">
              <div className="drawer-card-title">
                <UserCheck size={15} color="#a855f7" />
                <span>Field Officer Assignment & SLA Target</span>
              </div>
              {complaint.assigned_officer_name && (
                <span className="sla-pill ontrack" style={{ fontSize: "0.72rem" }}>
                  Assigned: {complaint.assigned_officer_name}
                </span>
              )}
            </div>

            <div className="status-form-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              <div className="form-field-group">
                <label>Officer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Insp. R. K. Sharma"
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="status-form-input"
                  required
                />
              </div>

              <div className="form-field-group">
                <label>Officer Phone</label>
                <input
                  type="text"
                  placeholder="e.g. 9820011223"
                  value={officerPhone}
                  onChange={(e) => setOfficerPhone(e.target.value)}
                  className="status-form-input"
                />
              </div>

              <div className="form-field-group">
                <label>SLA Window (Hours)</label>
                <select
                  value={slaHours}
                  onChange={(e) => setSlaHours(e.target.value)}
                  className="status-form-select"
                >
                  <option value={12}>12 Hours (Emergency)</option>
                  <option value={24}>24 Hours (Critical)</option>
                  <option value={48}>48 Hours (High)</option>
                  <option value={72}>72 Hours (Standard)</option>
                  <option value={120}>120 Hours (5 Days)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                {complaint.sla_due_date ? (
                  <span>SLA Due: <strong>{formatDate(complaint.sla_due_date)}</strong></span>
                ) : (
                  <span>No active SLA timestamp assigned yet.</span>
                )}
              </div>
              <button
                type="submit"
                disabled={isAssigning}
                className="btn-update-status"
                style={{ backgroundColor: "#8b5cf6" }}
              >
                {isAssigning ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                <span>{assignSuccess ? "Assigned!" : "Assign Field Officer"}</span>
              </button>
            </div>
          </form>

          {/* Section 5: Citizen Feedback & Rating (if rated) */}
          <div className="drawer-card">
            <div className="drawer-card-header">
              <div className="drawer-card-title">
                <Star size={15} color="#eab308" fill="#eab308" />
                <span>Citizen Satisfaction & Resolution Feedback</span>
              </div>
            </div>

            {complaint.feedback_rating ? (
              <div className="feedback-display-box">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "3px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        color={star <= complaint.feedback_rating ? "#eab308" : "#475569"}
                        fill={star <= complaint.feedback_rating ? "#eab308" : "none"}
                      />
                    ))}
                  </div>
                  <strong style={{ color: "#f8fafc", fontSize: "0.9rem" }}>
                    {complaint.feedback_rating} / 5 Stars
                  </strong>
                  {complaint.feedback_created_at && (
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: "auto" }}>
                      Submitted {formatDate(complaint.feedback_created_at)}
                    </span>
                  )}
                </div>
                {complaint.feedback_comment ? (
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#cbd5e1", fontStyle: "italic" }}>
                    "{complaint.feedback_comment}"
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b" }}>
                    Citizen left a star rating without textual comments.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ padding: "0.75rem", textAlign: "center", color: "#64748b", fontSize: "0.82rem" }}>
                {complaint.status === "Resolved"
                  ? "Citizen has not submitted resolution feedback yet."
                  : "Resolution feedback will become available once this grievance is marked Resolved."}
              </div>
            )}
          </div>

          {/* Section 6: Administrative Status Update */}
          <form className="drawer-card" onSubmit={handleUpdate}>
            <div className="drawer-card-header">
              <div className="drawer-card-title">
                <Clock size={15} color="#10b981" />
                <span>Administrative Action & Lifecycle Transition</span>
              </div>
            </div>

            <div className="status-form-grid">
              <div className="form-field-group">
                <label>Target Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="status-form-select"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="form-field-group">
                <label>Official Action Note</label>
                <input
                  type="text"
                  placeholder="e.g. Pipeline leak plugged and repaired by field team"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="status-form-input"
                />
              </div>
            </div>

            {/* Resolution Proof Upload Field (especially relevant when resolving) */}
            <div className="form-field-group" style={{ marginTop: "0.75rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Upload size={12} />
                Attach Resolution Proof / "After" Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setResolutionProofFile(e.target.files?.[0] || null)}
                style={{
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  padding: "0.4rem",
                  border: "1px dashed #334155",
                  borderRadius: "6px",
                  width: "100%",
                }}
              />
              {resolutionProofFile && (
                <span style={{ fontSize: "0.75rem", color: "#38bdf8", marginTop: "4px" }}>
                  Selected: {resolutionProofFile.name} ({(resolutionProofFile.size / 1024).toFixed(0)} KB)
                </span>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1rem",
              }}
            >
              <div>
                {updateSuccess && (
                  <span
                    style={{
                      color: "#34d399",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Check size={14} /> Status transition saved to audit registry
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="btn-update-status"
                disabled={updating || isUploadingProof}
              >
                {updating || isUploadingProof ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : null}
                <span>Update Grievance Status</span>
              </button>
            </div>
          </form>

          {/* Section 7: Official Audit Trail */}
          <div className="drawer-card">
            <div className="drawer-card-header">
              <div className="drawer-card-title">
                <CheckCircle2 size={15} color="#3b82f6" />
                <span>Official Audit Trail ({historyList.length} Recorded Events)</span>
              </div>
            </div>

            {historyList.length === 0 ? (
              <p style={{ fontSize: "0.78rem", color: "#64748b", fontStyle: "italic" }}>
                No subsequent status audit events logged.
              </p>
            ) : (
              <div className="audit-timeline">
                {historyList.map((hist) => (
                  <div key={hist.id} className="audit-node">
                    <div className="audit-node-header">
                      <span className="audit-status-change">
                        {hist.old_status ? `${hist.old_status} → ` : ""}
                        <strong>{hist.new_status}</strong>
                      </span>
                      <span className="audit-time">{formatDate(hist.created_at)}</span>
                    </div>
                    <div className="audit-details">
                      By: <strong style={{ color: "#e2e8f0" }}>{hist.changed_by}</strong>
                      {(hist.admin_note || hist.notes) && (
                        <span
                          style={{
                            display: "block",
                            marginTop: "2px",
                            fontStyle: "italic",
                            color: "#cbd5e1",
                          }}
                        >
                          "{hist.admin_note || hist.notes}"
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Full Zoom Modal */}
      {zoomedImage && (
        <div className="zoom-modal-backdrop" onClick={() => setZoomedImage(null)}>
          <div className="zoom-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="zoom-modal-close" onClick={() => setZoomedImage(null)}>
              <X size={20} />
            </button>
            <img src={zoomedImage} alt="Enlarged Evidence" className="zoom-modal-img" />
          </div>
        </div>
      )}
    </div>
  );
}

