import React from "react";
import { User, LogOut, RefreshCw } from "./Icons";

export default function AdminNavbar({
  user,
  onLogout,
  onRefresh,
  loading = false,
  newComplaintAlert = null,
  onDismissAlert,
}) {
  return (
    <header className="admin-header">
      {/* Left indicator & new alerts */}
      <div className="header-left">
        <div className="live-poll-indicator">
          <span className="pulse-dot" />
          <span>LIVE SYNC ACTIVE (6s)</span>
        </div>

        {newComplaintAlert && (
          <div className="new-alert-pill">
            <span className="pulse-dot" style={{ backgroundColor: '#ffffff', boxShadow: 'none' }} />
            <span>
              New Grievance Received: <strong>{newComplaintAlert.complaint_id}</strong> ({newComplaintAlert.priority})
            </span>
            <button
              onClick={onDismissAlert}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                marginLeft: '4px',
              }}
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="header-right">
        <button
          onClick={onRefresh}
          title="Force Database Sync"
          className="icon-btn"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>

        <div className="admin-user-pill">
          <div className="user-avatar">
            <User size={15} />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.username || "admin"}</span>
            <span className="user-role">{user?.role || "Administrator"}</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Sign Out"
          className="logout-btn"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
