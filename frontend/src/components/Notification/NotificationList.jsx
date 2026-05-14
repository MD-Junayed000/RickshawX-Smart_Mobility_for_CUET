import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../services/api";

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/notification/user/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setNotifications(data);
      } else {
        setError(data.error || "Failed to fetch notifications");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const handler = () => fetchNotifications();
    window.addEventListener("rickshawx:refresh", handler);
    return () => window.removeEventListener("rickshawx:refresh", handler);
  }, [user?.id]);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Notifications</h2>
          <p className="muted">Recent activity across rides and payments.</p>
        </div>
        <button className="ghost" type="button" onClick={fetchNotifications}>
          Refresh
        </button>
      </div>

      {loading && <div className="empty">Loading notifications...</div>}

      {!loading && error && <div className="message error">{error}</div>}

      {!loading && !error && notifications.length === 0 && (
        <div className="empty">
          <h3>No notifications yet</h3>
          <p className="muted">Create a ride to see events here.</p>
        </div>
      )}

      {!loading && !error && notifications.length > 0 && (
        <div className="notification-list">
          {notifications.map((item) => (
            <div key={item.notificationId} className="notification-item">
              <div>
                <h4>{item.title}</h4>
                <p>{item.message}</p>
              </div>
              <span className="muted">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
