import React from "react";
import { Landmark, PlusCircle, Search, Layers, User, LogIn } from "./Icons";

export default function MobileBottomNav({
  activePage,
  setActivePage,
  user,
  onOpenAuth,
}) {
  const handleNav = (page) => {
    if (page === "my-complaints" && !user) {
      onOpenAuth("login");
      return;
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <button
        type="button"
        className={`mobile-tab-btn ${activePage === "home" ? "active" : ""}`}
        onClick={() => handleNav("home")}
      >
        <Landmark size={20} />
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`mobile-tab-btn ${activePage === "track" ? "active" : ""}`}
        onClick={() => handleNav("track")}
      >
        <Search size={20} />
        <span>Track</span>
      </button>

      <button
        type="button"
        className={`mobile-tab-btn mobile-cta-tab ${activePage === "submit" ? "active" : ""}`}
        onClick={() => handleNav("submit")}
        title="Lodge New Grievance"
      >
        <div className="mobile-cta-circle">
          <PlusCircle size={24} color="#ffffff" />
        </div>
        <span>Lodge</span>
      </button>

      <button
        type="button"
        className={`mobile-tab-btn ${activePage === "my-complaints" ? "active" : ""}`}
        onClick={() => handleNav("my-complaints")}
      >
        <Layers size={20} />
        <span>My Grievances</span>
      </button>

      <button
        type="button"
        className="mobile-tab-btn"
        onClick={() => onOpenAuth(user ? "profile" : "login")}
      >
        {user ? <User size={20} color="#0369a1" /> : <LogIn size={20} />}
        <span>{user ? user.user_id.slice(0, 6) : "Sign In"}</span>
      </button>
    </nav>
  );
}
