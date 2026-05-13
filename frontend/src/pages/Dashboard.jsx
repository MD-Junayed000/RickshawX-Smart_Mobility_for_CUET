import React from "react";
import { useAuth } from "../context/AuthContext";
import TripList from "../components/Trip/TripList";
import TripCreate from "../components/Trip/TripCreate";
import NotificationList from "../components/Notification/NotificationList";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div className="hero-card">
        <h1>Welcome to CUETxRIDES 🚀</h1>
        <p>
          Smart Mobility for CUET Campus (2050):
          <br />
          Book rides, manage trips, pay digitally, and get notified — all in one
          beautiful, simple app.
        </p>
        <img
          src="https://img.icons8.com/color/120/000000/rickshaw.png"
          alt="Rickshaw"
          style={{
            margin: "24px 0",
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))",
          }}
        />
      </div>

      <div className="features-grid">
        <div className="feature-item">
          <h3>🚀 Quick Booking</h3>
          <p>
            Book your ride in seconds with our intuitive interface. Pick your
            pickup and dropoff locations easily.
          </p>
        </div>

        <div className="feature-item">
          <h3>💳 Digital Payments</h3>
          <p>
            Pay securely with digital payments. No more cash hassles -
            everything is digital and traceable.
          </p>
        </div>

        <div className="feature-item">
          <h3>📱 Real-time Tracking</h3>
          <p>
            Track your ride in real-time. Know exactly when your rickshaw will
            arrive and reach your destination.
          </p>
        </div>

        <div className="feature-item">
          <h3>⭐ Rate & Review</h3>
          <p>
            Rate your experience and help improve our service. Your feedback
            matters to us.
          </p>
        </div>
      </div>

      <div className="card">
        <h2>CUETxRIDES Dashboard</h2>
        <p style={{ color: "#666", marginBottom: 0 }}>
          Welcome back, <strong>{user?.name}</strong>! Manage your rides, track
          trips, and stay updated with notifications.
        </p>
      </div>

      <div className="dashboard-grid">
        <div>
          <TripCreate />
          <TripList />
        </div>
        <div>
          <NotificationList />
        </div>
      </div>
    </div>
  );
}
