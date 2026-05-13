import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        register({ name, email });
        localStorage.setItem("token", data.token);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2>🚀 Join CUETxRIDES</h2>
      <p style={{ color: "#666", marginBottom: "24px", textAlign: "center" }}>
        Create your account and start booking rides today
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
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Password
          </label>
          <input
            type="password"
            placeholder="Create a strong password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(244, 67, 54, 0.1)",
              color: "#d32f2f",
              border: "1px solid #f44336",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ marginTop: "16px" }}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: "16px",
            color: "#666",
            fontSize: "0.9rem",
          }}
        >
          Already have an account?{" "}
          <a
            href="/login"
            style={{
              color: "#2d6cdf",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            Sign in here
          </a>
        </p>
      </form>
    </div>
  );
}
