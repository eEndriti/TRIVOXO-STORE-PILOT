// components/NotFound.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'; // Importing a warning icon
import '../assets/css/NotFound.css'; // Import your CSS file for styling

const NotFound = () => {
  return (
    <div className="not-found-container mt-5 pt-5 shadow-lg">
      <div className="icon">
        <FontAwesomeIcon icon={faExclamationTriangle} size="6x" />
      </div>
      <h1>404</h1>
      <p>Na vjen keq, kjo faqe nuk ekziston. Kontrolloni linkun ose kthehuni në <a href='/faqjaKryesore/' className='text-decoration-none text-light'>faqen kryesore.</a></p>
    </div>
  );
};

export default NotFound;
