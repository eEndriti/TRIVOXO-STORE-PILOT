import React, { useState,useEffect } from 'react';
import { Button, Container } from 'react-bootstrap';
import Punonjesit from './Punonjesit';
import Perdoruesit from './Perdoruesit';
import MenyratPagesave from './MenyratPagesave';
import Nderrimet from './Nderrimet'
import { useLocation } from 'react-router-dom';
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';


export default function Administrimi() {
  const [activeSection, setActiveSection] = useState('punonjesit');
  const location = useLocation();
  const showToast = useToast();

  useEffect(() => {
    if (location.state?.showToast) {
      showToast(location.state.message, location.state.type);
    }},[location]);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'punonjesit':
        return <Punonjesit />;
      case 'perdoruesit':
        return <Perdoruesit />;
      case 'menyratPagesave':
        return <MenyratPagesave />;
      case 'nderrimet':
        return <Nderrimet/>
      default:
        return null;
    }
  };

  return (
    <Container className="administrimi-container p-4" >
      <h2 className="mb-4 text-center" style={{ color: '#2A3D4E' }}>Administrimi dhe Menaxhimi</h2>
      <hr/>
      <div className="d-flex justify-content-center mb-4">
        <Button
          variant={activeSection === 'punonjesit' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveSection('punonjesit')}
          className="mx-2"
        >
          Menaxhimi i Punonjësve
        </Button>
        <Button
          variant={activeSection === 'perdoruesit' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveSection('perdoruesit')}
          className="mx-2"
        >
          Menaxhimi i Perdoruesve
        </Button>
        <Button
          variant={activeSection === 'menyratPagesave' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveSection('menyratPagesave')}
          className="mx-2"
        >
          Menaxhimi i Menyrave te Pagesave
        </Button>
        <Button
          variant={activeSection === 'nderrimet' ? 'primary' : 'outline-primary'}
          onClick={() => setActiveSection('nderrimet')}
          className="mx-2"
        >
          Menaxhimi i Nderrimeve
        </Button>
      </div>

      <div className="section-content">
        {renderActiveSection()}
      </div>
      <ToastContainer />
    </Container>
  );
}
