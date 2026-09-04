import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import TransactionDetail from "./pages/TransactionDetail";
import Analytics from "./pages/Analytics";
import RecoveryCenter from "./pages/RecoveryCenter";
import Settings from "./pages/Settings";

// The app shell (sidebar + topbar) only wraps authenticated pages —
// the login screen renders standalone.
function AppShell() {
  return (
    <div className="rr-shell">
      <Sidebar />
      <Topbar />
      <main className="rr-main">
        <Outlet />
      </main>
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/transactions/:id" element={<TransactionDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/recovery" element={<RecoveryCenter />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
