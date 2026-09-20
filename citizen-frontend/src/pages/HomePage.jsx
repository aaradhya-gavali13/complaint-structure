import React from "react";
import {
  FileText,
  Search,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  Building2,
  Lock,
  Cpu,
  HelpCircle,
  PhoneCall,
} from "../components/Icons";
import FindGrievanceModal from "../components/FindGrievanceModal";

export default function HomePage({ setActivePage, setTrackId }) {
  const [quickTrackInput, setQuickTrackInput] = React.useState("");
  const [showFindModal, setShowFindModal] = React.useState(false);

  const handleQuickTrack = (e) => {
    e.preventDefault();
    if (quickTrackInput.trim()) {
      setTrackId(quickTrackInput.trim());
      setActivePage("track");
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="gov-container">
          <div className="hero-grid">
            <div>
              <div className="hero-pill">
                <ShieldCheck size={14} color="#c59b27" />
                <span>Central Public Grievance Redressal &amp; Monitoring System</span>
              </div>
              <h1 className="hero-title">
                Empowering Citizens. <br />
                Ensuring Accountability.
              </h1>
              <p className="hero-desc">
                File public complaints directly with competent government departments. Every grievance is uniquely indexed, objectively triaged, and tracked with full civic transparency.
              </p>
              <div className="hero-actions">
                <button
                  className="btn btn-gold btn-lg"
                  onClick={() => setActivePage("submit")}
                >
                  <FileText size={18} />
                  Lodge Grievance Now
                </button>
                <button
                  className="btn btn-outline-white btn-lg"
                  onClick={() => setActivePage("track")}
                >
                  <Search size={18} />
                  Track Existing Grievance
                </button>
              </div>
            </div>

            {/* Quick Track Card on Hero */}
            <div className="hero-card-preview">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                <Search size={20} color="#c59b27" />
                <h3 style={{ color: "#ffffff", fontSize: "1.15rem" }}>Instant Grievance Status</h3>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "1.2rem" }}>
                Enter your unique Registration Number (e.g., GRV-20260918-00001) to verify real-time status:
              </p>

              <form onSubmit={handleQuickTrack} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="e.g. GRV-20260918-00001"
                  value={quickTrackInput}
                  onChange={(e) => setQuickTrackInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "0.7rem 0.9rem",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.3)",
                    background: "rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
                <button type="submit" className="btn btn-gold" style={{ padding: "0.7rem 1rem" }}>
                  <ArrowRight size={18} />
                </button>
              </form>

              <div style={{ marginTop: "0.6rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowFindModal(true)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.95)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: 0,
                    fontWeight: 500,
                  }}
                >
                  <Search size={13} />
                  <span>Forgot Grievance ID? Find by Mobile Number</span>
                </button>
              </div>

              <div className="hero-stats-row">
                <div className="stat-item">
                  <div className="stat-val">98.4%</div>
                  <div className="stat-lbl">Resolution Rate</div>
                </div>
                <div className="stat-item">
                  <div className="stat-val">&lt; 7 Days</div>
                  <div className="stat-lbl">Average Turnaround</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="gov-container">
        {/* Civic Process Stepper */}
        <section className="civic-card">
          <div className="civic-card-header">
            <div>
              <h2>
                <Clock size={22} color="#134074" />
                How the Grievance Redressal Process Operates
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                A 4-tier standardized workflow guaranteeing prompt action, privacy, and accountability.
              </p>
            </div>
          </div>

          <div className="stepper-container">
            <div className="stepper-progress-bar" style={{ width: "75%" }}></div>

            <div className="step-node completed">
              <div className="step-circle">1</div>
              <div className="step-label">1. Online Submission</div>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Citizen registers issue securely</span>
            </div>

            <div className="step-node completed">
              <div className="step-circle">2</div>
              <div className="step-label">2. Automated Triage</div>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>AI &amp; intake categorization</span>
            </div>

            <div className="step-node active">
              <div className="step-circle">3</div>
              <div className="step-label">3. Officer Review</div>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Investigation &amp; departmental action</span>
            </div>

            <div className="step-node">
              <div className="step-circle">4</div>
              <div className="step-label">4. Redressal &amp; Closure</div>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Citizen notified of resolution</span>
            </div>
          </div>
        </section>

        {/* Feature Pillars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
          <div className="civic-card" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ padding: "0.6rem", background: "#e0f2fe", borderRadius: "8px", color: "#0369a1" }}>
                <Lock size={22} />
              </div>
              <h3 style={{ fontSize: "1.1rem" }}>Citizen Privacy Guaranteed</h3>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
              Your personal identification details, including phone number and residence, are strictly protected and never displayed on public tracking interfaces.
            </p>
          </div>

          <div className="civic-card" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ padding: "0.6rem", background: "#fef3c7", borderRadius: "8px", color: "#b45309" }}>
                <Cpu size={22} />
              </div>
              <h3 style={{ fontSize: "1.1rem" }}>Objective AI Triage</h3>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
              Complaints are instantly assessed using sovereign AI models to ensure urgent matters like unauthorized transactions and fraud receive immediate escalation.
            </p>
          </div>

          <div className="civic-card" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ padding: "0.6rem", background: "#d1fae5", borderRadius: "8px", color: "#047857" }}>
                <Building2 size={22} />
              </div>
              <h3 style={{ fontSize: "1.1rem" }}>Inter-Departmental Reach</h3>
            </div>
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
              Routing across 13 dedicated divisions including Banking, Credit Reporting, Fraud &amp; Security, Loans, and Consumer Affairs with strict SLA monitoring.
            </p>
          </div>
        </div>

        {/* Civic Quick Action Callout */}
        <section
          style={{
            background: "linear-gradient(135deg, #13315c 0%, #0b2545 100%)",
            borderRadius: "14px",
            padding: "2.5rem",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <h2 style={{ color: "#ffffff", fontSize: "1.6rem", marginBottom: "0.5rem" }}>
              Need Help Filing a Complaint?
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "0.95rem", maxWidth: "600px" }}>
              Our 24x7 citizen support team is available via toll-free helpline or email to assist senior citizens and individuals with filing assistance.
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn btn-gold" onClick={() => setActivePage("about")}>
              <HelpCircle size={18} />
              View Citizen Helpdesk
            </button>
            <button className="btn btn-primary" onClick={() => setActivePage("submit")}>
              <FileText size={18} />
              Submit Grievance
            </button>
          </div>
        </section>
      </div>

      {/* Find Grievance Number Modal */}
      <FindGrievanceModal
        isOpen={showFindModal}
        onClose={() => setShowFindModal(false)}
        onSelectComplaint={(selectedId) => {
          setShowFindModal(false);
          setTrackId(selectedId);
          setActivePage("track");
        }}
      />
    </div>
  );
}
