import React from "react";

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  active = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`kpi-card ${variant} ${active ? "active" : ""}`}
    >
      <div>
        <div className="kpi-header">
          <span className="kpi-label">{title}</span>
          {Icon && (
            <div className="kpi-icon-badge">
              <Icon size={16} />
            </div>
          )}
        </div>
        <div className="kpi-value">
          {value !== undefined && value !== null ? value.toLocaleString() : "0"}
        </div>
      </div>
      {subtitle && <div className="kpi-sub">{subtitle}</div>}
    </div>
  );
}
