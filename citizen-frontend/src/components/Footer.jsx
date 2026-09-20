import React from "react";
import { Shield, Phone, Mail, Clock, ExternalLink, Lock } from "./Icons";

export default function Footer({ setActivePage }) {
  return (
    <footer className="civic-footer">
      <div className="gov-container footer-top">
        <div className="footer-brand">
          <div className="footer-brand-title">National Grievance Redressal Authority</div>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", maxWidth: "450px" }}>
            A unified digital governance platform enabling citizens to register grievances, seek accountability, and track administrative resolution transparently.
          </p>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#cbd5e1" }}>
              <Lock size={14} color="#c59b27" /> End-to-End Privacy Protected
            </span>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Navigation</h4>
          <ul className="footer-links">
            <li>
              <a href="#home" onClick={(e) => { e.preventDefault(); setActivePage("home"); }}>Portal Home</a>
            </li>
            <li>
              <a href="#submit" onClick={(e) => { e.preventDefault(); setActivePage("submit"); }}>Lodge New Grievance</a>
            </li>
            <li>
              <a href="#track" onClick={(e) => { e.preventDefault(); setActivePage("track"); }}>Check Complaint Status</a>
            </li>
            <li>
              <a href="#about" onClick={(e) => { e.preventDefault(); setActivePage("about"); }}>Citizens Charter &amp; SLA</a>
            </li>
            <li>
              <a
                href={import.meta.env.VITE_ADMIN_URL || "http://localhost:5174"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#93c5fd", fontWeight: 500 }}
              >
                Official Admin Portal &rarr;
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Citizen Assistance</h4>
          <ul className="footer-links">
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Phone size={14} color="#ff9933" /> Helpline: 1800-11-4000 (Toll Free)
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Mail size={14} color="#ff9933" /> grievances@gov.public.in
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Clock size={14} color="#ff9933" /> Working Hours: 24 Hours / 7 Days
            </li>
            <li style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Shield size={14} color="#ff9933" /> Data Protection Act Compliant
            </li>
          </ul>
        </div>
      </div>

      <div className="gov-container footer-bottom">
        <div>
          &copy; {new Date().getFullYear()} National Informatics &amp; Grievance Division. Content owned &amp; maintained by Administrative Public Reforms.
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <span>Privacy Policy</span>
          <span>&bull;</span>
          <span>Terms of Redressal</span>
          <span>&bull;</span>
          <span>Hyperlinking Policy</span>
        </div>
      </div>
    </footer>
  );
}
