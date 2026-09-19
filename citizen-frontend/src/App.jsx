import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import SubmitComplaintPage from "./pages/SubmitComplaintPage";
import SuccessPage from "./pages/SuccessPage";
import TrackComplaintPage from "./pages/TrackComplaintPage";
import AboutHelpPage from "./pages/AboutHelpPage";
import MyComplaintsPage from "./pages/MyComplaintsPage";
import CitizenAuthModal from "./components/CitizenAuthModal";
import {
  getStoredCitizenUser,
  fetchCurrentCitizen,
  clearCitizenSession,
} from "./api";

export default function App() {
  const [activePage, setActivePage] = useState("home");
  const [submissionData, setSubmissionData] = useState(null);
  const [trackId, setTrackId] = useState("");

  // Citizen Authentication State
  const [citizenUser, setCitizenUser] = useState(getStoredCitizenUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  // Verify session on mount
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const u = await fetchCurrentCitizen();
        if (u) setCitizenUser(u);
      } catch {
        // Session expired or offline
      }
    };
    verifyUser();
  }, []);

  const handleOpenAuth = (mode = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (user) => {
    setCitizenUser(user);
    setAuthModalOpen(false);
  };

  const handleLogout = () => {
    clearCitizenSession();
    setCitizenUser(null);
    if (activePage === "my-complaints") {
      setActivePage("home");
    }
  };

  const handleSubmissionSuccess = (data) => {
    setSubmissionData(data);
    setTrackId(data.complaint_id);
    setActivePage("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateToTrack = (id) => {
    if (id) setTrackId(id);
    setActivePage("track");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        user={citizenUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
        {activePage === "home" && (
          <HomePage
            setActivePage={setActivePage}
            setTrackId={handleNavigateToTrack}
            user={citizenUser}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activePage === "submit" && (
          <SubmitComplaintPage
            user={citizenUser}
            onOpenAuth={handleOpenAuth}
            onSubmissionSuccess={handleSubmissionSuccess}
            setActivePage={setActivePage}
          />
        )}

        {activePage === "success" && (
          <SuccessPage
            submissionData={submissionData}
            setActivePage={setActivePage}
            setTrackId={handleNavigateToTrack}
          />
        )}

        {activePage === "track" && (
          <TrackComplaintPage
            initialTrackId={trackId}
            setActivePage={setActivePage}
            user={citizenUser}
          />
        )}

        {activePage === "my-complaints" && (
          <MyComplaintsPage
            user={citizenUser}
            setActivePage={setActivePage}
            setTrackId={handleNavigateToTrack}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {activePage === "about" && (
          <AboutHelpPage setActivePage={setActivePage} />
        )}
      </main>

      <Footer setActivePage={setActivePage} />

      {/* Citizen Authentication Modal */}
      <CitizenAuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
