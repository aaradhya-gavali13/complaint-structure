import React, { useState } from "react";
import { X, Lock, User, Phone, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from "./Icons";
import { citizenLogin, citizenRegister } from "../api";

export default function CitizenAuthModal({ isOpen, onClose, onAuthSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // "login" or "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Visibility toggle states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Login form fields
  const [loginUserId, setLoginUserId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form fields
  const [regUserId, setRegUserId] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");


  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUserId.trim() || !loginPassword) {
      setError("Please enter both your User ID and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await citizenLogin({
        user_id: loginUserId.trim(),
        password: loginPassword,
      });
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regUserId.trim() || !regFullName.trim() || !regPhone.trim() || !regPassword) {
      setError("Please fill in all registration fields.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await citizenRegister({
        user_id: regUserId.trim(),
        full_name: regFullName.trim(),
        phone: regPhone.trim(),
        password: regPassword,
      });
      onAuthSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(11, 37, 69, 0.7)",
        backdropFilter: "blur(5px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "460px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          animation: "modalFadeIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #0b2545 0%, #134074 100%)",
            color: "#ffffff",
            padding: "1.25rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lock size={18} color="#eef4f8" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                Citizen Portal Identity
              </h2>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                Secure Access &amp; Confidential Grievance Redressal
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#cbd5e1",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "0.85rem",
              border: "none",
              borderBottom: mode === "login" ? "2px solid #134074" : "2px solid transparent",
              background: mode === "login" ? "#ffffff" : "transparent",
              fontWeight: mode === "login" ? 700 : 500,
              color: mode === "login" ? "#0b2545" : "#64748b",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Sign In with User ID
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            style={{
              flex: 1,
              padding: "0.85rem",
              border: "none",
              borderBottom: mode === "register" ? "2px solid #134074" : "2px solid transparent",
              background: mode === "register" ? "#ffffff" : "transparent",
              fontWeight: mode === "register" ? 700 : 500,
              color: mode === "register" ? "#0b2545" : "#64748b",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            New Citizen Registration
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.5rem" }}>
          {error && (
            <div
              style={{
                backgroundColor: "#fff1f2",
                border: "1px solid #fecdd3",
                borderRadius: "6px",
                padding: "0.75rem 1rem",
                color: "#be123c",
                fontSize: "0.85rem",
                marginBottom: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Citizen User ID</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. rahul_sharma or citizen101"
                    value={loginUserId}
                    onChange={(e) => setLoginUserId(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="helper-text">Your unique registered identifier</div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    className="form-input"
                    style={{ paddingRight: "2.75rem", width: "100%" }}
                    placeholder="Enter your confidential password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: "0.3rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                    }}
                    title={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Authenticate &amp; Continue</span>
                )}
              </button>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.82rem",
                  color: "#64748b",
                  marginTop: "1rem",
                  marginBottom: 0,
                }}
              >
                First time filing a complaint?{" "}
                <strong
                  style={{ color: "#134074", cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                >
                  Create an account here
                </strong>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: "0.85rem" }}>
                <label className="form-label">Choose a Citizen User ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. rahul99 or citizen_pune"
                  value={regUserId}
                  onChange={(e) => setRegUserId(e.target.value)}
                  required
                  autoFocus
                />
                <div className="helper-text">Letters, numbers, underscores (min 3 chars)</div>
              </div>

              <div style={{ marginBottom: "0.85rem" }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "0.85rem" }}>
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Create Password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    className="form-input"
                    style={{ paddingRight: "2.75rem", width: "100%" }}
                    placeholder="Minimum 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      background: "transparent",
                      border: "none",
                      color: "#64748b",
                      cursor: "pointer",
                      padding: "0.3rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                    }}
                    title={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Register &amp; Proceed</span>
                )}
              </button>

              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.82rem",
                  color: "#64748b",
                  marginTop: "1rem",
                  marginBottom: 0,
                }}
              >
                Already have a User ID?{" "}
                <strong
                  style={{ color: "#134074", cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Log in here
                </strong>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
