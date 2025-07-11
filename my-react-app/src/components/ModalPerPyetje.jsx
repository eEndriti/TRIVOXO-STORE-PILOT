// CustomModal.js
import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
function CustomModal({ show, handleClose, handleConfirm }) {
  const {t} = useTranslation('others')
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{t('A jeni i sigurt?')}</Modal.Title>
      </Modal.Header>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          {t('Anulo')}
        </Button>
        <Button variant="primary" onClick={() => { handleConfirm(); handleClose(); }}>
          {t('Po, Vazhdo')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CustomModal;
