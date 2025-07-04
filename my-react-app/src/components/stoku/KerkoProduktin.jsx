import { useState, useEffect } from "react";
import { Modal, Form, Table, Button, Spinner, Alert,Badge } from "react-bootstrap";
import ShtoNjeProdukt from "./ShtoNjeProdukt";
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

export default function KerkoProduktin({ show, onHide, onSelect, meFatureProp }) {
  const [searchFields, setSearchFields] = useState({
    shifra: "",
    emertimi: "",
    pershkrimi: "",
  });
  const [eliminoVleratZero, setEliminoVleratZero] = useState(true);
  const [results, setResults] = useState([]);
  const [produktet, setProduktet] = useState([]);
  const [showShtoProduktinModal, setShowShtoProduktinModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [triggerReload,setTriggerReload] = useState(false)
  const showToast = useToast()

  useEffect(() => {
    fetchProducts();
  }, [triggerReload]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await window.api.fetchTableProdukti();
      setProduktet(data);
    } catch (error) {
      showToast("Nuk u arrit të tërhiqeshin produktet!",'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    
    filterProducts();
  }, [searchFields, eliminoVleratZero, produktet, meFatureProp]);


  const filterProducts = () => {
    console.log('mefature', meFatureProp);

    const filtered = produktet.filter((product) => {
      const matchesShifra = searchFields.shifra 
        ? product.shifra.toLowerCase().includes(searchFields.shifra.toLowerCase()) 
        : true;

      const matchesEmertimi = searchFields.emertimi 
        ? product.emertimi.toLowerCase().includes(searchFields.emertimi.toLowerCase()) 
        : true;

      const matchesPershkrimi = searchFields.pershkrimi 
        ? product.pershkrimi.toLowerCase().includes(searchFields.pershkrimi.toLowerCase()) 
        : true;

      const matchesSasia = eliminoVleratZero ? product.sasia > 0 : true;

      if (meFatureProp != null) {
        if (meFatureProp == 'ngaStoku') {
          const matchesSasiStatike = product.sasiStatike == 0;
          return matchesShifra && matchesEmertimi && matchesPershkrimi && matchesSasia && matchesSasiStatike;
        } else {
          const matchesMeFature = meFatureProp
            ? product.meFatureTeRregullt === "po"
            : product.meFatureTeRregullt === "jo";
          const matchesSasiStatike = product.sasiStatike == 0;
          return matchesShifra && matchesEmertimi && matchesPershkrimi && matchesSasia && matchesMeFature && matchesSasiStatike;
        }
      }

      return matchesShifra && matchesEmertimi && matchesPershkrimi && matchesSasia;
    });

    setResults(filtered);
    setLoading(false);
};


  const handleInputChange = (e) => {
    setSearchFields({ ...searchFields, [e.target.name]: e.target.value });
  };

  const handleProductSelect = (product) => {
    product.cmimiPerCope = product.cmimiShitjes;
    product.sasiaShitjes = product.sasia > 0 ? 1 : 0;
    product.sasiaBlerjes = 0;
    onSelect(product);
    onHide();
  };

  return (
    <>
      {loading ? (
       ' <AnimatedSpinner />'
      ) : (
        <Modal show={show} onHide={onHide} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              Kërko Produktin
              {meFatureProp != null && (
                <Alert variant="warning" className="d-flex align-items-center mt-3">
                  <FontAwesomeIcon icon={faTriangleExclamation} size="lg" className="me-2" />
                  <span>
                    <strong>Kujdes!</strong> Keni zgjedhur opsionin {meFatureProp ? "me" : "pa"} fature të rregullt. Produktet e
                    shfaqura janë të filtruara!
                  </span>
                </Alert>
              )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex flex-wrap gap-3">
              {["shifra", "emertimi", "pershkrimi"].map((field) => (
                <Form.Group className="mb-3" key={field}>
                  <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Form.Label>
                  <Form.Control
                    type="text"
                    name={field}
                    autoFocus={field === "shifra"}
                    value={searchFields[field]}
                    onChange={handleInputChange}
                    placeholder={`Kërko ${field}...`}
                  />
                </Form.Group>
              ))}
              <Form.Group className="mb-3">
                <Form.Label>Elimino Vlerat Zero</Form.Label>
                <Form.Check
                  type="checkbox"
                  checked={eliminoVleratZero}
                  className="fs-4 " 
                  onChange={(e) => setEliminoVleratZero(e.target.checked)}
                />
              </Form.Group>
            </div>
            {results.length === 0 ? (
              <p>Asnjë produkt nuk u gjet.</p>
            ) : (
              <div className="tableHeight50" style={{ overflowY: "auto" }}>
                <Table striped bordered hover size="sm" >
                <thead>
                  <tr>
                    <th>Shifra</th>
                    <th>Emërtimi</th>
                    <th>Përshkrimi</th>
                    <th>Sasia</th>
                    <th>Me Fature te Rregullt</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((product, index) => (
                    <tr key={index} onClick={() =>  handleProductSelect(product)} className="text-center" style={{ cursor: "pointer" }}>
                      <td >{product.shifra}</td>
                      <td>{product.emertimi}</td>
                      <td>{product.pershkrimi}</td>
                      <td>{product.sasiStatike ? 'Sasi Statike' : product.sasia}</td>
                      <td>{<Badge bg={product.meFatureTeRregullt == 'po' ? 'success' : 'danger'}>{product.meFatureTeRregullt}</Badge>}</td>

                    </tr>
                  ))}
                </tbody>
              </Table>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => setShowShtoProduktinModal(true)}>
              Shto Një Produkt
            </Button>
            <Button variant="secondary" onClick={onHide}>
              Mbyll
            </Button>
          </Modal.Footer>
          <ShtoNjeProdukt
            show={showShtoProduktinModal}
            prejardhja={"paRefresh"}
            handleClose={() => setShowShtoProduktinModal(false)}
          />
        </Modal>
      )}
                <ToastContainer />

    </>
  );
}
