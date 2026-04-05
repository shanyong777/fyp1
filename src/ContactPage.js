import React from 'react';
import './css/ContactPage.css';

function ContactPage() {
  return (
    <div className="contact-container">
      <h1>Contact Me</h1>
      <form className="contact-form">
        <input type="text" placeholder="Your Name" required />
        <input type="email" placeholder="Your Email" required />
        <textarea placeholder="Your Message" rows="5" required></textarea>
        <button type="submit">Send Message</button>
      </form>
    </div>
  );
}

export default ContactPage;
