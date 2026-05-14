import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../services/api";

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
      const res = await apiFetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        await register(data.token, { name, email });
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="card auth-card">
      <h2>Create your account</h2>
      <p className="muted center">Sign up in seconds.</p>

      <form className="flex-col" onSubmit={handleSubmit}>
        <div>
          <label className="form-label">Full name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

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
            placeholder="Create a strong password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="message error">{error}</div>}

        <button type="submit" disabled={loading} className="primary">
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <p className="center muted">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </form>
    </div>
  );
}
