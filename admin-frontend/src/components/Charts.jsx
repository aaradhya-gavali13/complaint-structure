import React, { useState } from "react";
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, Clock } from "./Icons";

export default function Charts({ statistics }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!statistics) {
    return (
      <div className="analytics-section" style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>
        Loading real-time intelligence analytics...
      </div>
    );
  }

  const {
    total = 0,
    by_priority = {},
    by_status = {},
    by_department = {},
    human_review = 0,
    human_review_required = 0,
    timeline = [],
    by_timeline = [],
  } = statistics;

  const reviewCount = human_review_required || human_review || 0;
  const autoClassified = Math.max(0, total - reviewCount);
  const autoRate = total > 0 ? ((autoClassified / total) * 100).toFixed(1) : "0.0";
  const reviewRate = total > 0 ? ((reviewCount / total) * 100).toFixed(1) : "0.0";

  // Priority data
  const priorityData = [
    { label: "Critical", value: by_priority["CRITICAL"] || by_priority["Critical"] || 0, color: "#ef4444" },
    { label: "High", value: by_priority["HIGH"] || by_priority["High"] || 0, color: "#f97316" },
    { label: "Medium", value: by_priority["MEDIUM"] || by_priority["Medium"] || 0, color: "#3b82f6" },
    { label: "Low", value: by_priority["LOW"] || by_priority["Low"] || 0, color: "#64748b" },
  ];

  // Department data
  const departmentEntries = Object.entries(by_department).sort((a, b) => b[1] - a[1]);
  const maxDeptCount = Math.max(...departmentEntries.map(([_, v]) => v), 1);

  // Status data
  const statusColors = {
    Submitted: "#38bdf8",
    Pending: "#eab308",
    "Under Review": "#fbbf24",
    Assigned: "#818cf8",
    "In Progress": "#a855f7",
    Resolved: "#10b981",
    Rejected: "#f43f5e",
  };
  const statusEntries = Object.entries(by_status).sort((a, b) => b[1] - a[1]);

  const timelineData = timeline.length > 0 ? timeline : by_timeline;

  return (
    <div className="analytics-section">
      {/* Header with Switcher Tabs */}
      <div className="analytics-header">
        <div className="analytics-title">
          <BarChart3 size={18} color="#3b82f6" />
          <span>Real-Time Case Intelligence & Analytics</span>
        </div>

        <div className="chart-tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`chart-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          >
            Core Breakdown
          </button>
          <button
            onClick={() => setActiveTab("departments")}
            className={`chart-tab-btn ${activeTab === "departments" ? "active" : ""}`}
          >
            Departments ({departmentEntries.length})
          </button>
          <button
            onClick={() => setActiveTab("timeline")}
            className={`chart-tab-btn ${activeTab === "timeline" ? "active" : ""}`}
          >
            Timeline Stream
          </button>
        </div>
      </div>

      {/* Tab 1: Overview Breakdown */}
      {activeTab === "overview" && (
        <div className="charts-grid-three">
          {/* Priority Segmentation */}
          <div className="chart-tile">
            <div className="chart-tile-header">
              <div className="chart-tile-title">
                <AlertTriangle size={15} color="#f97316" />
                <span>Priority Segmentation</span>
              </div>
              <span className="chart-tile-badge">100% Cases</span>
            </div>

            <div className="bar-metric-list">
              {priorityData.map((item) => {
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={item.label} className="bar-metric-row">
                    <div className="bar-metric-meta">
                      <span className="bar-metric-name">{item.label}</span>
                      <span className="bar-metric-val">
                        {item.value} ({pct}%)
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="chart-tile">
            <div className="chart-tile-header">
              <div className="chart-tile-title">
                <Clock size={15} color="#3b82f6" />
                <span>Lifecycle Status</span>
              </div>
              <span className="chart-tile-badge">{by_status["Resolved"] || 0} Resolved</span>
            </div>

            <div className="bar-metric-list">
              {statusEntries.map(([status, count]) => {
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                const col = statusColors[status] || "#94a3b8";
                return (
                  <div key={status} className="bar-metric-row">
                    <div className="bar-metric-meta">
                      <span className="bar-metric-name">{status}</span>
                      <span className="bar-metric-val">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${pct}%`, backgroundColor: col }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Triage Performance Donut */}
          <div className="chart-tile">
            <div className="chart-tile-header">
              <div className="chart-tile-title">
                <ShieldCheck size={15} color="#10b981" />
                <span>AI Triage Performance</span>
              </div>
              <span className="chart-tile-badge" style={{ color: "#34d399" }}>
                {autoRate}% Auto
              </span>
            </div>

            <div className="donut-wrap">
              <svg viewBox="0 0 36 36" style={{ width: "130px", height: "130px", transform: "rotate(-90deg)" }}>
                <path
                  stroke="#1e293b"
                  strokeWidth="3.8"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#10b981"
                  strokeWidth="3.8"
                  strokeDasharray={`${autoRate}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke="#a855f7"
                  strokeWidth="3.8"
                  strokeDasharray={`${reviewRate}, 100`}
                  strokeDashoffset={`-${autoRate}`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="donut-center-text">
                <span className="donut-center-val">{total}</span>
                <span className="donut-center-label">Total</span>
              </div>
            </div>

            <div className="donut-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: "#10b981" }} />
                <div>
                  <span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>Auto Classified</span>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "#ffffff" }}>{autoClassified} ({autoRate}%)</strong>
                </div>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: "#a855f7" }} />
                <div>
                  <span style={{ fontSize: "0.68rem", color: "#94a3b8", display: "block" }}>Human Review</span>
                  <strong style={{ fontFamily: "var(--font-mono)", color: "#d8b4fe" }}>{reviewCount} ({reviewRate}%)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Department Caseload Ranking */}
      {activeTab === "departments" && (
        <div style={{ padding: "0.5rem 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
            {departmentEntries.map(([dept, count]) => {
              const pct = ((count / maxDeptCount) * 100).toFixed(0);
              const share = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
              return (
                <div key={dept} className="bar-metric-row">
                  <div className="bar-metric-meta">
                    <span className="bar-metric-name">{dept}</span>
                    <span className="bar-metric-val">
                      {count} ({share}%)
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: "linear-gradient(90deg, #2563eb, #06b6d4)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Timeline Stream */}
      {activeTab === "timeline" && (
        <div>
          {timelineData.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 0", color: "#64748b", fontSize: "0.85rem" }}>
              No timeline activity records accumulated yet.
            </div>
          ) : (
            <div className="timeline-stream">
              {(() => {
                const maxVal = Math.max(...timelineData.map((t) => t.count), 1);
                return timelineData.map((item, idx) => {
                  const barHeight = Math.max(12, (item.count / maxVal) * 130);
                  return (
                    <div key={idx} className="timeline-bar-col">
                      <span style={{ fontSize: "0.68rem", fontFamily: "var(--font-mono)", color: "#94a3b8" }}>
                        {item.count}
                      </span>
                      <div
                        className="timeline-bar-shape"
                        style={{ height: `${barHeight}px` }}
                      />
                      <span className="timeline-bar-lbl">
                        {item.date?.slice(5)}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
