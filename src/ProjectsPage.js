import React from 'react';
import { Link } from 'react-router-dom';
import './css/ProjectsPage.css';

const projects = [
  {
    id: 1,
    title: 'Project One',
    description: 'A brief description of the first project.',
    image: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?fit=crop&w=500&q=60',
  },
  {
    id: 2,
    title: 'Project Two',
    description: 'A brief description of the second project.',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?fit=crop&w=500&q=60',
  },
  {
    id: 3,
    title: 'Project Three',
    description: 'A brief description of the third project.',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?fit=crop&w=500&q=60',
  },
];

function ProjectsPage() {
  return (
    <div className="projects-container">
      <h1>My Projects</h1>
      <div className="projects-grid">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <img src={project.image} alt={project.title} />
            <div className="project-overlay">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <button className="cta-button">View Project</button>
            </div>
          </div>
        ))}
      </div>
      <Link to="/contact" className="cta-button">Contact Me</Link>
    </div>
  );
}

export default ProjectsPage;
