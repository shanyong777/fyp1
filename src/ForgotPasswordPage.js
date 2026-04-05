import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";
import "./css/App.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Please check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container" style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && (
          <p style={{ color: "red", marginBottom: 10, fontSize: "0.9rem" }}>
            {error}
          </p>
        )}
        {message && (
          <p style={{ color: "green", marginBottom: 10, fontSize: "0.9rem" }}>
            {message}
          </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p style={{ marginTop: 10, fontSize: "0.9rem", textAlign: "center" }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  );
}

export default ForgotPasswordPage;

