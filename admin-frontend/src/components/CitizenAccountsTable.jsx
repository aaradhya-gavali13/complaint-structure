import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Key,
  Phone,
  User,
  Clock,
  Download,
  Loader2,
  Ban,
  UserCheck,
  RotateCcw,
  X,
} from "./Icons";
import {
  fetchCitizens,
  downloadCitizensCSV,
  resetCitizenPassword,
  toggleCitizenStatus,
} from "../api";

export default function CitizenAccountsTable({ onFilterByCitizen }) {
  const [citizens, setCitizens] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);

  // State to track unmasked passwords (set of citizen ids)
  const [revealedPasswords, setRevealedPasswords] = useState({});
  // State for copy feedback
  const [copiedId, setCopiedId] = useState(null);

  // Reset Password Modal State
  const [resetModalCitizen, setResetModalCitizen] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetSuccess, setResetSuccess] = useState(null);

  // Suspend / Activate State
  const [togglingUserId, setTogglingUserId] = useState(null);

  const loadCitizens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCitizens({
        page,
        limit,
        search: search.trim() || undefined,
      });
      setCitizens(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      setError(err.message || "Failed to load customer accounts directory.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    loadCitizens();
  }, [loadCitizens]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const togglePasswordVisibility = (citizenId) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [citizenId]: !prev[citizenId],
    }));
  };

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState(null);

  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportError(null);
    try {
      await downloadCitizensCSV();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error("Export error:", err);
      setExportError(err.message || "Failed to download customer directory CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenResetModal = (citizen) => {
    setResetModalCitizen(citizen);
    setNewPasswordInput("");
    setResetError(null);
    setResetSuccess(null);
    setShowNewPass(false);
  };

  const handleExecutePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }
    setIsResetting(true);
    setResetError(null);
    try {
      await resetCitizenPassword(resetModalCitizen.user_id, {
        new_password: newPasswordInput,
      });
      setResetSuccess(`Password for @${resetModalCitizen.user_id} successfully updated!`);
      setTimeout(() => {
        setResetModalCitizen(null);
        loadCitizens();
      }, 1400);
    } catch (err) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleAccountStatus = async (citizen) => {
    const nextStatus = citizen.is_active === false;
    const actionLabel = nextStatus ? "activate" : "suspend";
    if (!window.confirm(`Are you sure you want to ${actionLabel} account @${citizen.user_id}?`)) {
      return;
    }
    setTogglingUserId(citizen.user_id);
    try {
      await toggleCitizenStatus(citizen.user_id, { is_active: nextStatus });
      loadCitizens();
    } catch (err) {
      alert(`Failed to ${actionLabel} account: ` + err.message);
    } finally {
      setTogglingUserId(null);
    }
  };

  return (
    <div className="citizens-registry-view">
      {/* Top Header / Stats Banner */}
      <div className="view-header-bar">
        <div>
          <h2 className="view-title flex-align-center" style={{ gap: "0.5rem" }}>
            <Users size={22} color="var(--primary)" />
            Customer Details & Credentials Registry
          </h2>
          <p className="view-subtitle">
            Directory of all registered citizens, user identifiers, contact profiles, and access credentials.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={loadCitizens}
            className="btn btn-secondary flex-align-center"
            style={{ gap: "0.4rem" }}
            title="Reload Citizen Directory"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Sync</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="btn btn-primary flex-align-center"
            style={{ gap: "0.4rem" }}
            title="Download full customer database as CSV"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="toast-success" style={{ margin: "0.5rem 0 1rem 0" }}>
          <span>Customer directory CSV successfully generated and downloaded!</span>
        </div>
      )}

      {exportError && (
        <div className="error-banner" style={{ margin: "0.5rem 0 1rem 0" }}>
          <span>{exportError}</span>
        </div>
      )}

      {/* Search and Filter Row */}
      <div className="filter-bar" style={{ marginBottom: "1.25rem" }}>
        <form onSubmit={handleSearchSubmit} className="search-form flex-align-center" style={{ gap: "0.5rem", flex: 1 }}>
          <div className="search-input-wrap" style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
            <Search size={15} className="search-icon-pos" />
            <input
              type="text"
              placeholder="Search by User ID, Citizen Name, or Phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="btn btn-outline"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadCitizens} className="btn btn-xs btn-secondary">
            Retry
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "150px" }}>User ID</th>
              <th style={{ width: "170px" }}>Citizen Name</th>
              <th style={{ width: "140px" }}>Phone</th>
              <th style={{ minWidth: "220px" }}>Password & Credentials</th>
              <th style={{ width: "110px", textAlign: "center" }}>Account Status</th>
              <th style={{ width: "150px" }}>Joined On</th>
              <th style={{ width: "90px", textAlign: "center" }}>Cases</th>
              <th style={{ width: "170px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3rem 1rem" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)" }}>
                    <RefreshCw size={20} className="animate-spin" />
                    <span>Loading customer registry records...</span>
                  </div>
                </td>
              </tr>
            ) : citizens.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "3.5rem 1rem" }}>
                  <div style={{ color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <Users size={36} color="var(--border-color)" />
                    <p style={{ fontWeight: 600, color: "var(--text-main)" }}>No citizen accounts found</p>
                    <p style={{ fontSize: "0.85rem" }}>
                      {search ? `No accounts matching "${search}". Try clearing search filters.` : "No citizens have registered on the portal yet."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              citizens.map((citizen) => {
                const isRevealed = Boolean(revealedPasswords[citizen.id]);
                const isCopied = copiedId === citizen.id;
                const displayPass = citizen.password || "••••••••";
                const isActive = citizen.is_active !== false;
                const isToggling = togglingUserId === citizen.user_id;

                return (
                  <tr key={citizen.id} className="table-row-hover">
                    {/* User ID */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className="user-id-badge">
                          @{citizen.user_id}
                        </span>
                      </div>
                    </td>

                    {/* Citizen Name */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div className="avatar-circle">
                          {citizen.full_name ? citizen.full_name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {citizen.full_name}
                        </span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                        <Phone size={13} />
                        <span>{citizen.phone || citizen.phone_number || "—"}</span>
                      </div>
                    </td>

                    {/* Password & Credentials with Mask Toggle */}
                    <td>
                      <div className="credential-box">
                        <Key size={13} color="var(--primary)" />
                        <span className="credential-val">
                          {isRevealed ? (
                            <code className="password-revealed">{displayPass}</code>
                          ) : (
                            <span className="password-dots">••••••••••</span>
                          )}
                        </span>

                        <div className="credential-actions">
                          {/* Toggle Visibility */}
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(citizen.id)}
                            className="btn-icon-subtle"
                            title={isRevealed ? "Hide Password" : "Show Password"}
                          >
                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>

                          {/* Copy Password */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(displayPass, citizen.id)}
                            className="btn-icon-subtle"
                            title="Copy Password"
                          >
                            {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td style={{ textAlign: "center" }}>
                      <span className={`status-pill ${isActive ? "Resolved" : "Rejected"}`} style={{ fontSize: "0.72rem" }}>
                        {isActive ? "Active" : "Suspended"}
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        <Clock size={12} />
                        <span>{formatDate(citizen.created_at)}</span>
                      </div>
                    </td>

                    {/* Grievances Count */}
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge-counter ${citizen.complaints_count > 0 ? "active" : ""}`}>
                        {citizen.complaints_count || 0}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                        {/* Reset Password Button */}
                        <button
                          onClick={() => handleOpenResetModal(citizen)}
                          className="btn-icon-subtle"
                          title={`Reset password for @${citizen.user_id}`}
                          style={{ color: "#38bdf8" }}
                        >
                          <RotateCcw size={14} />
                        </button>

                        {/* Suspend / Activate Toggle */}
                        <button
                          onClick={() => handleToggleAccountStatus(citizen)}
                          disabled={isToggling}
                          className="btn-icon-subtle"
                          title={isActive ? `Suspend @${citizen.user_id}` : `Activate @${citizen.user_id}`}
                          style={{ color: isActive ? "#f43f5e" : "#10b981" }}
                        >
                          {isToggling ? <Loader2 size={14} className="animate-spin" /> : isActive ? <Ban size={14} /> : <UserCheck size={14} />}
                        </button>

                        {/* View Cases */}
                        {citizen.complaints_count > 0 ? (
                          <button
                            onClick={() => onFilterByCitizen && onFilterByCitizen(citizen.user_id)}
                            className="btn btn-xs btn-outline-primary"
                            title={`View complaints filed by @${citizen.user_id}`}
                          >
                            <FileText size={12} />
                            <span>Cases</span>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Reset Password Modal */}
      {resetModalCitizen && (
        <div className="drawer-backdrop" onClick={() => setResetModalCitizen(null)}>
          <div
            className="detail-drawer"
            style={{ maxWidth: "420px", height: "auto", margin: "auto", borderRadius: "12px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#f8fafc" }}>
                  Administrative Password Reset
                </h3>
                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                  Account: <strong>@{resetModalCitizen.user_id}</strong> ({resetModalCitizen.full_name})
                </span>
              </div>
              <button
                className="drawer-close-btn"
                onClick={() => setResetModalCitizen(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecutePasswordReset} style={{ padding: "1.25rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
                  New Unique Password (min 6 characters)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPass ? "text" : "password"}
                    placeholder="Enter new unique password..."
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="status-form-input"
                    style={{ width: "100%", paddingRight: "2.5rem" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="btn-icon-subtle"
                    style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)" }}
                  >
                    {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                  Enforces global system uniqueness across all users and administrators.
                </span>
              </div>

              {resetError && (
                <div className="error-banner" style={{ marginBottom: "1rem", fontSize: "0.78rem" }}>
                  ⚠️ {resetError}
                </div>
              )}

              {resetSuccess && (
                <div className="toast-success" style={{ marginBottom: "1rem", fontSize: "0.78rem" }}>
                  ✓ {resetSuccess}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setResetModalCitizen(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="btn btn-primary"
                >
                  {isResetting ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="pagination-bar">
        <div className="pagination-info">
          Showing <strong>{citizens.length}</strong> of <strong>{total}</strong> customer accounts
        </div>

        <div className="pagination-controls">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="btn btn-secondary btn-sm"
          >
            <ChevronLeft size={14} />
            <span>Prev</span>
          </button>
          <span className="page-indicator">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="btn btn-secondary btn-sm"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Customer Directory CSV Export Option at Bottom */}
      <div className="customer-export-footer">
        <div className="export-text">
          <Download size={20} color="#3b82f6" />
          <div>
            <strong>Export Customer Directory</strong>
            <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "2px" }}>
              Download complete database of registered citizens, contact details, credentials, and grievance activity as an RFC-4180 CSV spreadsheet.
            </div>
            {exportError && (
              <div style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "4px" }}>
                ⚠️ {exportError}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isExporting || total === 0}
          className="btn-csv-download"
          title="Download all customer records as CSV"
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : exportSuccess ? (
            <Check size={16} color="#10b981" />
          ) : (
            <Download size={16} />
          )}
          <span>
            {isExporting
              ? "Generating CSV..."
              : exportSuccess
              ? "Downloaded Successfully!"
              : "Download Customers CSV"}
          </span>
        </button>
      </div>
    </div>
  );
}
