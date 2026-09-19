import React, { useState } from "react";
import { Shield, User, Loader2, AlertCircle, Eye, EyeOff } from "./Icons";
import { adminLogin } from "../api";

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin@Grievance2026");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await adminLogin(username, password);
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
                className="form-input"
                placeholder="Enter admin ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Security Password</label>
            <div className="input-wrap" style={{ position: "relative" }}>
              <span className="input-icon">
                <Shield size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
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

        {/* Hints */}
        <div className="login-hint-box">
          <p className="login-hint-label">Pre-configured Admin Access Credentials:</p>
          <div className="login-hint-creds">admin / Admin@Grievance2026</div>
        </div>
      </div>
    </div>
  );
}
