import React from "react";
import {
  ShieldCheck,
  Clock,
  Building,
  HelpCircle,
  FileCheck,
  PhoneCall,
  AlertOctagon,
  Scale,
  CheckCircle2,
  FileText,
} from "../components/Icons";

export default function AboutHelpPage({ setActivePage }) {
  const departments = [
    "Fraud & Security",
    "Credit Reporting",
    "Debt Collection",
    "Mortgage",
    "Loans & Lending",
    "Credit Cards",
    "Banking & Accounts",
    "Payments & Transactions",
    "Fees & Charges",
    "Digital Wallet",
    "Customer Service",
    "Advertising & Communications",
    "Other / Human Review",
  ];

  const faqs = [
    {
      q: "What is the turnaround time (SLA) for grievance resolution?",
      a: "As per the Citizen Redressal Charter, critical and high-priority grievances (e.g. active financial fraud or unauthorized deductions) are acknowledged immediately and targeted for resolution within 7 working days. General grievances are resolved within 15 to 30 working days.",
    },
    {
      q: "Why is my personal phone number and address hidden on the tracking page?",
      a: "To safeguard citizen privacy and comply with Public Data Protection regulations, personal identifiers are encrypted and restricted solely to authorized administrative investigators. Only safe metadata (Registration ID, assigned department, and status) is visible on public tracking interfaces.",
    },
    {
      q: "What happens after I submit a complaint?",
      a: "Your complaint receives a permanent, unique registration ID (e.g. GRV-20260918-00001). It is parsed by our automated civic triage engine and routed to the competent jurisdictional department for inquiry and remedial action.",
    },
    {
      q: "What should I do if my grievance is not resolved satisfactorily?",
      a: "If dissatisfied with the primary resolution, citizens have the right to file an administrative appeal with the Appellate Redressal Authority quoting their original Complaint ID.",
    },
  ];

  return (
    <div className="gov-container main-wrapper">
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.2rem" }}>
          <span style={{ cursor: "pointer" }} onClick={() => setActivePage("home")}>
            Home
          </span>{" "}
          / <strong style={{ color: "#0b2545" }}>Citizen Charter &amp; Help</strong>
        </div>

        {/* Page Title */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            Citizen Grievance Redressal Charter
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            Official guidelines, standard service level agreements (SLAs), and citizen assistance resources.
          </p>
        </div>

        {/* Charter Principles */}
        <div className="civic-card">
          <div className="civic-card-header">
            <h2>
              <Scale size={20} color="#134074" />
              Public Service Guarantees
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
            <div style={{ borderLeft: "3px solid #059669", paddingLeft: "1rem" }}>
              <div style={{ fontWeight: 700, color: "#0b2545", marginBottom: "0.25rem" }}>
                Zero Fee Public Service
              </div>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Grievance filing and monitoring is completely free of cost for all citizens across all departments.
              </p>
            </div>

            <div style={{ borderLeft: "3px solid #134074", paddingLeft: "1rem" }}>
              <div style={{ fontWeight: 700, color: "#0b2545", marginBottom: "0.25rem" }}>
                Transparent Tracking
              </div>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Every grievance is assigned a permanent registration code with end-to-end milestone updates.
              </p>
            </div>

            <div style={{ borderLeft: "3px solid #c59b27", paddingLeft: "1rem" }}>
              <div style={{ fontWeight: 700, color: "#0b2545", marginBottom: "0.25rem" }}>
                Strict Confidentiality
              </div>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Complainant identity details are protected against unauthorized exposure or commercial disclosure.
              </p>
            </div>
          </div>
        </div>

        {/* Competent Departments */}
        <div className="civic-card">
          <div className="civic-card-header">
            <h2>
              <Building size={20} color="#134074" />
              Covered Jurisdictions &amp; Departments
            </h2>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>13 Administrative Divisions</span>
          </div>

          <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1.25rem" }}>
            Complaints are triaged and assigned to the relevant department based on the subject matter:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "0.75rem" }}>
            {departments.map((dept, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 0.85rem",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#1e293b",
                }}
              >
                <CheckCircle2 size={15} color="#059669" />
                <span>{dept}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="civic-card">
          <div className="civic-card-header">
            <h2>
              <HelpCircle size={20} color="#134074" />
              Frequently Asked Questions (FAQ)
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: i !== faqs.length - 1 ? "1px solid #f1f5f9" : "none", paddingBottom: "1rem" }}>
                <h3 style={{ fontSize: "1rem", color: "#0b2545", marginBottom: "0.4rem" }}>
                  {faq.q}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "#475569" }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Assistance Action */}
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            background: "#f8fafc",
            borderRadius: "10px",
            border: "1px solid #cbd5e1",
          }}
        >
          <h3 style={{ marginBottom: "0.5rem" }}>Ready to lodge an official complaint?</h3>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            The process takes less than 2 minutes and provides an official digital receipt.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => setActivePage("submit")}>
            <FileText size={18} />
            File Grievance Now
          </button>
        </div>
      </div>
    </div>
  );
}
