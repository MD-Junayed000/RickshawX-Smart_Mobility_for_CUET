import React from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ProtectedRoute from "./components/ProtectedRoute";

function Navbar() {
  const { isLoggedIn, logout, user } = useAuth();

  return (
    <nav>
      <div className="brand">
        CUET<span>x</span>RIDES
      </div>
      <div>
        {isLoggedIn ? (
          <>
            <span style={{ color: "#ffe082", marginRight: "16px" }}>
              Welcome, {user?.name || "User"}!
            </span>
            <Link to="/dashboard">Dashboard</Link>
            <button
              onClick={logout}
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid #fff",
                marginLeft: "16px",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  const { isLoggedIn } = useAuth();

  return (
    <div>
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
