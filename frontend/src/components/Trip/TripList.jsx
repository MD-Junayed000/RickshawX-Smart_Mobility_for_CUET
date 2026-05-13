import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export default function TripList() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3002/ride/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setRides(data);
      } else {
        setError(data.error || "Failed to fetch rides");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "accepted":
        return "status-accepted";
      case "completed":
        return "status-completed";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h2>🚗 My Rides</h2>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>⏳</div>
          <p>Loading your rides...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>🚗 My Rides</h2>
        <div
          style={{
            padding: "16px",
            borderRadius: "8px",
            background: "rgba(244, 67, 54, 0.1)",
            color: "#d32f2f",
            border: "1px solid #f44336",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>🚗 My Rides</h2>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        View your ride history
      </p>

      {rides.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚗</div>
          <h3>No rides yet</h3>
          <p style={{ color: "#666" }}>Book your first ride to get started!</p>
        </div>
      ) : (
        <div className="ride-list">
          {rides.map((ride) => (
            <div key={ride.rideId} className="ride-card">
              <div className="ride-header">
                <h3>Ride #{ride.rideId.slice(0, 8)}</h3>
                <span className={`status-badge ${getStatusColor(ride.status)}`}>
                  {ride.status}
                </span>
              </div>

              <div className="ride-details">
                <div className="ride-location">
                  <div className="location-item">
                    <span className="location-icon">📍</span>
                    <div>
                      <strong>From:</strong> {ride.origin}
                    </div>
                  </div>
                  <div className="location-item">
                    <span className="location-icon">🎯</span>
                    <div>
                      <strong>To:</strong> {ride.destination}
                    </div>
                  </div>
                </div>

                {ride.fare && (
                  <div className="ride-fare">
                    <strong>Fare:</strong> ৳{ride.fare}
                  </div>
                )}

                <div className="ride-date">
                  <strong>Booked:</strong>{" "}
                  {new Date(ride.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
