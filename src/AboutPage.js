import React from 'react';
import { Link } from 'react-router-dom';
import './css/AboutPage.css';

function AboutPage() {
  return (
    <div className="about-container">
      <div className="about-content">
        <div className="about-image">
          <img src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?fit=crop&w=500&q=60" alt="Profile" />
        </div>
        <div className="about-text">
          <h1>About Me</h1>
          <p>
            I am a passionate and creative web developer with a knack for building beautiful and functional websites. I have experience with a variety of technologies, including React, Node.js, and Firebase. I am always looking for new challenges and opportunities to grow as a developer.
          </p>
          <Link to="/projects" className="cta-button">View My Work</Link>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
