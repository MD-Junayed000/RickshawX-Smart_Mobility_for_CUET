import React from "react";

export default function NotificationList() {
  // Placeholder for notification integration
  return (
    <div className="card">
      <h3>🔔 Notifications</h3>
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          color: "#666",
          background: "rgba(255, 255, 255, 0.5)",
          borderRadius: "8px",
          border: "2px dashed #e3f2fd",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📱</div>
        <p style={{ margin: "0 0 16px 0", fontWeight: "600" }}>
          Notification Center
        </p>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>
          Stay updated with ride status, payments, and important announcements.
        </p>
        <p style={{ margin: "16px 0 0 0", fontSize: "0.8rem", color: "#999" }}>
          (Coming soon)
        </p>
      </div>
    </div>
  );
}
