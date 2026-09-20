import React, { useState } from "react";
import { Shield, User, Loader2, AlertCircle, Eye, EyeOff, X, KeyRound } from "./Icons";
import { adminLogin } from "../api";

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your administrator username and password to proceed.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await adminLogin(username.trim(), password);
      onLoginSuccess({
        username: res.username,
        full_name: res.full_name,
        role: res.role,
      });
    } catch (err) {
      setError(err.message || "Invalid credentials. Please verify your administrative key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        {/* Header Emblem */}
        <div className="login-header">
          <div className="login-icon-box">
            <Shield size={30} />
          </div>
          <h1 className="login-title">Grievance Command Center</h1>
          <p className="login-sub">Administrative Access Portal</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="login-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Administrator Username</label>
            <div className="input-wrap">
              <span className="input-icon">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                autoComplete="username"
                className="form-input"
                placeholder="Enter administrator ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label className="form-label" style={{ margin: 0 }}>Security Password</label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#60a5fa",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div className="input-wrap" style={{ position: "relative" }}>
              <span className="input-icon">
                <Shield size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="form-input"
                style={{ paddingRight: "2.75rem" }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.25rem",
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} />
                <span>Authenticating Identity...</span>
              </>
            ) : (
              <span>Access Command Dashboard</span>
            )}
          </button>
        </form>
      </div>

      {/* Admin Password Recovery Modal */}
      {showForgotModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(11, 27, 51, 0.85)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setShowForgotModal(false)}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "12px",
              padding: "1.75rem",
              maxWidth: "420px",
              width: "100%",
              color: "#f8fafc",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <KeyRound size={20} color="#60a5fa" />
                Administrative Access Assistance
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.88rem", color: "#cbd5e1", lineHeight: 1.5, marginBottom: "1rem" }}>
              Administrative Command Center privileges are governed under strict municipal security protocol.
            </p>

            <div
              style={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e3a8a",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#93c5fd", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Security Policy Notice
              </div>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
                Direct access is protected. If you have forgotten your administrative credentials or need access restored, please contact your Chief IT Operations Administrator or refer to your department's secure environment deployment keys.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                style={{
                  padding: "0.6rem 1.25rem",
                  backgroundColor: "#2563eb",
                  border: "none",
                  borderRadius: "6px",
                  color: "#f8fafc",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                }}
                onClick={() => setShowForgotModal(false)}
              >
                Understood &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
