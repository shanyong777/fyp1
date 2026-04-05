import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/Navbar.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBriefcase, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from './AuthContext';

function Navbar({ theme, toggleTheme }) {
  const [click, setClick] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth() || {};

  const handleClick = () => setClick(!click);
  const closeMobileMenu = () => setClick(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          My Portfolio
        </Link>
        <div className="menu-icon" onClick={handleClick}>
          <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
        </div>
        <ul className={click ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <Link to="/about" className="nav-links" onClick={closeMobileMenu}>
              <FontAwesomeIcon icon={faUser} /> About
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/projects" className="nav-links" onClick={closeMobileMenu}>
              <FontAwesomeIcon icon={faBriefcase} /> Projects
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/contact" className="nav-links" onClick={closeMobileMenu}>
              <FontAwesomeIcon icon={faEnvelope} /> Contact
            </Link>
          </li>
          {!user && (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-links" onClick={closeMobileMenu}>
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-links" onClick={closeMobileMenu}>
                  Register
                </Link>
              </li>
            </>
          )}
          {user && (
            <>
              <li className="nav-item">
                <Link to="/editor" className="nav-links" onClick={closeMobileMenu}>
                  My Workspace
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/profile" className="nav-links" onClick={closeMobileMenu}>
                  Profile
                </Link>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className="nav-links"
                  onClick={async () => {
                    closeMobileMenu();
                    try {
                      await signOut();
                    } finally {
                      navigate('/');
                    }
                  }}
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
