import React from "react";
import { CheckCircle2, Clock, AlertTriangle, Sparkles, XCircle, UserCheck } from "./Icons";

export function StatusBadge({ status }) {
  const rawStatus = (status || "Submitted").trim();
  const s = rawStatus.toLowerCase();

  if (s.includes("reject")) {
    return (
      <span className="badge badge-rejected" title={`Status: ${rawStatus}`}>
        <XCircle size={13} />
        {rawStatus}
      </span>
    );
  }

  if (s.includes("resolved") || s.includes("closed")) {
    return (
      <span className="badge badge-resolved" title={`Status: ${rawStatus}`}>
        <CheckCircle2 size={13} />
        {rawStatus}
      </span>
    );
  }

  if (s.includes("assigned")) {
    return (
      <span className="badge badge-assigned" title={`Status: ${rawStatus}`}>
        <UserCheck size={13} />
        {rawStatus}
      </span>
    );
  }

  if (s.includes("progress")) {
    return (
      <span className="badge badge-progress" title={`Status: ${rawStatus}`}>
        <Sparkles size={13} />
        {rawStatus}
      </span>
    );
  }

  if (s.includes("review") || s.includes("investigat")) {
    return (
      <span className="badge badge-review" title={`Status: ${rawStatus}`}>
        <Clock size={13} />
        {rawStatus}
      </span>
    );
  }

  return (
    <span className="badge badge-submitted" title={`Status: ${rawStatus}`}>
      <Clock size={13} />
      {rawStatus}
    </span>
  );
}

// Deprecated in citizen tracking per requirement to only show status and admin message
export function PriorityBadge() {
  return null;
}
