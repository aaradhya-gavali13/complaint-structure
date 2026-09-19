import React, { useState, useEffect, useRef, useCallback } from "react";
import LoginPage from "./components/LoginPage";
import AdminSidebar from "./components/AdminSidebar";
import AdminNavbar from "./components/AdminNavbar";
import MetricCard from "./components/MetricCard";
import Charts from "./components/Charts";
import ComplaintsTable from "./components/ComplaintsTable";
import ComplaintDetailDrawer from "./components/ComplaintDetailDrawer";
import CitizenAccountsTable from "./components/CitizenAccountsTable";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import {
  FileText,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Building,
  RefreshCw,
  Users,
  TrendingUp,
} from "./components/Icons";
import {
  getCurrentAdmin,
  adminLogout,
  fetchStatistics,
  fetchComplaints,
  fetchComplaintDetail,
  updateComplaintStatus,
  fetchDepartments,
  fetchPriorities,
} from "./api";


export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Navigation & view state
  const [currentView, setCurrentView] = useState("dashboard"); // dashboard, all, critical, high, review, departments, resolved

  // Data states
  const [statistics, setStatistics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    priority: "",
    department: "",
    status: "",
    human_review: null,
  });

  // Drawer / Detail state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Polling & Alerts
  const [newComplaintAlert, setNewComplaintAlert] = useState(null);
  const previousTotalRef = useRef(null);

  // 1. Check Initial Authentication
  useEffect(() => {
    const checkSession = async () => {
      try {
        const u = await getCurrentAdmin();
        setUser(u);
      } catch (err) {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  // 2. Load Metadata (Departments & Priorities) once authenticated
  useEffect(() => {
    if (!user) return;
    const loadMetadata = async () => {
      try {
        const [depts, priors] = await Promise.all([
          fetchDepartments(),
          fetchPriorities(),
        ]);
        setDepartments(depts.departments || []);
        setPriorities(priors.priorities || []);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    };
    loadMetadata();
  }, [user]);

  // 3. Load Statistics & Handle Polling
  const loadStatistics = useCallback(async (isPolling = false) => {
    if (!user) return;
    try {
      const stats = await fetchStatistics();
      setStatistics(stats);

      // Check if new complaint arrived
      if (previousTotalRef.current !== null && stats.total > previousTotalRef.current) {
        try {
          const latestRes = await fetchComplaints({ page: 1, limit: 1 });
          if (latestRes.items && latestRes.items.length > 0) {
            setNewComplaintAlert(latestRes.items[0]);
          }
        } catch {
          setNewComplaintAlert({
            complaint_id: "New Incident",
            priority: "Review Needed",
          });
        }
      }
      previousTotalRef.current = stats.total;
    } catch (err) {
      console.error("Failed to fetch statistics:", err);
    }
  }, [user]);

  // 4. Load Complaints List based on current filters and view
  const loadComplaints = useCallback(async () => {
    if (!user) return;
    setLoadingList(true);
    try {
      const effectiveFilters = { ...filters };

      if (currentView === "critical") effectiveFilters.priority = "CRITICAL";
      if (currentView === "high") effectiveFilters.priority = "HIGH";
      if (currentView === "review") effectiveFilters.human_review = true;
      if (currentView === "resolved") effectiveFilters.status = "Resolved";

      const res = await fetchComplaints({
        page,
        limit,
        ...effectiveFilters,
      });

      setComplaints(res.items || []);
      setTotalComplaints(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error("Failed to fetch complaints list:", err);
    } finally {
      setLoadingList(false);
    }
  }, [user, page, limit, filters, currentView]);

  // Initial load when user signs in or changes view/filters
  useEffect(() => {
    if (user) {
      loadStatistics();
      loadComplaints();
    }
  }, [user, currentView, filters, page, limit, loadStatistics, loadComplaints]);

  // 5. Automated 6-second Live Polling
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      loadStatistics(true);
      loadComplaints();
    }, 6000);

    return () => clearInterval(interval);
  }, [user, loadStatistics, loadComplaints]);

  // Filter Handler
  const handleFilterChange = (key, value) => {
    setPage(1);
    if (key === "reset") {
      setFilters({
        search: "",
        priority: "",
        department: "",
        status: "",
        human_review: null,
      });
      return;
    }
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // View Change Handler
  const handleViewChange = (viewId) => {
    setCurrentView(viewId);
    setPage(1);
    if (viewId === "critical") {
      setFilters((prev) => ({ ...prev, priority: "CRITICAL" }));
    } else if (viewId === "high") {
      setFilters((prev) => ({ ...prev, priority: "HIGH" }));
    } else if (viewId === "review") {
      setFilters((prev) => ({ ...prev, human_review: true }));
    } else if (viewId === "resolved") {
      setFilters((prev) => ({ ...prev, status: "Resolved" }));
    } else if (viewId === "all" || viewId === "dashboard" || viewId === "citizens" || viewId === "analytics") {
      setFilters((prev) => ({ ...prev, priority: "", human_review: null, status: "" }));
    }
  };

  // Filter complaints by citizen User ID
  const handleFilterByCitizen = (userId) => {
    setCurrentView("all");
    setPage(1);
    setFilters({
      search: userId,
      priority: "",
      department: "",
      status: "",
      human_review: null,
    });
  };


  // Detail Modal Open Handler
  const handleSelectComplaint = async (complaintId) => {
    setLoadingDetail(true);
    try {
      const data = await fetchComplaintDetail(complaintId);
      setSelectedComplaint(data);
    } catch (err) {
      console.error("Failed to fetch complaint detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Status Update Handler
  const handleStatusUpdate = async (complaintId, newStatus, notes, resolutionProofUrl = null) => {
    setUpdatingStatus(true);
    try {
      const updated = await updateComplaintStatus(complaintId, newStatus, notes, resolutionProofUrl);
      setSelectedComplaint(updated);
      await Promise.all([loadComplaints(), loadStatistics()]);
      return true;
    } catch (err) {
      alert("Failed to update status: " + err.message);
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Logout Handler
  const handleLogout = () => {
    adminLogout();
    setUser(null);
  };

  // Auth Checking Splash
  if (checkingAuth) {
    return (
      <div className="login-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#60a5fa", fontFamily: "var(--font-mono)" }}>
          <RefreshCw size={22} className="animate-spin" />
          <span>INITIALIZING COMMAND CENTER...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!user) {
    return <LoginPage onLoginSuccess={(u) => setUser(u)} />;
  }

  const stats = statistics || {};
  const byPriority = stats.by_priority || {};
  const byStatus = stats.by_status || {};

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <AdminSidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        statistics={statistics}
      />

      {/* Main Container */}
      <div className="admin-main">
        {/* Top Navbar */}
        <AdminNavbar
          user={user}
          onLogout={handleLogout}
          onRefresh={() => {
            loadStatistics();
            loadComplaints();
          }}
          loading={loadingList}
          newComplaintAlert={newComplaintAlert}
          onDismissAlert={() => setNewComplaintAlert(null)}
        />

        {/* Scrollable Content Workspace */}
        <main className="admin-content">
          {/* Page Title Bar */}
          <div className="page-title-bar">
            <div>
              <h1 className="page-title">
                {currentView === "citizens"
                  ? "Customer Accounts & Credentials Registry"
                  : currentView === "analytics"
                  ? "Municipal SLA Performance & Resolution Analytics"
                  : currentView === "dashboard"
                  ? "Operational Triage Dashboard"
                  : currentView === "critical"
                  ? "Critical Priority Incidents"
                  : currentView === "high"
                  ? "High Priority Incidents"
                  : currentView === "review"
                  ? "Human Review Required Queue"
                  : currentView === "departments"
                  ? "Department Caseload Roster"
                  : currentView === "resolved"
                  ? "Resolved Cases Archive"
                  : "All Grievance Records"}
              </h1>
              <p className="page-desc">
                {currentView === "citizens"
                  ? "Master customer directory, administrative credential recovery, and citizen grievance telemetry"
                  : currentView === "analytics"
                  ? "Department resolution turnaround efficiency, SLA compliance rates, and citizen star ratings"
                  : "Centralized municipal intelligence, AI severity segmentation, and citizen grievance resolution"}
              </p>
            </div>
          </div>

          {/* Top KPI Metrics Bar */}
          <div className="kpi-grid">
            <MetricCard
              title="Total Cases"
              value={stats.total}
              icon={FileText}
              variant="default"
              active={currentView === "all" || currentView === "dashboard"}
              onClick={() => handleViewChange("all")}
            />
            <MetricCard
              title="SLA Analytics"
              value="Reports"
              icon={TrendingUp}
              variant="default"
              active={currentView === "analytics"}
              onClick={() => handleViewChange("analytics")}
            />
            <MetricCard
              title="Customer Accounts"
              value={stats.citizens_count || 0}
              icon={Users}
              variant="default"
              active={currentView === "citizens"}
              onClick={() => handleViewChange("citizens")}
            />
            <MetricCard
              title="Critical"
              value={byPriority["CRITICAL"] || byPriority["Critical"]}
              icon={AlertTriangle}
              variant="critical"
              active={currentView === "critical" || filters.priority === "CRITICAL"}
              onClick={() => handleViewChange("critical")}
            />
            <MetricCard
              title="High Priority"
              value={byPriority["HIGH"] || byPriority["High"]}
              icon={AlertTriangle}
              variant="high"
              active={currentView === "high" || filters.priority === "HIGH"}
              onClick={() => handleViewChange("high")}
            />
            <MetricCard
              title="Medium"
              value={byPriority["MEDIUM"] || byPriority["Medium"]}
              variant="medium"
              active={filters.priority === "MEDIUM"}
              onClick={() => {
                setCurrentView("all");
                handleFilterChange("priority", "MEDIUM");
              }}
            />
            <MetricCard
              title="Low Priority"
              value={byPriority["LOW"] || byPriority["Low"]}
              variant="low"
              active={filters.priority === "LOW"}
              onClick={() => {
                setCurrentView("all");
                handleFilterChange("priority", "LOW");
              }}
            />
            <MetricCard
              title="Human Review"
              value={stats.human_review_required || stats.human_review}
              icon={ShieldAlert}
              variant="review"
              active={currentView === "review" || filters.human_review === true}
              onClick={() => handleViewChange("review")}
            />
            <MetricCard
              title="Pending"
              value={stats.pending}
              icon={Clock}
              variant="pending"
              active={filters.status === "Submitted"}
              onClick={() => {
                setCurrentView("all");
                handleFilterChange("status", "Submitted");
              }}
            />
            <MetricCard
              title="Resolved"
              value={stats.resolved}
              icon={CheckCircle2}
              variant="resolved"
              active={currentView === "resolved" || filters.status === "Resolved"}
              onClick={() => handleViewChange("resolved")}
            />
          </div>

          {/* Conditional Rendering: Analytics, Customer Accounts Registry, or Grievance Operations */}
          {currentView === "analytics" ? (
            <AnalyticsDashboard />
          ) : currentView === "citizens" ? (
            <CitizenAccountsTable onFilterByCitizen={handleFilterByCitizen} />
          ) : (
            <>
              {/* Real-time Analytics Visualizers */}
              {currentView === "dashboard" && (
                <Charts statistics={statistics} />
              )}

              {/* Department Directory View */}
              {currentView === "departments" && (
                <div className="analytics-section">
                  <div className="analytics-header">
                    <div className="analytics-title">
                      <Building size={18} color="#3b82f6" />
                      <span>Civic Department Directory (13 Canonical Jurisdictions)</span>
                    </div>
                  </div>
                  <div className="dept-matrix-grid">
                    {departments.map((dept) => {
                      const count = (stats.by_department && stats.by_department[dept]) || 0;
                      return (
                        <div
                          key={dept}
                          className="dept-card"
                          onClick={() => {
                            handleFilterChange("department", dept);
                            setCurrentView("all");
                          }}
                        >
                          <div>
                            <div className="dept-name">{dept}</div>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                              {count === 1 ? "1 Active Case" : `${count} Active Cases`}
                            </span>
                          </div>
                          <span className="dept-count-badge">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main Complaints Table */}
              <ComplaintsTable
                complaints={complaints}
                loading={loadingList}
                total={totalComplaints}
                page={page}
                limit={limit}
                totalPages={totalPages}
                filters={filters}
                onFilterChange={handleFilterChange}
                onPageChange={(newPage) => setPage(newPage)}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
                onSelectComplaint={handleSelectComplaint}
                departments={departments}
                priorities={priorities}
                onRefresh={() => {
                  loadComplaints();
                  loadStatistics();
                }}
              />
            </>
          )}

        </main>
      </div>

      {/* Slide-over Detailed Dossier Drawer */}
      {selectedComplaint && (
        <ComplaintDetailDrawer
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onStatusUpdate={handleStatusUpdate}
          updating={updatingStatus}
        />
      )}
    </div>
  );
}
