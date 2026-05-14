import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        await login(data.token, { email });
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="card auth-card">
      <h2>Welcome back</h2>
      <p className="muted center">Sign in to continue.</p>

      <form className="flex-col" onSubmit={handleSubmit}>
        <div>
          <label className="form-label">Email address</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="form-label">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="message error">{error}</div>}

        <button type="submit" disabled={loading} className="primary">
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <p className="center muted">
          Don't have an account? <a href="/register">Create one</a>
        </p>
      </form>
    </div>
  );
}
