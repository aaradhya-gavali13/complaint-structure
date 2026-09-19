import React from "react";
import {
  BarChart3,
  FileText,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Building,
  Shield,
  Cpu,
  Users,
  TrendingUp,
} from "./Icons";

export default function AdminSidebar({
  currentView,
  onViewChange,
  statistics,
}) {
  const stats = statistics || {};
  const byPriority = stats.by_priority || {};
  const byStatus = stats.by_status || {};

  const menuItems = [
    {
      id: "dashboard",
      label: "Overview & Charts",
      icon: BarChart3,
      count: stats.total,
    },
    {
      id: "analytics",
      label: "SLA & Analytics",
      icon: TrendingUp,
    },
    {
      id: "citizens",
      label: "Customer Details",
      icon: Users,
      count: stats.citizens_count !== undefined ? stats.citizens_count : 0,
    },
    {
      id: "all",
      label: "All Grievances",
      icon: FileText,
      count: stats.total,
    },
    {
      id: "critical",
      label: "Critical Priority",
      icon: AlertTriangle,
      count: byPriority["CRITICAL"] || byPriority["Critical"] || 0,
    },
    {
      id: "high",
      label: "High Priority",
      icon: AlertTriangle,
      count: byPriority["HIGH"] || byPriority["High"] || 0,
    },
    {
      id: "review",
      label: "Human Review Required",
      icon: ShieldAlert,
      count: stats.human_review_required || stats.human_review || 0,
    },
    {
      id: "departments",
      label: "Department Directory",
      icon: Building,
      count: 13,
    },
    {
      id: "resolved",
      label: "Resolved Cases",
      icon: CheckCircle2,
      count: byStatus["Resolved"] || 0,
    },
  ];

  return (
    <aside className="admin-sidebar">
      <div>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="sidebar-title">CIVIC COMMAND</h1>
            <p className="sidebar-sub">AI Grievance Ops v2.4</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Operations Console</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`sidebar-item ${isActive ? "active" : ""}`}
              >
                <div className="sidebar-item-left">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count !== null && (
                  <span className="sidebar-item-count">{item.count}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="engine-status-row">
          <span>AI TRIAGE ENGINE</span>
          <span className="engine-pill">
            <span className="pulse-dot" />
            ONLINE
          </span>
        </div>
        <div className="engine-details-box">
          <div>Model: Ollama qwen2.5:3b</div>
          <div>Database: SQLite Engine</div>
          <div>Sync Cadence: 6.0s</div>
        </div>
      </div>
    </aside>
  );
}
