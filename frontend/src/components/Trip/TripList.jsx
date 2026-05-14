import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../services/api";

export default function TripList() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const { user } = useAuth();

  const fetchTrips = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await apiFetch(`/trip/user/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setTrips(data.data || data);
      } else {
        setError(data.message || "Failed to fetch trips");
      }
    } catch (err) {
      setError("Network error");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchTrips();
    const handler = () => fetchTrips();
    window.addEventListener("rickshawx:refresh", handler);
    return () => window.removeEventListener("rickshawx:refresh", handler);
  }, [user?.id]);

  const startTrip = async (tripId) => {
    setActionId(tripId);
    await apiFetch(`/trip/${tripId}/start`, { method: "PUT" });
    await fetchTrips();
    setActionId(null);
  };

  const endTrip = async (tripId, fallbackLocation) => {
    setActionId(tripId);
    await apiFetch(`/trip/${tripId}/end`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endLocation: fallbackLocation }),
    });
    await fetchTrips();
    window.dispatchEvent(new Event("rickshawx:refresh"));
    setActionId(null);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Trips</h2>
            <p className="muted">Loading trip activity.</p>
          </div>
        </div>
        <div className="empty">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Trips</h2>
            <p className="muted">Trip activity</p>
          </div>
        </div>
        <div className="message error">{error}</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Trips</h2>
          <p className="muted">Start or end a trip to compute fare.</p>
        </div>
        <button className="ghost" onClick={fetchTrips} type="button">
          Refresh
        </button>
      </div>

      {trips.length === 0 ? (
        <div className="empty">
          <h3>No trips yet</h3>
          <p className="muted">Create a ride to initialize a trip.</p>
        </div>
      ) : (
        <div className="trip-list">
          {trips.map((trip) => {
            const canStart = trip.status === "pending";
            const canEnd = trip.status === "started";
            return (
              <div key={trip.tripId} className="trip-card">
                <div className="trip-header">
                  <div>
                    <h3>Trip {trip.tripId.slice(0, 8)}</h3>
                    <p className="muted">Ride {trip.rideId}</p>
                  </div>
                  <span className={`status-badge status-${trip.status}`}>
                    {trip.status}
                  </span>
                </div>

                <div className="trip-details">
                  <div>
                    <div className="label">Pickup</div>
                    <div>{trip.pickupLocation?.address || "-"}</div>
                  </div>
                  <div>
                    <div className="label">Dropoff</div>
                    <div>{trip.dropoffLocation?.address || "-"}</div>
                  </div>
                  <div>
                    <div className="label">Created</div>
                    <div>{formatDate(trip.createdAt)}</div>
                  </div>
                </div>

                <div className="trip-meta">
                  <div>
                    <span className="label">Fare</span>
                    <strong>
                      {trip.fare ? `BDT ${trip.fare.toFixed(2)}` : "-"}
                    </strong>
                  </div>
                  <div>
                    <span className="label">Payment</span>
                    <strong>{trip.paymentStatus || "pending"}</strong>
                  </div>
                  <div>
                    <span className="label">Duration</span>
                    <strong>
                      {trip.duration ? `${trip.duration} min` : "-"}
                    </strong>
                  </div>
                </div>

                <div className="trip-actions">
                  {canStart && (
                    <button
                      className="primary"
                      type="button"
                      onClick={() => startTrip(trip.tripId)}
                      disabled={actionId === trip.tripId}
                    >
                      Start trip
                    </button>
                  )}
                  {canEnd && (
                    <button
                      className="primary"
                      type="button"
                      onClick={() =>
                        endTrip(trip.tripId, trip.dropoffLocation || null)
                      }
                      disabled={actionId === trip.tripId}
                    >
                      End trip
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
