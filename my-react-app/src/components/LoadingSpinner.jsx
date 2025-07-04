import React from "react";
import { Spinner, Modal } from "react-bootstrap";

function LoadingSpinner({ show }) {
  return (
    <Modal show={show} centered>
      <Modal.Body className="text-center">
        <Spinner animation="border" variant="primary" />
      </Modal.Body>
    </Modal>
  );
}

export default LoadingSpinner;
