import { useState,useEffect, useContext } from 'react'
import { Container,Button,Row,Col,Modal,Form, Spinner, InputGroup,Table,Card } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashCan,faCheck } from '@fortawesome/free-solid-svg-icons'; 
import ModalPerPyetje from '../ModalPerPyetje'
import AuthContext,{formatCurrency} from '../AuthContext';
import { useToast } from '../ToastProvider';
import { useNavigate } from 'react-router-dom';
import {ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
export default function Porosite() {
  const {t} = useTranslation('faqjaKryesore')
  const navigate  = useNavigate()
  const [loading,setLoading] = useState(false)
  const [shitjetOnline,setShitjetOnline] = useState([])
  const [dataPerAprovim,setDataPerAprovim] = useState({kostoPostes:3,totaliIPranuar:0})
  const [showModal,setShowModal] = useState(false)
  const [burimiThirrjes,setBurimiThirrjes] = useState('')
  const [llojiPerAnulim,setLlojiPerAnulim] = useState('')
  const [dataPerAnulim,setDataPerAnulim] = useState('')
  const [aprovoShitjenOnlineModal,setAprovoShitjenOnlineModal] = useState(false)
  const [buttonLoading,setButtonLoading] = useState(false)
  const {authData,updateAuthData} = useContext(AuthContext)

  const showToast = useToast();
  
  useEffect(() => {   
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true)
    try{
      const [porosite] = await Promise.all([
        window.api.fetchTableShitjeOnline(),
      ]);

      setShitjetOnline(porosite.filter(item => item.statusi))
    }catch(e){
      console.log(e)
    }finally{
      setLoading(false)
    }
  };

  useEffect(() => {

    setDataPerAprovim({
      ...dataPerAprovim,
      totaliIPranuar:dataPerAprovim.totaliPerPagese - dataPerAprovim.kostoPostes
    })

  },[dataPerAprovim.kostoPostes])

  useEffect(() => {

    setDataPerAprovim({
      ...dataPerAprovim,
      kostoPostes:dataPerAprovim.totaliPerPagese - dataPerAprovim.totaliIPranuar
    })

  },[dataPerAprovim.totaliIPranuar])

  const thirreModal = (item) =>{
    setShowModal(true)
    setDataPerAnulim(item)
  }

  const handleDataPerAprovimChange = (e) => {

    const {name , value} = e.target;

    setDataPerAprovim({
      ...dataPerAprovim,
      [name]:value
    })
  }

  const handleAprovoShitjenOnline = async () => {
    const updatedDataPerAprovim = {
      ...dataPerAprovim,
      perdoruesiID: authData.perdoruesiID,
      nderrimiID: authData.nderrimiID
    };
  
    setButtonLoading(true);
  
    try {
      await window.api.perfundoShitjenOnline(updatedDataPerAprovim);
      showToast(t("Shitja u regjistrua me sukses!"), "success");
    } catch (e) {
      showToast(t("Gabim gjatë aprovimit të shitjes!"), "error");
    } finally {
      setButtonLoading(false);
      setAprovoShitjenOnlineModal(false);
      fetchData();
      updateAuthData({reloadLayout:!authData.reloadLayout})

    }
  };

  const anuloPorosineOnline = async () => {

    try {
      const data = {
        ...dataPerAnulim,
        perdoruesiID: authData.perdoruesiID,
        nderrimiID: authData.nderrimiID,
      }
      const result = await window.api.anuloPorosineOnline(data)

    if (result.success) {
      showToast(t("Shitja u anulua me sukses!"), "success"); 
      fetchData()

    } else {
      showToast(t("Gabim gjatë aprovimit të shitjes!"), "error");
      }
    } catch (error) {
      showToast(t("Gabim gjatë aprovimit të shitjes!") + error, "error");
    }finally{
      fetchData()
      updateAuthData({reloadLayout:!authData.reloadLayout})

    }

  }

    
  
  return (
   <Container fluid >
     <Col>
              <h3 className="section-title">{t('Porosite ne Pritje')}</h3>
              <div className="table-container">
                <Table responsive striped bordered hover size="sm" className="custom-table">
                  <thead className="table-header">
                    <tr>
                      <th>{t('Nr')}</th>
                      <th>{t('Shifra')}</th>
                      <th>{t('NrPorosise')}</th>
                      <th>{t('Data dhe Ora')}</th>
                      <th>{t('Subjekti')}</th>
                      <th>{t('Totali')}</th>
                      <th>{t('Komenti')}</th>
                      <th>{t('Opsionet')}</th>
                    </tr>
                  </thead>
                  <tbody className='text-nowrap'>
                    {shitjetOnline.slice().reverse().map((item, index) => (
                      <tr key={index}>
                    <td>{shitjetOnline.length - index}</td>
                    <td>
                        {item.shifra}
                    </td>
                        <td>{item.nrPorosise}</td>
                        <td>
                          {item.dataShitjes
                            ? <>{new Date(item.dataShitjes).toLocaleDateString()} / {item.dataShitjes.toLocaleTimeString()}</>
                            : ''}
                        </td>
                        <td>{item.subjekti}</td>
                        <td>{item.totaliPerPagese}</td>
                        <td>{item.komenti}</td>
                        <td>
                          
                          <Button
                            variant="outline-danger"
                            className="action-btn mx-1"
                            onClick={() =>
                              thirreModal(item)
                            }
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </Button>
                          <Button
                            variant="outline-success"
                            className="action-btn mx-1"
                            onClick={() => {
                              setDataPerAprovim(item);
                              setAprovoShitjenOnlineModal(true);
                            }}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <Modal show={aprovoShitjenOnlineModal} onHide={() => {buttonLoading ? null : setAprovoShitjenOnlineModal(false)}}>
                <Modal.Header closeButton>
                  <Modal.Title>{t('Aprovo Perfundimin e Shitjes Online')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {dataPerAprovim &&  <Form>
                        <Col className='d-flex flex-row justify-content-around'>
                          <Form.Group>
                            <Form.Label>{t('Shifra e Shitjes')}:</Form.Label>
                            <Form.Control disabled value={dataPerAprovim.shifra} />
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>{t('NrPorosise')}:</Form.Label>
                            <Form.Control disabled value={dataPerAprovim.nrPorosise} />
                          </Form.Group>
                        </Col>
                        <Col className='d-flex flex-row mt-3 justify-content-around'>
                          <Form.Group>
                            <Form.Label>{t('Subjekti')}:</Form.Label>
                            <Form.Control disabled value={dataPerAprovim.subjekti} />
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>{t('Totali i Shitjes')}:</Form.Label>
                            <InputGroup >
                              <Form.Control  disabled value={formatCurrency(dataPerAprovim.totaliPerPagese,true)} />
                              <InputGroup.Text>€</InputGroup.Text>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col className='d-flex flex-row mt-3 justify-content-around'>
                          <Form.Group>
                            <Form.Label>{t('Kosto e Postes')}:</Form.Label>
                            <InputGroup >
                              <Form.Control min={0} type='number' name='kostoPostes' value={dataPerAprovim.kostoPostes} onChange={handleDataPerAprovimChange}/>
                              <InputGroup.Text>€</InputGroup.Text>
                            </InputGroup>
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>{t('Totali i Pranuar nga Posta')}:</Form.Label>
                            <InputGroup >
                              <Form.Control min={0} type='number' name='totaliIPranuar' value={dataPerAprovim.totaliIPranuar} onChange={handleDataPerAprovimChange}/>
                              <InputGroup.Text>€</InputGroup.Text>
                            </InputGroup>
                          </Form.Group>
                        </Col>
                </Form>}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={() => {buttonLoading ? null : setAprovoShitjenOnlineModal(false)}} disabled={buttonLoading}>
                    {t('Mbyll')}
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleAprovoShitjenOnline()}
                    disabled={buttonLoading}
                  >
                    {buttonLoading ? (
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
                        t('Aprovo')
                    )}
                  </Button>
                </Modal.Footer>
                
              </Modal>

              <ModalPerPyetje show={showModal} handleClose={() => setShowModal(false)} handleConfirm={() => anuloPorosineOnline()}/>
    </Col>
    <ToastContainer />
   </Container>
  )
}
