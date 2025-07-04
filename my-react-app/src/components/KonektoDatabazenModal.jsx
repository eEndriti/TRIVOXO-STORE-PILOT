// src/components/KonektoDatabazen.jsx
import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useToast } from './ToastProvider';
const KonektoDatabazen = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    server: '',
    database: '',
    user: '',
    password: '',
    encrypt: true,
    trustServerCertificate: true
  });

  const [loading, setLoading] = useState(true);
  const showToast = useToast()
  useEffect(() => {
    if (isOpen) {
      window.api.loadDbConfig().then(config => {
        setFormData(config);
        setLoading(false);
      });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await window.api.saveDbConfig(formData);
    showToast('✅ Konfigurimi u ruajt me sukses!','success');
    onClose();
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Konekto me Databazën</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <div className="mt-2">Duke ngarkuar konfigurimin...</div>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Server</Form.Label>
              <Form.Control
                type="text"
                name="server"
                value={formData.server}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Database</Form.Label>
              <Form.Control
                type="text"
                name="database"
                value={formData.database}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="user"
                value={formData.user}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>
              <Form.Group className='my-3 border border-1 p-2 rounded' >
                <Button variant="outline-primary" onClick={async () => {
                    const folderPath = await window.api.selectPdfFolder();
                    if (folderPath) {
                      setFormData(prev => ({ ...prev, pdfFolder: folderPath }));
                    }
                  }}>
                    Zgjedh dosjen për PDF
                  </Button>

                  {formData.pdfFolder && (
                    <div className="mt-2"><strong>Dosja:</strong> {formData.pdfFolder}</div>
                  )}
              </Form.Group>
            <Form.Group className="mb-3" controlId="encrypt">
              <Form.Check
                type="checkbox"
                label="Encrypt Connection"
                name="encrypt"
                checked={formData.encrypt}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="trustServerCertificate">
              <Form.Check
                type="checkbox"
                label="Trust Server Certificate"
                name="trustServerCertificate"
                checked={formData.trustServerCertificate}
                onChange={handleChange}
              />
            </Form.Group>
          

           

            <div className="d-flex justify-content-between">
              <Button variant="secondary" onClick={onClose}>
                Anulo
              </Button>
              <Button variant="primary" type="submit">
                Ruaj
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default KonektoDatabazen;
