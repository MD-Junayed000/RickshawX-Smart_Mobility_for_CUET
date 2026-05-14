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
        <div className="hero-content">
          <h1>CUETxRIDES</h1>
          <p>
            Smart mobility for the CUET campus. Book rides, manage trips, and
            confirm payments with real-time updates.
          </p>
          <div className="hero-meta">
            Signed in as <strong>{user?.name || user?.email}</strong>
          </div>
        </div>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <h3>Ride lifecycle</h3>
          <p>Request, start, and complete trips from one place.</p>
        </div>
        <div className="info-card">
          <h3>Payments and alerts</h3>
          <p>Fare and payment status sync across services.</p>
        </div>
        <div className="info-card">
          <h3>Event-driven</h3>
          <p>RabbitMQ connects trips, payments, and notifications.</p>
        </div>
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
