import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch, withAuth } from "../../services/api";

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
      const res = await apiFetch(
        "/ride",
        withAuth({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ origin, destination }),
        }),
      );
      const data = await res.json();

      if (res.ok) {
        const userId = user?.id || user?.email || "user-demo";
        const driverId = "driver-demo";

        await apiFetch(
          `/ride/${data.rideId}/accept`,
          withAuth({
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ driverId }),
          }),
        );

        const pickupLocation = {
          address: origin,
          coordinates: { lat: 22.459, lng: 91.969 },
        };
        const dropoffLocation = {
          address: destination,
          coordinates: { lat: 22.463, lng: 91.965 },
        };

        const tripRes = await apiFetch("/trip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            driverId,
            rideId: data.rideId,
            pickupLocation,
            dropoffLocation,
          }),
        });

        if (tripRes.ok) {
          setMessage("Ride and trip created. Start or end the trip below.");
          setMessageType("success");
          window.dispatchEvent(new Event("rickshawx:refresh"));
        } else {
          const tripError = await tripRes.json();
          setMessage(tripError.message || "Trip creation failed");
          setMessageType("error");
        }

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
      <div className="card-header">
        <div>
          <h2>Book a ride</h2>
          <p className="muted">Create a ride and initialize a trip.</p>
        </div>
      </div>

      <form className="flex-col" onSubmit={handleSubmit}>
        <div>
          <label className="form-label">Pickup location</label>
          <input
            type="text"
            placeholder="Enter pickup location"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label">Destination</label>
          <input
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
        </div>

        {message && <div className={`message ${messageType}`}>{message}</div>}

        <div className="fare-note">
          <span className="label">Fare model</span>
          <p>Base BDT 20 + BDT 15 per km + BDT 2 per minute.</p>
        </div>

        <button type="submit" disabled={loading} className="primary">
          {loading ? "Creating Ride..." : "Book Now"}
        </button>
      </form>
    </div>
  );
}
