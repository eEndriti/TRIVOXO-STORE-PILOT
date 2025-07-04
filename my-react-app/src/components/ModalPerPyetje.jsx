// CustomModal.js
import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function CustomModal({ show, handleClose, handleConfirm }) {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>A jeni i sigurt?</Modal.Title>
      </Modal.Header>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Anulo
        </Button>
        <Button variant="primary" onClick={() => { handleConfirm(); handleClose(); }}>
          Po, Vazhdo
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CustomModal;
