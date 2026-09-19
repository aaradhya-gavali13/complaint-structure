import React, { useState } from "react";
import {
  Landmark,
  FileText,
  Search,
  Info,
  PlusCircle,
  Menu,
  X,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
  Layers,
} from "./Icons";

export default function Navbar({
  activePage,
  setActivePage,
  user,
  onOpenAuth,
  onLogout,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Top Tricolor Bar & Official Gov Header */}
      <div className="civic-top-stripe"></div>
      <div className="official-flag-strip">
        <div className="gov-container official-flag-content">
          <div className="gov-indicator">
            <ShieldCheck size={14} color="#ff9933" />
            <span>Government Public Services &bull; Citizen Portal</span>
          </div>
          <div className="gov-links">
            <span>Toll-Free Helpline: <strong>1800-11-4000</strong></span>
            <span>|</span>
            <span>24x7 Redressal Cell</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="civic-navbar">
        <div className="gov-container navbar-inner">
          <div className="navbar-brand" onClick={() => handleNav("home")}>
            <div className="emblem-icon">
              <Landmark size={24} />
            </div>
            <div className="brand-titles">
              <span className="brand-main">e-Nivaran Portal</span>
              <span className="brand-sub">National Citizen Grievance Redressal System</span>
            </div>
          </div>

          <button
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <ul className={`nav-menu ${mobileMenuOpen ? "open" : ""}`}>
            <li>
              <button
                className={`nav-link ${activePage === "home" ? "active" : ""}`}
                onClick={() => handleNav("home")}
              >
                Home
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activePage === "submit" ? "active" : ""}`}
                onClick={() => handleNav("submit")}
              >
                <FileText size={16} />
                Submit Complaint
              </button>
            </li>
            <li>
              <button
                className={`nav-link ${activePage === "track" ? "active" : ""}`}
                onClick={() => handleNav("track")}
              >
                <Search size={16} />
                Track Complaint
              </button>
            </li>

            {user && (
              <li>
                <button
                  className={`nav-link ${activePage === "my-complaints" ? "active" : ""}`}
                  onClick={() => handleNav("my-complaints")}
                >
                  <Layers size={16} />
                  My Grievances
                </button>
              </li>
            )}

            <li>
              <button
                className={`nav-link ${activePage === "about" ? "active" : ""}`}
                onClick={() => handleNav("about")}
              >
                <Info size={16} />
                Charter &amp; Help
              </button>
            </li>

            {/* Auth Button or User Menu */}
            <li>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.35rem 0.75rem",
                      backgroundColor: "#e0f2fe",
                      borderRadius: "6px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#0369a1",
                    }}
                    title={`Logged in as ${user.full_name} (${user.user_id})`}
                  >
                    <User size={14} />
                    <span>{user.user_id}</span>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="btn btn-secondary"
                    style={{
                      padding: "0.45rem 0.75rem",
                      fontSize: "0.82rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      minHeight: "40px",
                    }}
                    title="Sign Out"
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuth("login");
                    setMobileMenuOpen(false);
                  }}
                  className="btn btn-secondary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    width: "100%",
                    minHeight: "44px",
                  }}
                >
                  <LogIn size={16} />
                  <span>Citizen Sign In</span>
                </button>
              )}
            </li>

            <li>
              <button
                className="btn btn-primary nav-cta"
                onClick={() => handleNav("submit")}
              >
                <PlusCircle size={16} />
                Lodge Grievance
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
