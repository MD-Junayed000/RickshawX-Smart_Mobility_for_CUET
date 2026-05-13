import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function TripCreate() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3002/ride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ origin, destination }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("Ride created successfully!");
        setMessageType("success");
        setOrigin("");
        setDestination("");
      } else {
        setMessage(data.error || "Failed to create ride");
        setMessageType("error");
      }
    } catch (err) {
      setMessage("Network error");
      setMessageType("error");
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <h2>🚗 Book a Ride</h2>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Create a new ride request
      </p>

      <form className="flex-col" onSubmit={handleSubmit}>
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#2d6cdf",
            }}
          >
            Pickup Location
          </label>
          <input
            type="text"
            placeholder="Enter pickup location"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#2d6cdf",
            }}
          >
            Destination
          </label>
          <input
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
        </div>

        {message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background:
                messageType === "success"
                  ? "rgba(76, 175, 80, 0.1)"
                  : "rgba(244, 67, 54, 0.1)",
              color: messageType === "success" ? "#2e7d32" : "#d32f2f",
              border: `1px solid ${messageType === "success" ? "#4caf50" : "#f44336"}`,
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}

        <button type="submit" disabled={loading}>
          {loading ? "Creating Ride..." : "Book Now"}
        </button>
      </form>
    </div>
  );
}
