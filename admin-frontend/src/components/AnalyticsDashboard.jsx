import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  MapPin,
  Building,
  RefreshCw,
} from "./Icons";
import { fetchAnalytics } from "../api";

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAnalytics();
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to load municipal analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 1rem" }} />
        <p style={{ fontFamily: "var(--font-mono)" }}>Computing municipal telemetry & SLA performance metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner" style={{ margin: "2rem 0" }}>
        <span>⚠️ {error}</span>
        <button onClick={loadData} className="btn btn-secondary btn-xs" style={{ marginLeft: "1rem" }}>
          Retry
        </button>
      </div>
    );
  }

  const d = data || {};
  const ratings = d.ratings_breakdown || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  const priorities = d.priority_distribution || {};
  const depts = d.department_efficiency || {};
  const maxPriorityCount = Math.max(...Object.values(priorities), 1);

  return (
    <div className="analytics-view-wrapper">
      {/* Top Title Bar */}
      <div className="view-header-bar" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h2 className="view-title flex-align-center" style={{ gap: "0.5rem" }}>
            <BarChart3 size={22} color="var(--primary)" />
            Municipal SLA Performance & Resolution Analytics
          </h2>
          <p className="view-subtitle">
            Turnaround velocity, SLA compliance rates, priority workload distribution, and citizen satisfaction ratings.
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn btn-secondary flex-align-center"
          style={{ gap: "0.4rem" }}
          title="Refresh Analytics"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Sync Analytics</span>
        </button>
      </div>

      {/* Primary KPI Row */}
      <div className="kpi-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">SLA Compliance Rate</span>
            <div className="metric-icon-wrap" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: d.sla_compliance_rate >= 80 ? "#10b981" : "#f59e0b" }}>
            {d.sla_compliance_rate !== undefined ? `${d.sla_compliance_rate}%` : "—"}
          </div>
          <div className="metric-sub" style={{ color: "#94a3b8" }}>
            {d.sla_breached_count || 0} cases breached SLA deadline
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Avg. Turnaround Time</span>
            <div className="metric-icon-wrap" style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: "#60a5fa" }}>
            {d.avg_turnaround_hours ? `${d.avg_turnaround_hours}h` : "—"}
          </div>
          <div className="metric-sub" style={{ color: "#94a3b8" }}>
            From submission to resolution
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Citizen Satisfaction</span>
            <div className="metric-icon-wrap" style={{ backgroundColor: "rgba(234, 179, 8, 0.15)", color: "#eab308" }}>
              <Star size={16} fill="#eab308" />
            </div>
          </div>
          <div className="metric-value" style={{ color: "#facc15" }}>
            {d.avg_citizen_rating ? `${d.avg_citizen_rating} / 5` : "Unrated"}
          </div>
          <div className="metric-sub" style={{ color: "#94a3b8" }}>
            Based on {d.total_rated_count || 0} citizen feedback reviews
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Resolution Efficiency</span>
            <div className="metric-icon-wrap" style={{ backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#a855f7" }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="metric-value" style={{ color: "#c084fc" }}>
            {d.total_complaints > 0
              ? `${Math.round(((d.total_resolved || 0) / d.total_complaints) * 100)}%`
              : "0%"}
          </div>
          <div className="metric-sub" style={{ color: "#94a3b8" }}>
            {d.total_resolved || 0} of {d.total_complaints || 0} resolved
          </div>
        </div>
      </div>

      {/* Two Columns: Ward Heatmap / Distribution + Citizen Ratings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Priority Distribution */}
        <div className="drawer-card" style={{ padding: "1.25rem" }}>
          <div className="drawer-card-header" style={{ marginBottom: "1rem" }}>
            <div className="drawer-card-title">
              <AlertTriangle size={16} color="#f59e0b" />
              <span>Grievance Distribution by Priority</span>
            </div>
          </div>

          {Object.keys(priorities).length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No priority distribution data recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {Object.entries(priorities)
                .sort((a, b) => b[1] - a[1])
                .map(([prioName, count]) => {
                  const pct = Math.round((count / maxPriorityCount) * 100);
                  const prioColor = prioName === "CRITICAL" ? "#ef4444" : prioName === "HIGH" ? "#f97316" : prioName === "MEDIUM" ? "#eab308" : "#3b82f6";
                  return (
                    <div key={prioName}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                        <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{prioName}</span>
                        <strong style={{ color: prioColor, fontFamily: "var(--font-mono)" }}>
                          {count} {count === 1 ? "case" : "cases"}
                        </strong>
                      </div>
                      <div style={{ width: "100%", height: "6px", backgroundColor: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            backgroundColor: prioColor,
                            borderRadius: "3px",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Citizen Rating Breakdown */}
        <div className="drawer-card" style={{ padding: "1.25rem" }}>
          <div className="drawer-card-header" style={{ marginBottom: "1rem" }}>
            <div className="drawer-card-title">
              <Star size={16} color="#eab308" fill="#eab308" />
              <span>Citizen Satisfaction Breakdown (5-Star Scale)</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratings[String(stars)] || 0;
              const totalReviews = d.total_rated_count || 1;
              const pct = Math.round((count / totalReviews) * 100);

              return (
                <div key={stars} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px", width: "70px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#f8fafc" }}>{stars}</span>
                    <Star size={13} color="#eab308" fill="#eab308" />
                  </div>
                  <div style={{ flex: 1, height: "8px", backgroundColor: "#1e293b", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        backgroundColor:
                          stars >= 4 ? "#10b981" : stars === 3 ? "#eab308" : "#ef4444",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                  <div style={{ width: "65px", textAlign: "right", fontSize: "0.75rem", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                    {count} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Department Efficiency Table */}
      <div className="drawer-card" style={{ padding: "1.25rem" }}>
        <div className="drawer-card-header" style={{ marginBottom: "1rem" }}>
          <div className="drawer-card-title">
            <Building size={16} color="#a855f7" />
            <span>Departmental Resolution Efficiency & Caseload</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Department</th>
                <th style={{ textAlign: "center" }}>Total Caseload</th>
                <th style={{ textAlign: "center" }}>Resolved Cases</th>
                <th style={{ textAlign: "center" }}>Resolution Rate</th>
                <th>Performance Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(depts).length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                    No department caseload records available.
                  </td>
                </tr>
              ) : (
                Object.entries(depts).map(([deptName, info]) => {
                  const rate = info.rate || (info.total > 0 ? Math.round((info.resolved / info.total) * 100) : 0);
                  return (
                    <tr key={deptName}>
                      <td style={{ fontWeight: 600, color: "#f1f5f9" }}>{deptName}</td>
                      <td style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>{info.total}</td>
                      <td style={{ textAlign: "center", fontFamily: "var(--font-mono)", color: "#10b981" }}>
                        {info.resolved}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 600, color: rate >= 70 ? "#10b981" : rate >= 40 ? "#eab308" : "#ef4444" }}>
                          {rate}%
                        </span>
                      </td>
                      <td>
                        <div style={{ width: "120px", height: "6px", backgroundColor: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${rate}%`,
                              height: "100%",
                              backgroundColor: rate >= 70 ? "#10b981" : rate >= 40 ? "#eab308" : "#ef4444",
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
