import React from 'react';
import './css/Footer.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLinkedin, faGithub, faInstagram } from '@fortawesome/free-brands-svg-icons';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-contact">
          <h3>Contact Me</h3>
          <p>Email: your.email@example.com</p>
          <p>Phone: (123) 456-7890</p>
        </div>
        <div className="footer-social">
          <h3>Follow Me</h3>
          <div className="social-icons">
            <a href="#" className="social-icon-link"><FontAwesomeIcon icon={faLinkedin} /></a>
            <a href="#" className="social-icon-link"><FontAwesomeIcon icon={faGithub} /></a>
            <a href="#" className="social-icon-link"><FontAwesomeIcon icon={faInstagram} /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 Your Name. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
