import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import "./css/App.css";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);

      if (rememberMe) {
        window.localStorage.setItem("rememberedEmail", email);
      } else {
        window.localStorage.removeItem("rememberedEmail");
      }

      navigate("/"); // redirect after successful login
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container" style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Login</h2>
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
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="input-group" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ width: "auto" }}
          />
          <label htmlFor="rememberMe" style={{ margin: 0 }}>Remember my email on this device</label>
        </div>
        {error && (
          <p style={{ color: "red", marginBottom: 10, fontSize: "0.9rem" }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p style={{ marginTop: 10, fontSize: "0.9rem", textAlign: "center" }}>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
      <p style={{ marginTop: 4, fontSize: "0.9rem", textAlign: "center" }}>
        No account yet? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

export default LoginPage;

