import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { updateEmail, updatePassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import { useAuth } from "./AuthContext";
import "./css/App.css";

const DEFAULT_PROFILE_PICTURE = "https://via.placeholder.com/80?text=User";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading, signOut: signOutUser, refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    setEmail(user.email || "");
    if (user.photoURL) {
      setProfilePicture(user.photoURL);
    }

    const loadProfile = async () => {
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data.phone) setPhone(data.phone);
          if (data.profilePicture && !user.photoURL) {
            setProfilePicture(data.profilePicture);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
      }
    };

    loadProfile();
  }, [user, loading, navigate]);

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file || !user) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const fileRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setProfilePicture(url);

      // Immediately persist URL in Auth profile and Firestore so it is not lost
      const tasks = [
        updateProfile(user, { photoURL: url }),
        setDoc(
          doc(db, "users", user.uid),
          {
            profilePicture: url,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ),
      ];
      await Promise.all(tasks);
      await refreshUser();

      setMessage("Profile picture updated.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const tasks = [];

      // Update email in Auth if changed
      if (email && email !== user.email) {
        tasks.push(updateEmail(user, email));
      }

      // Update password if provided
      if (newPassword) {
        tasks.push(updatePassword(user, newPassword));
      }

      // Update profile picture in Auth
      if (profilePicture !== (user.photoURL || "")) {
        tasks.push(updateProfile(user, { photoURL: profilePicture }));
      }

      // Update Firestore profile document (merge so we can skip extra read)
      const ref = doc(db, "users", user.uid);
      tasks.push(
        setDoc(
          ref,
          {
            email,
            phone,
            profilePicture,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
      );

      await Promise.all(tasks);

      // Refresh auth user so header/profile see latest email/photo without manual reload
      await refreshUser();

      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Loading...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="home-container" style={{ maxWidth: 500, margin: "40px auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>Profile</h2>
      <form onSubmit={handleSave}>
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
          <label>Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="input-group">
          <label>Profile Picture</label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src={profilePicture || DEFAULT_PROFILE_PICTURE}
              alt="Profile"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid #ddd",
              }}
            />
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
          </div>
        </div>

        <div className="input-group">
          <label>New Password (optional)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
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

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button
          type="button"
          onClick={async () => {
            await signOutUser();
            navigate("/login");
          }}
          style={{ width: "auto", padding: "8px 16px" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;

