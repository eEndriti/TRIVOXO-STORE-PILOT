import { useState, useEffect, useContext, useCallback } from 'react';
import { Modal, Button, Form, InputGroup, Spinner, Col } from 'react-bootstrap';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import AuthContext from "../AuthContext";
import AnimatedSpinner from '../AnimatedSpinner';
import { useTranslation } from 'react-i18next';

const ShtoNjeProdukt = ({ show, handleClose, prejardhja, produkti = {} , handleConfirm }) => {

  const {t} = useTranslation('stoku')
  const [kategorite, setKategorite] = useState([]);
  const [selectedKategoria, setSelectedKategoria] = useState(null);
  const [aKa, setAka] = useState(true);
  const [loading, setLoading] = useState(false);
  const [meFature, setMeFature] = useState(false);
  const [sasiStatike, setSasiStatike] = useState(false);
  const [productDetails, setProductDetails] = useState({
    emertimi: '',
    cpu: '',
    ram: '',
    disku: '',
    gpu: '',
    cmimiBlerjes: '',
    cmimiShitjes: '',
    komenti: ''
  });
  const showToast = useToast();
  const { authData } = useContext(AuthContext);

  // Fetch kategorite when the modal is shown
  useEffect(() => {
    if (!show) return; // Only run when the modal is open

    const fetchData = async () => {
      const data = await window.api.fetchTableKategoria();
      setKategorite(data);
    };

    fetchData();
  }, [show]);

  // Initialize product details when produkti or aKa changes
  useEffect(() => {
    if (produkti && aKa) {
      setMeFature(produkti.meFatureTeRregullt === "po");
      setSasiStatike(produkti.sasiStatike);
      setProductDetails(produkti);

      if (produkti.kategoriaID) {
        handleCategoryChange(produkti.kategoriaID);
      }
    }else{
      setProductDetails(null)
      setSelectedKategoria(null)
      setMeFature(false)
      setSasiStatike(false)
    }
  }, [produkti, aKa]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setProductDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  }, []);

  const handleCategoryChange = useCallback((eOrId) => {
    let selectedCategoryId;

    if (typeof eOrId === "number") {
      selectedCategoryId = eOrId;
    } else {
      selectedCategoryId = parseInt(eOrId.target.value, 10);
    }

    const selectedCategory = kategorite.find(
      (kategoria) => kategoria.kategoriaID === selectedCategoryId
    );

    setSelectedKategoria(selectedCategory || null);
  }, [kategorite]);

  const handleShtoProduktin = useCallback(async () => {
    if (parseFloat(productDetails.cmimiShitjes) <= parseFloat(productDetails.cmimiBlerjes)) {
      showToast(t("Cmimi Shitjes duhet të jetë më i madh se Cmimi Blerjes!"), 'warning');
      return;
    }

    setLoading(true);

    let pershkrimi = productDetails.pershkrimi || null;
    const cpu = productDetails.cpu + '/' || '';
    const ram = productDetails.ram + '/' || '';
    const disku = productDetails.disku + '/' || '';
    const gpu = productDetails.gpu + '/' || '';

    if (selectedKategoria.komponenta === 'true') {
      pershkrimi = cpu + ram + disku + gpu;
    }

    if (selectedKategoria && productDetails.emertimi && authData.perdoruesiID) {
      const data = {
        emertimi: productDetails.emertimi,
        pershkrimi: pershkrimi,
        sasia: 0,
        cmimiBlerjes: productDetails.cmimiBlerjes,
        cmimiShitjes: productDetails.cmimiShitjes,
        kategoriaID: selectedKategoria.kategoriaID,
        komenti: productDetails.komenti || '',
        cpu: cpu,
        ram: ram,
        disku: disku,
        gpu: gpu,
        meFature,
        sasiStatike,
        perdoruesiID:authData.perdoruesiID,
        nderrimiID:authData.nderrimiID
      };

      try {
        const result = await window.api.insertProduktin(data);

        if (result.success) {
          showToast(t("Produkti u shtua me sukses!"), 'success');
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          showToast(t("Gabim gjatë regjistrimit:") + result.error , 'error');
        }
      } catch (error) {
        showToast(t("Gabim gjatë komunikimit me serverin!") + error , 'error');
      } finally {
        setLoading(false);
        setProductDetails(null)
        setMeFature(false)
        setSasiStatike(false)
        setSelectedKategoria(null)
        if (prejardhja === 'meRefresh') {
          handleConfirm()
        }
      }
    } else {
      showToast(t("Ju Lutem Plotesoni te Gjitha Fushat!"), 'warning');
      setLoading(false);
    }
  }, [productDetails, selectedKategoria, meFature, sasiStatike, authData.perdoruesiID, handleClose, prejardhja]);

  const ndryshoProduktin = useCallback(async () => {
    if (parseFloat(productDetails.cmimiShitjes) <= parseFloat(productDetails.cmimiBlerjes)) {
      showToast(t("Cmimi Shitjes duhet të jetë më i madh se Cmimi Blerjes!"), 'warning');
      return;
    }

    setLoading(true);

    let pershkrimi = productDetails.pershkrimi || null;

    if (selectedKategoria.komponenta === 'true') {
      const komponentet = [
        productDetails.cpu?.trim(),
        productDetails.ram?.trim(),
        productDetails.disku?.trim(),
        productDetails.gpu?.trim()
      ].filter(Boolean);

      pershkrimi = komponentet.join(' / ');
    } else {
      productDetails.cpu = '';
      productDetails.ram = '';
      productDetails.disku = '';
      productDetails.gpu = '';
    }

    if (selectedKategoria && productDetails.emertimi && authData.perdoruesiID) {
      const data = {
        emertimi: productDetails.emertimi,
        pershkrimi: pershkrimi,
        sasia: 0,
        cmimiBlerjes: productDetails.cmimiBlerjes,
        cmimiShitjes: productDetails.cmimiShitjes,
        kategoriaID: selectedKategoria.kategoriaID,
        komenti: productDetails.komenti || '',
        cpu: productDetails.cpu || '',
        ram: productDetails.ram || '',
        disku: productDetails.disku || '',
        gpu: productDetails.gpu || '',
        meFature,
        produktiID: produkti.produktiID,
        sasiStatike,
        perdoruesiID: authData.perdoruesiID,
        nderrimiID: authData.nderrimiID
      };

      try {
        const result = await window.api.ndryshoProduktin(data);

        if (result.success) {
          showToast(t("Produkti u Ndryshua me Sukses!"), 'success');
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          showToast(t("Gabim gjatë regjistrimit:") + result.error , 'error');
        }
      } catch (error) {
        showToast(t("Gabim gjatë komunikimit me serverin") + error , 'error');
      } finally {
        setLoading(false);
        setProductDetails(null)
        setMeFature(false)
        setSasiStatike(false)
        setSelectedKategoria(null)
        if (prejardhja === 'meRefresh') {
          handleConfirm()
        }
      }
    } else {
      showToast(t("Ju Lutem Plotesoni te Gjitha Fushat!"), 'warning');
      setLoading(false);
    }
  }, [productDetails, selectedKategoria, meFature, sasiStatike, authData.perdoruesiID, handleClose, prejardhja, produkti.produktiID]);

  const kontrolloValidetin = useCallback(() => {
    return (
      loading ||
      productDetails?.emertimi === '' ||
      !productDetails?.cmimiBlerjes ||
      !productDetails?.cmimiShitjes ||
      selectedKategoria == null ||
      (selectedKategoria?.komponenta === 'true' &&
        (productDetails?.cpu === '' ||
          productDetails?.ram === '' ||
          productDetails?.disku === '' ||
          productDetails?.gpu === ''))
    );
  }, [loading, productDetails, selectedKategoria]);

  return (
    <>
      {loading && <AnimatedSpinner />}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{produkti ? t("Ndrysho nje Produkt") : t("Shto nje Produkt")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>{t("Emertimi")}</Form.Label>
              <Form.Control
                type="text"
                name="emertimi"
                required={true}
                value={productDetails?.emertimi || ''}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>{t('Kategoria')}</Form.Label>
              <Form.Control
                as="select"
                name="kategoria"
                required={true}
                value={selectedKategoria?.kategoriaID || ''}
                onChange={handleCategoryChange}
              >
                <option value="">{t('Zgjidh Kategorinë')}</option>
                {kategorite.map((kategoria) => (
                  <option key={kategoria.kategoriaID} value={kategoria.kategoriaID}>
                    {kategoria.emertimi}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            {selectedKategoria && selectedKategoria.komponenta === 'true' ? (
              <>
                <hr />
                <div className='d-flex flex-row justify-content-around'>
                  <Form.Group>
                    <Form.Label>{t('Procesori:')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="cpu"
                      required={true}
                      placeholder={t('Modeli i Procesorit...')}
                      value={productDetails.cpu}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>{t('RAM')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="ram"
                      required={true}
                      placeholder={t('Kapaciteti i RAM...')}
                      value={productDetails.ram}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </div>
                <div className='d-flex flex-row justify-content-around'>
                  <Form.Group>
                    <Form.Label>{t('Disku')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="disku"
                      required={true}
                      placeholder={t('Kapaciteti i Disqeve...')}
                      value={productDetails.disku}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>{t('GPU')}</Form.Label>
                    <Form.Control
                      type="text"
                      name="gpu"
                      required={true}
                      placeholder={t('Kapaciteti i Grafikes...')}
                      value={productDetails.gpu}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </div>
                <hr />
              </>
            ) : (
              <>
                <Form.Group>
                  <Form.Label>{t('Pershkrimi')}</Form.Label>
                  <Form.Control
                    type="text"
                    name="pershkrimi"
                    required={true}
                    placeholder={t('Pershkrimi i Produktit...')}
                    value={productDetails?.pershkrimi || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </>
            )}

            <Form.Group>
              <Form.Label>{t('Cmimi Blerjes')}</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  name="cmimiBlerjes"
                  required={true}
                  value={productDetails?.cmimiBlerjes || ''}
                  onChange={handleInputChange}
                  step="0.01"
                />
                <InputGroup.Text>€</InputGroup.Text>
              </InputGroup>
            </Form.Group>

            <Form.Group>
              <Form.Label>{t('Cmimi Shitjes')}</Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  min={productDetails?.cmimiBlerjes + 1 || ''}
                  name="cmimiShitjes"
                  required={true}
                  value={productDetails?.cmimiShitjes || ''}
                  onChange={handleInputChange}
                  step="0.01"
                />
                <InputGroup.Text>€</InputGroup.Text>
              </InputGroup>
            </Form.Group>

            <Form.Group>
              <Form.Label>{t('Komenti')}</Form.Label>
              <Form.Control
                as="textarea"
                name="komenti"
                required={true}
                value={productDetails?.komenti || ''}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Col className="d-flex flex-row justify-content-between align-items-center mt-4">
              <Form.Group controlId="employeeStatus" className="d-flex flex-column align-items-center">
                <Button
                  onClick={() => setMeFature((prev) => !prev)}
                  variant={meFature ? 'info' : 'secondary'}
                  style={{
                    padding: '12px 25px',
                    fontSize: '1.2rem',
                    borderRadius: '30px',
                    transition: 'all 0.3s ease',
                    boxShadow: meFature
                      ? '0px 4px 15px rgba(30, 126, 204, 0.5)'
                      : '0px 4px 15px rgba(108, 117, 125, 0.5)'
                  }}
                >
                  {meFature ? t('Me Fature te Rregullt') : t('Pa Fature te Rregullt')}
                </Button>
              </Form.Group>

              <Form.Group controlId="employeeStatus" className="d-flex flex-column align-items-center">
                <Button
                  onClick={() => setSasiStatike((prev) => !prev)}
                  variant={sasiStatike ? 'info' : 'secondary'}
                  style={{
                    padding: '12px 25px',
                    fontSize: '1.2rem',
                    borderRadius: '30px',
                    transition: 'all 0.3s ease',
                    boxShadow: sasiStatike
                      ? '0px 4px 15px rgba(40, 167, 69, 0.5)'
                      : '0px 4px 15px rgba(108, 117, 125, 0.5)'
                  }}
                >
                  {sasiStatike ? 'Sasi Statike' : 'Sasi Jo Statike'}
                </Button>
              </Form.Group>
            </Col>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            {t('Mbyll')}
          </Button>
          <Button
            variant="primary"
            onClick={() => { produkti ? ndryshoProduktin() : handleShtoProduktin() }}
            disabled={kontrolloValidetin()}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />{' '}
                {t('Duke ruajtur...')}
              </>
            ) : (
              <>{produkti ? t('Ruaj Ndryshimet') : t("Shto Produktin")}</>
            )}
          </Button>
        </Modal.Footer>
        <ToastContainer />
      </Modal>
    </>
  );
};

export default ShtoNjeProdukt;