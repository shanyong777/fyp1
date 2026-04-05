import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/HomePage.css";
import AIDashboard from "./AIDashboard";
import { useAuth } from "./AuthContext";
import { db } from "./firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import FadeIn from './FadeIn';

const templates = [
  {
    id: "blank",
    title: "Blank Canvas",
    description: "Start from scratch with an empty page.",
    image:
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&h=250&fit=crop",
    preview: "A clean empty canvas ready for your layout."
  },
  {
    id: "modern-portfolio",
    title: "Modern Portfolio",
    description: "Elegant typography, gallery highlights, and clean layout.",
    image:
      "https://images.unsplash.com/photo-1526481280695-3c687fd5432c?w=400&h=250&fit=crop",
    preview: "Premium hero + selected work gallery + footer."
  },
  {
    id: "trendy-cafe",
    title: "Trendy Café",
    description: "Warm visuals for cafés and small food brands.",
    image:
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=250&fit=crop",
    preview: "Hero + highlights + reservation CTA."
  },
  {
    id: "tech-startup",
    title: "Tech Startup",
    description: "High-contrast landing for SaaS and startups.",
    image:
      "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&h=250&fit=crop",
    preview: "Gradient hero + feature cards + conversion CTAs."
  }
];

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userDesigns, setUserDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserDesigns() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        // First try a simple query to see if ANY designs exist (avoid index requirement)
        const simpleQ = query(
          collection(db, "designs"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(simpleQ);
        
        // Sort manually locally to avoid needing a Firestore composite index
        const designs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          const aTime = a.updatedAt?.toMillis() || 0;
          const bTime = b.updatedAt?.toMillis() || 0;
          return bTime - aTime;
        }).slice(0, 3);

        setUserDesigns(designs);
        console.log("Successfully fetched designs:", designs.length);
      } catch (err) {
        console.error("Error fetching user designs:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserDesigns();
  }, [user]);

  const handleSelectTemplate = (templateId) => {
    navigate(`/editor/workspace`, { state: { templateId } });
  };

  const handleSelectUserDesign = (designId) => {
    navigate(`/editor/workspace?design=${designId}`);
  };

  return (
    <div className="home-container">
      <FadeIn>
        <section className="hero" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504805572947-34fad45aed93?fit=crop&w=1200&q=60')` }}>
          <div className="hero-content">
            <h1>Create Your Stunning Website</h1>
            <p>Visually design, build, and launch your website with the power of AI.</p>
            <button onClick={() => navigate('/editor')} className="cta-button">Get Started for Free</button>
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <AIDashboard />
      </FadeIn>

      {loading ? (
        <div className="loading-designs">Loading your creations...</div>
      ) : userDesigns.length > 0 ? (
        <FadeIn>
          <section className="user-creations">
            <h2 className="section-title">Your Recent Creations</h2>
            <div className="template-grid">
              {userDesigns.map((design) => (
                <div key={design.id} className="template-card" onClick={() => handleSelectUserDesign(design.id)}>
                  <div className="template-image user-design-preview">
                    <div className="template-overlay">
                      <span>Edit Design</span>
                    </div>
                  </div>
                  <div className="template-info">
                    <h3>{design.title || "Untitled Design"}</h3>
                    <p>Last updated: {design.updatedAt?.toDate().toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>
      ) : user ? (
        <FadeIn>
          <section className="user-creations empty">
            <h2 className="section-title">Your Recent Creations</h2>
            <p className="empty-msg">You haven't saved any designs yet. Choose a template below to get started!</p>
          </section>
        </FadeIn>
      ) : null}

      <FadeIn>
        <section className="templates-section">
          <h2 className="section-title">Explore Templates</h2>
          <div className="template-grid">
            {templates.map((template) => (
              <div key={template.id} className="template-card" onClick={() => handleSelectTemplate(template.id)}>
                <div className="template-image" style={{ backgroundImage: `url(${template.image})` }}>
                  <div className="template-overlay">
                    <span>Select Template</span>
                  </div>
                </div>
                <div className="template-info">
                  <h3>{template.title}</h3>
                  <p>{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>
    </div>
  );
}

export default HomePage;
