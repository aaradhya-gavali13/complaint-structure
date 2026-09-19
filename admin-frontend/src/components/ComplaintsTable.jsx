import React, { useState } from "react";
import {
  Eye,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Check,
  X,
} from "./Icons";
import { bulkUpdateStatus } from "../api";

export default function ComplaintsTable({
  complaints = [],
  loading = false,
  total = 0,
  page = 1,
  limit = 10,
  totalPages = 1,
  filters,
  onFilterChange,
  onPageChange,
  onLimitChange,
  onSelectComplaint,
  departments = [],
  priorities = [],
  onRefresh,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("In Progress");
  const [bulkNote, setBulkNote] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState(null);

  const getConfidenceBadge = (confidence) => {
    if (confidence === undefined || confidence === null) return null;
    const val = typeof confidence === "number" ? confidence : parseFloat(confidence);
    const pct = Math.round(val * 100);

    if (val >= 0.85) {
      return <span className="conf-pill high">{pct}%</span>;
    } else if (val >= 0.7) {
      return <span className="conf-pill med">{pct}%</span>;
    } else {
      return <span className="conf-pill low">{pct}%</span>;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const renderSlaBadge = (complaint) => {
    if (complaint.status === "Resolved") {
      return <span className="sla-pill resolved">✓ Resolved</span>;
    }
    if (complaint.status === "Rejected") {
      return <span className="sla-pill rejected">✕ Rejected</span>;
    }
    if (!complaint.sla_due_date) {
      return <span className="sla-pill none">—</span>;
    }
    const now = new Date().getTime();
    const due = new Date(complaint.sla_due_date).getTime();
    const diffHours = Math.round((due - now) / (1000 * 60 * 60));

    if (diffHours < 0) {
      return (
        <span className="sla-pill overdue" title={`Due: ${formatDate(complaint.sla_due_date)}`}>
          🚨 Overdue ({Math.abs(diffHours)}h)
        </span>
      );
    } else if (diffHours <= 12) {
      return (
        <span className="sla-pill urgent" title={`Due: ${formatDate(complaint.sla_due_date)}`}>
          ⏳ {diffHours}h left
        </span>
      );
    } else {
      return (
        <span className="sla-pill ontrack" title={`Due: ${formatDate(complaint.sla_due_date)}`}>
          🕒 {diffHours}h left
        </span>
      );
    }
  };

  const allSelectedOnPage =
    complaints.length > 0 &&
    complaints.every((c) => selectedIds.includes(c.complaint_id));

  const handleSelectAll = () => {
    if (allSelectedOnPage) {
      setSelectedIds((prev) =>
        prev.filter((id) => !complaints.some((c) => c.complaint_id === id))
      );
    } else {
      const newIds = new Set([...selectedIds, ...complaints.map((c) => c.complaint_id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelect = (complaintId, e) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(complaintId)
        ? prev.filter((id) => id !== complaintId)
        : [...prev, complaintId]
    );
  };

  const handleExecuteBulkUpdate = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkUpdating(true);
    setBulkFeedback(null);
    try {
      const res = await bulkUpdateStatus({
        complaint_ids: selectedIds,
        status: bulkStatus,
        admin_note: bulkNote.trim() || `Bulk updated to ${bulkStatus}`,
      });
      setBulkFeedback({
        success: true,
        message: `Updated ${res.updated_count || selectedIds.length} grievances to "${bulkStatus}"!`,
      });
      setSelectedIds([]);
      setBulkNote("");
      if (onRefresh) onRefresh();
      setTimeout(() => setBulkFeedback(null), 4000);
    } catch (err) {
      setBulkFeedback({
        success: false,
        message: err.message || "Failed to execute bulk update.",
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.priority) ||
    Boolean(filters.department) ||
    Boolean(filters.status) ||
    filters.human_review !== null;

  return (
    <div style={{ position: "relative" }}>
      {/* Top Filter Bar */}
      <div className="filter-panel">
        <div className="search-wrap">
          <span className="search-icon-pos">
            <Search size={15} />
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search complaint ID, citizen name, keywords, department..."
            value={filters.search || ""}
            onChange={(e) => onFilterChange("search", e.target.value)}
          />
        </div>

        <div className="filter-controls-wrap">
          {/* Priority Select */}
          <select
            className="filter-select"
            value={filters.priority || ""}
            onChange={(e) => onFilterChange("priority", e.target.value)}
          >
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Department Select */}
          <select
            className="filter-select"
            style={{ maxWidth: "180px" }}
            value={filters.department || ""}
            onChange={(e) => onFilterChange("department", e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            className="filter-select"
            value={filters.status || ""}
            onChange={(e) => onFilterChange("status", e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Human Review Filter Button */}
          <button
            onClick={() =>
              onFilterChange("human_review", filters.human_review === true ? null : true)
            }
            className={`btn-filter-toggle ${filters.human_review === true ? "active" : ""}`}
          >
            <ShieldAlert size={14} />
            <span>Review Queue</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={() => onFilterChange("reset", null)}
              className="reset-filter-link"
            >
              Reset Filters
            </button>
          )}

          <button
            onClick={onRefresh}
            title="Refresh Table"
            className="icon-btn"
            style={{ width: "32px", height: "32px" }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-action-bar">
          <div className="bulk-bar-left">
            <span className="bulk-count-badge">
              {selectedIds.length} Selected
            </span>
            <span style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
              Apply batch state transition:
            </span>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bulk-select"
            >
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
            <input
              type="text"
              placeholder="Batch action note (optional)..."
              value={bulkNote}
              onChange={(e) => setBulkNote(e.target.value)}
              className="bulk-input"
            />
            <button
              onClick={handleExecuteBulkUpdate}
              disabled={isBulkUpdating}
              className="btn-bulk-apply"
            >
              {isBulkUpdating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              <span>Apply to {selectedIds.length} Grievances</span>
            </button>
          </div>
          <button
            onClick={() => setSelectedIds([])}
            className="btn-bulk-cancel"
            title="Deselect All"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {bulkFeedback && (
        <div
          className={`bulk-toast ${bulkFeedback.success ? "success" : "error"}`}
        >
          {bulkFeedback.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{bulkFeedback.message}</span>
        </div>
      )}

      {/* Table Body */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "38px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={allSelectedOnPage}
                    onChange={handleSelectAll}
                    title="Select all on this page"
                    style={{ cursor: "pointer", accentColor: "var(--primary)" }}
                  />
                </th>
                <th>Complaint ID</th>
                <th>Citizen / Locality</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA / Turnaround</th>
                <th>AI Confidence</th>
                <th>Submitted</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && complaints.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontFamily: "var(--font-mono)" }}>
                      <RefreshCw size={16} className="animate-spin" />
                      Loading records from registry...
                    </div>
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "3.5rem", color: "#94a3b8" }}>
                    <div style={{ maxWidth: "340px", margin: "0 auto", textAlign: "center" }}>
                      <FileText size={32} color="#64748b" style={{ margin: "0 auto 0.75rem" }} />
                      <p style={{ fontWeight: 600, color: "#ffffff", marginBottom: "0.25rem" }}>
                        No Complaints Found
                      </p>
                      <p style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        No grievances match the current filter selection. Try adjusting or clearing search parameters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                complaints.map((c) => {
                  const isSelected = selectedIds.includes(c.complaint_id);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectComplaint(c.complaint_id)}
                      className={isSelected ? "row-selected" : ""}
                    >
                      <td
                        style={{ textAlign: "center" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(c.complaint_id, e)}
                          style={{ cursor: "pointer", accentColor: "var(--primary)" }}
                        />
                      </td>
                      <td>
                        <div className="cid-cell">
                          <span>{c.complaint_id}</span>
                          {c.needs_human_review && (
                            <span
                              title="Human Review Required"
                              className="review-flag-dot"
                            />
                          )}
                          {c.attachment_url && (
                            <span title="Contains Photo Attachment" style={{ fontSize: "0.75rem" }}>
                              📷
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#f1f5f9" }}>
                          {c.citizen_name || c.name || "Citizen"}
                        </div>
                        {c.pincode && (
                          <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                            PIN {c.pincode}
                          </div>
                        )}
                      </td>
                      <td style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.department}
                      </td>
                      <td>
                        <span className={`prio-badge ${c.priority}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${c.status.replace(/\s+/g, '-')}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        {renderSlaBadge(c)}
                      </td>
                      <td>{getConfidenceBadge(c.ai_confidence || c.confidence)}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-dim)" }}>
                        {formatDate(c.created_at)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectComplaint(c.complaint_id);
                          }}
                          className="btn-review-row"
                        >
                          <Eye size={12} />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="pagination-bar">
          <div>
            Showing <strong style={{ color: "#ffffff", fontFamily: "var(--font-mono)" }}>{complaints.length}</strong> of{" "}
            <strong style={{ color: "#ffffff", fontFamily: "var(--font-mono)" }}>{total}</strong> complaints
            <span style={{ margin: "0 0.5rem", color: "#334155" }}>|</span>
            <span>Rows: </span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="filter-select"
              style={{ padding: "0.2rem 0.4rem", marginLeft: "0.25rem" }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="page-controls">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
              Page {page} of {totalPages || 1}
            </span>
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="btn-page-nav"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="btn-page-nav"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

