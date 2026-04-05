import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./css/App.css";

function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Immediately go to login so the UI doesn't wait on extra network calls
      navigate("/");

      // Fire-and-forget profile setup (runs in background)
      (async () => {
        try {
          const tasks = [];
          if (name) {
            tasks.push(updateProfile(cred.user, { displayName: name }));
          }
          tasks.push(
            setDoc(
              doc(db, "users", cred.user.uid),
              {
                email,
                name: name || "",
                phone: "",
                profilePicture: "",
                createdAt: new Date().toISOString(),
              },
              { merge: true }
            )
          );
          await Promise.all(tasks);
        } catch (backgroundErr) {
          console.error("Background profile setup failed", backgroundErr);
        }
      })();
    } catch (err) {
      setError(err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container" style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Register</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
        <div className="input-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p style={{ color: "red", marginBottom: 10, fontSize: "0.9rem" }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p style={{ marginTop: 10, fontSize: "0.9rem", textAlign: "center" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
