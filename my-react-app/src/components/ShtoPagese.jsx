import { useState, useEffect, useContext } from 'react';
import { Modal, Button, Form, InputGroup, Spinner,Col,Row } from 'react-bootstrap';
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';
import AuthContext, { formatCurrency } from "../components/AuthContext";
import AnimatedSpinner from './AnimatedSpinner';
import MenyratPagesesExport from './MenyratPagesesExport'
import { useTranslation } from 'react-i18next';

const ShtoPagese = ({ show, handleClose,data = {} }) => {

   const {t} = useTranslation('others')
   const [loading,setLoading] = useState()
   const [buttonLoading,setButtonLoading] = useState()
   const [shumaPerPagese,setShumaPerPagese] = useState()
   const [mbetjaPerPagese,setMbetjaPageses] = useState()
   const [menyraPagesesID,setMenyraPagesesID] = useState()
   const {authData} = useContext(AuthContext)
  const showToast = useToast();
  useEffect(() => {
    setMbetjaPageses(data.mbetjaPerPagese)
  },[data])

  useEffect(() => {
      setMbetjaPageses(data.mbetjaPerPagese - shumaPerPagese)
      if(shumaPerPagese > data.mbetjaPerPagese){
        setShumaPerPagese(data.mbetjaPerPagese)
      }
  }, [shumaPerPagese]);

  const updateMenyraPageses = (menyraPageses) => {
    setMenyraPagesesID(menyraPageses.menyraPagesesID);
  };


  async function getDateTime() {
    const apiUrl = 'http://worldtimeapi.org/api/ip'; // World Time API endpoint for datetime
  
    try {
      // Try to fetch the datetime from the World Time API
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return data.datetime; // Returns the datetime in ISO 8601 format
    } catch (error) {
      return new Date().toISOString(); // Return the current local datetime in ISO format
    }
  }

  const handleConfirmClick = async () => {
    setLoading(true)
    setButtonLoading(true)
    let dataDheOra = await getDateTime();
   
    const dataPerDergese = {
      ...data,
      totaliPageses: shumaPerPagese,
      mbetjaPerPagese,
      dataDheOra,
      veprimi:'+',
      menyraPagesesID,
      perdoruesiID:authData.perdoruesiID,
      nderrimiID:authData.nderrimiID
    };

    try{
        const result = await window.api.shtoPagese(dataPerDergese)

        if(result.success){
          setTimeout(() => {
            setLoading(false)
            setButtonLoading(false)
            handleClose()
            showToast(t('Pagesa u regjistrua me sukses!'), 'success');
          }, 2000);
        }
    }catch(e){
      setTimeout(() => {
        setLoading(false)
        setButtonLoading(false)
        handleClose()
        showToast(t('Pagesa nuk regjistrua me sukses!'), 'error');
      }, 2000);
    }finally{
      window.location.reload()

    }
    
  }
    return (
    <Modal show={show} onHide={loading ? null : handleClose} size='md'>
      <Modal.Header closeButton>
        <Modal.Title> {t('Shto nje Pagese te Re')}</Modal.Title>
      </Modal.Header>{loading ? <AnimatedSpinner/>:
      <Modal.Body>
      <Form>
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('Lloji')}</Form.Label>
              <Form.Control 
                type="text" 
                name="lloji" 
                value={data.llojiDokumentit != null ? data.llojiDokumentit.charAt(0).toUpperCase() + data.llojiDokumentit.slice(1).toLowerCase() : null} 
                disabled 
                className="bg-light"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('Shifra')}</Form.Label>
              <Form.Control 
                type="text" 
                name="shifra" 
                value={data.shifra} 
                disabled 
                className="bg-light"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>{t('Subjekti')}</Form.Label>
              <Form.Control 
                type="text" 
                name="subjekti" 
                value={data.subjekti} 
                disabled 
                className="bg-light"
              />
            </Form.Group>
          </Col>
        </Row>
    
        <hr className="my-4" />
    
        <Row>
          <Col md={12} className="mb-3">
            <Form.Label>{t('Totali i Shitjes')}:</Form.Label>
            <InputGroup>
              <Form.Control 
                type="text" 
                name="totaliPerPagese" 
                disabled 
                value={formatCurrency(data.totaliPerPagese,true)}
              />
              <InputGroup.Text>€</InputGroup.Text>
            </InputGroup>
          </Col>
          <Col md={12} className="mb-3">
            <Form.Label>{t('Shuma per Pagese')}:</Form.Label>
            <InputGroup>
              <Form.Control 
                type="number" 
                name="totaliPerPagese"
                value={shumaPerPagese}
                onChange={(e) => setShumaPerPagese(e.target.value)} 
                max={data.mbetjaPerPagese}
                min={0}
              />
              <InputGroup.Text>€</InputGroup.Text>
            </InputGroup>
          </Col>
          <Col md={12}>
            <Form.Label>{t('Mbetja Për Pagesë')}:</Form.Label>
            <InputGroup>
              <Form.Control 
                type="text" 
                name="mbetjaPerPagese" 
                disabled 
                value={formatCurrency(mbetjaPerPagese,true)}
                max={data.mbetjaPerPagese}
              />
              <InputGroup.Text>€</InputGroup.Text>
            </InputGroup>
          </Col>
        </Row>

        <Row >
          <Col className='d-flex justify-content-center align-items-center mt-3'>
            <MenyratPagesesExport updateMenyraPageses={updateMenyraPageses}/>
          </Col>
        </Row>
      </Form>
    </Modal.Body>
    }
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          {t('Anulo')}
        </Button>
        <Button
          variant="primary"
          onClick={() => handleConfirmClick()}
          disabled={loading || menyraPagesesID == null || shumaPerPagese == null || shumaPerPagese == '' || shumaPerPagese < 1}
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
            <>{t('Regjistro Pagesen')}</>
          )}
        </Button>
      </Modal.Footer>
      <ToastContainer />
    </Modal>
  );
};

export default ShtoPagese;
