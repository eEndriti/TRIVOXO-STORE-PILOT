import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Button,
  Modal,
  Table,
  Form,
  Card,
  Badge,
  Container,
  Row,
  Col,
  Alert,
  InputGroup,
  Spinner
} from 'react-bootstrap';
import {
  faArrowsRotate,
  faCheck,
  faBan,
  faHistory,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AuthContext, { formatCurrency } from "../components/AuthContext";
import { useToast } from './ToastProvider';
import AnimatedSpinner from './AnimatedSpinner';
import Cookies from 'js-cookie';
import {ToastContainer } from 'react-toastify';

export default function Nderrimet() {
  const showToast = useToast();
  const { authData } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const [nderrime, setNderrime] = useState([]);                  // all shifts
  const [nderrimiAktiv, setNderrimiAktiv] = useState(null);      // the open one

  // date filters
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString().slice(0, 10);
  const defaultEnd = today.toISOString().slice(0, 10);

  const [dataFillimit, setDataFillimit] = useState(defaultStart);
  const [dataMbarimit, setDataMbarimit] = useState(defaultEnd);

  // modal flags
  const [showMbyllModal, setShowMbyllModal] = useState(false);
  const [showNdryshoAvansModal, setShowNdryshoAvansModal] = useState(false);

  // reload trigger
  const [triggerReload, setTriggerReload] = useState(false);

  // fetch all shifts and set active
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await window.api.fetchTableNderrimi();
        setNderrime(Array.isArray(data) ? data : []);
        setNderrimiAktiv(
          (Array.isArray(data) ? data : []).find(item => item.iHapur)
        );
      } catch (err) {
        showToast('Gabim gjatë marrjes së të dhënave: ' + err, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [triggerReload, showToast]);

  // parse a date string/obj and format "dd-Month-yyyy / hh:mm:ss"
  const albanianMonths = [
    "Janar","Shkurt","Mars","Prill","Maj","Qershor",
    "Korrik","Gusht","Shtator","Tetor","Nëntor","Dhjetor"
  ];


  const formatLongDateToAlbanian = (input) => {
    if (!input) return '-';
    const d = new Date(input);
    if (isNaN(d)) return '-';
    const day   = d.getDate();
    const mon   = albanianMonths[d.getMonth()];
    const year  = d.getFullYear();
    const time  = d.toLocaleTimeString().split(' ')[0];
    return `${day}-${mon}-${year} / ${time}`;
  };

  function formatUTCDate(dateString) {
    const d = new Date(dateString);


      const day     = d.getUTCDate().toString().padStart(2, '0');
      const month   = albanianMonths[d.getUTCMonth()];
      const year    = d.getUTCFullYear();
      const hours   = d.getUTCHours().toString().padStart(2, '0');
      const minutes = d.getUTCMinutes().toString().padStart(2, '0');

      return `${day} ${month} ${year} / ${hours}:${minutes}`;
  }
  


    
  // compute filtered list with a single useMemo
  const filteredNderrime = useMemo(() => {
    if (!Array.isArray(nderrime)) return [];
    const startTs = new Date(dataFillimit).setHours(0,0,0,0);
    const endTs   = new Date(dataMbarimit).setHours(23,59,59,999);

    return nderrime.filter(item => {
      if (!item?.dataFillimit) return false;
      const itemStartTs = new Date(item.dataFillimit).getTime();
      const itemEndTs   = item.dataMbarimit
        ? new Date(item.dataMbarimit).getTime()
        : itemStartTs;
      return itemStartTs >= startTs && itemEndTs <= endTs;
    });
  }, [nderrime, dataFillimit, dataMbarimit]);

  // close current shift
  const mbyllNderrimin = async () => {
    setButtonLoading(true);
    try {
      await window.api.mbyllNderriminAktual();
      showToast('Ndërrimi u mbyll me sukses!', 'success');
      localStorage.clear();
      Cookies.clear()
      return;
    } catch (err) {
      showToast('Gabim gjatë mbylljes: ' + err, 'error');
    } finally {
      setButtonLoading(false);
      setShowMbyllModal(false);
      setTriggerReload(r => !r);
      Object.keys(Cookies.get()).forEach(name => {
        Cookies.remove(name);
      })
      window.location.reload()
    }
  };

  // change advance on the active shift
  const ndryshojeAvansin = async () => {
    if (!nderrimiAktiv) return;
    setButtonLoading(true);
    try {
      await window.api.ndryshojeAvansinNderrimitAktual({
        ...nderrimiAktiv,
        perdoruesiID: authData.perdoruesiID,
        nderrimiID:  nderrimiAktiv.nderrimiID
      });
      showToast('Avansi u ndryshua me sukses!', 'success');
      Cookies.set('avansi', nderrimiAktiv.avansi);
    } catch (err) {
      showToast('Gabim gjatë ndryshimit të avansit: ' + err, 'error');
    } finally {
      setButtonLoading(false);
      setShowNdryshoAvansModal(false);
      setTriggerReload(r => !r);
    }
  };

  if (loading) {
    return <AnimatedSpinner />;
  }

  return (
    <>
      <Container>
        <h2 className="mb-4">Menaxhimi i Ndërrimeve</h2>

        {/* Active Shift Card */}
        {nderrimiAktiv && (
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h5>
                Ndërrimi Aktual <Badge bg="success">Aktive</Badge>
              </h5>
              <p>
                <strong>Filloi me:</strong>{' '}
                { formatUTCDate(nderrimiAktiv.dataFillimit)  }
              </p>
              <p>
                <strong>Avansi:</strong>{' '}
                { formatCurrency(nderrimiAktiv.avansi) }
              </p>

              <Button
                variant="outline-primary"
                className="me-2"
                onClick={() => setShowNdryshoAvansModal(true)}
              >
                <FontAwesomeIcon icon={faArrowsRotate} className="me-2"/>
                Ndrysho Avansin
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => setShowMbyllModal(true)}
              >
                <FontAwesomeIcon icon={faBan} className="me-2"/>
                Mbyll Ndërrimin
              </Button>
            </Card.Body>
          </Card>
        )}

        {/* Date Filters */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group controlId="filterStartDate">
              <Form.Label>Data Fillimit</Form.Label>
              <Form.Control
                type="date"
                value={dataFillimit}
                onChange={e => setDataFillimit(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="filterEndDate">
              <Form.Label>Data Mbarimit</Form.Label>
              <Form.Control
                type="date"
                value={dataMbarimit}
                onChange={e => setDataMbarimit(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* History Table */}
        <Card className="shadow-sm">
          <Card.Header>
            <FontAwesomeIcon icon={faHistory} className="me-2"/>
            Historia e Ndërrimeve
          </Card.Header>
          <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table responsive bordered hover>
              <thead className="table-light">
                <tr>
                  <th>Nr.</th>
                  <th>Koha Fillimit</th>
                  <th>Koha Mbylljes</th>
                  <th>Statusi</th>
                  <th>Avansi</th>
                  <th>Totali pa Avans</th>
                </tr>
              </thead>
              <tbody>
                {filteredNderrime.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">
                      Nuk ka të dhëna për këtë periudhë.
                    </td>
                  </tr>
                )}
                {filteredNderrime
                  .slice().reverse()
                  .map((item, idx) => (
                    <tr key={item.nderrimiID || idx}>
                      <td>{filteredNderrime.length - idx}</td>
                      <td>{formatUTCDate(item.dataFillimit)}</td>
                      <td>
                        {item.dataMbarimit
                          ? formatUTCDate(item.dataMbarimit)
                          : '-'}
                      </td>
                      <td>
                        <Badge bg={item.iHapur ? 'success' : 'secondary'}>
                          {item.iHapur ? 'Aktive' : 'I Mbyllur'}
                        </Badge>
                      </td>
                      <td>
                        {item.avansi
                          ? formatCurrency(item.avansi)
                          : '-'}
                      </td>
                      <td>
                        {formatCurrency(item.totaliArkes)}
                      </td>
                    </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* Change Advance Modal */}
        <Modal
          show={showNdryshoAvansModal}
          onHide={() => setShowNdryshoAvansModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Ndrysho Avansin e Aktivit</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label>Vlera e Avansit (€)</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  min={0}
                  value={nderrimiAktiv?.avansi || ''}
                  onChange={e => setNderrimiAktiv({
                    ...nderrimiAktiv, avansi: e.target.value
                  })}
                />
                <InputGroup.Text>€</InputGroup.Text>
              </InputGroup>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowNdryshoAvansModal(false)}
              disabled={buttonLoading}
            >
              Anulo
            </Button>
            <Button
              variant="primary"
              onClick={ndryshojeAvansin}
              disabled={buttonLoading || !nderrimiAktiv?.avansi}
            >
              {buttonLoading
                ? <Spinner animation="border" size="sm"/>
                : <>
                    <FontAwesomeIcon icon={faCheck} className="me-2"/>
                    Ruaj
                  </>
              }
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Close Shift Confirmation */}
        <Modal
          show={showMbyllModal}
          onHide={() => setShowMbyllModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Konfirmo Mbylljen e Ndërrimit</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="warning" className="d-flex align-items-center">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                size="lg"
                className="me-2"
              />
              <div>
                <strong>Kujdes!</strong> Pas mbylljes do t’ju duhet të kyçeni prapë
                dhe të startoni ndërrimin.
              </div>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowMbyllModal(false)}
              disabled={buttonLoading}
            >
              Anulo
            </Button>
            <Button
              variant="danger"
              onClick={mbyllNderrimin}
              disabled={buttonLoading}
            >
              {buttonLoading
                ? <Spinner animation="border" size="sm"/>
                : <>
                    <FontAwesomeIcon icon={faCheck} className="me-2"/>
                    Mbyll
                  </>
              }
            </Button>
          </Modal.Footer>
        </Modal>

        <ToastContainer />
      </Container>
    </>
  );
}
