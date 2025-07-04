import {useState,useEffect, useContext} from 'react'
import { Container,Row,Col, Card,Form,Button,InputGroup, Spinner } from 'react-bootstrap'
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import AnimatedSpinner from '../AnimatedSpinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faFileInvoice, faFolder, faMapMarkerAlt, faPhone, faSave, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import  AuthProvider  from '../AuthContext';
function Parametrat() {
  const [triggerReload,setTriggerReload] = useState(false)
  const [parametratGarancionit,setParametratGarancionit] = useState({})
  const showToast = useToast()
  const [loading,setLoading] = useState(true)
  const [kushtet,setKushtet] = useState()
  const [buttonLoading,setButtonLoading] = useState(false)
  const {authData} = useContext(AuthProvider)
   useEffect(() => {
      fetchData()
    }, [triggerReload]);
  
    const fetchData = async () => {
      try {
        
         await window.api.fetchTableParametrat().then(receivedData => {
          setParametratGarancionit(receivedData[0]);
          setKushtet(JSON.parse(receivedData[0].kushtet))
        })
      } catch (error) {
        showToast('Gabim gjat komunikimit me databaze' + error,'error')
      }finally{
        setLoading(false);
  
      }
    }

    const handleDeleteRow = (index) => {
      const updatedKushtet = kushtet.filter((_, i) => i !== index);
      setKushtet(updatedKushtet);
  };

    const ruajNdryshimet = async () => {
      setButtonLoading(true)
      try {
          const data = {
            parametratGarancionit,
            kushtet,
            perdoruesiID:authData.perdoruesiID,
            nderrimiID:authData.nderrimiID,
          }

          const result = await window.api.ndryshoParametrat(data)
          if(result.success){
            showToast('Ndryshimet u Ruajten me Sukses!','success')
          }
      } catch (error) {
        showToast('Gabim gjate Procesit '+error, 'error')
      }finally{
        setTriggerReload(!triggerReload)
        setButtonLoading(false)
      }
    }

    const handleChange = (field, value) => {
      setParametratGarancionit(prev => ({ ...prev, [field]: value }));
  };
  const handleChangeKushtet = (index, value) => {
    const updatedKushtet = [...kushtet];
    updatedKushtet[index] = value;
    setKushtet(updatedKushtet);
};
  return (
    <>
      {loading && parametratGarancionit ? <AnimatedSpinner/> :<Container className='mt-5'>
        <Row className="justify-content-center">
            <Col md={12} lg={12}>
                <Card className="shadow-sm border-0">
                    <Card.Header className=" text-white text-center fw-bold" style={{backgroundColor:'#2A3D4E'}}>
                        <FontAwesomeIcon className="me-2" icon={faBuilding} /> Të Dhënat e Biznesit
                    </Card.Header>
                    <Card.Body >
                        <Form className='d-flex flex-row justify-content-between'>
                            <Form.Group className="mb-3">
                                <Form.Label>Emri i Biznesit</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>
                                    <FontAwesomeIcon icon={faBuilding} />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Shkruani emrin e biznesit..."
                                        value={parametratGarancionit.emriBiznesit}
                                        onChange={(e) => handleChange("emriBiznesit", e.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Adresa e Biznesit</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>
                                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Shkruani adresën..."
                                        value={parametratGarancionit.adresa}
                                        onChange={(e) => handleChange("adresa", e.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Nr. Telefonit të Biznesit</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text>
                                      <FontAwesomeIcon icon={faPhone} />
                                    </InputGroup.Text>
                                    <Form.Control
                                        type="text"
                                        placeholder="Shkruani numrin e telefonit..."
                                        value={parametratGarancionit.telefoni}
                                        onChange={(e) => handleChange("telefoni", e.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>                         
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
        
        <br/>
        
        <Row>
          <Col md={12}>
            <Card>
            <Card.Header className=" text-white text-center fw-bold" style={{backgroundColor:'#2A3D4E'}}>
            <FontAwesomeIcon className="me-2" icon={faFileInvoice} />Folderi per Garancione:</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Folder Path per Garancione</Form.Label>
                    <InputGroup>
                        <InputGroup.Text>
                          <FontAwesomeIcon icon={faFolder} />
                        </InputGroup.Text>
                        <Form.Control
                            type="text"
                            value={parametratGarancionit.filePath}
                            onChange={(e) => handleChange("filePath", e.target.value)}
                        />
                    </InputGroup>
                </Form.Group>        
              </Card.Body>
            </Card>
          </Col>           
        </Row>

        <br/>
        <Row>
            <Col md={12}>
                <Card>
                    <Card.Header className=" text-white text-center fw-bold" style={{backgroundColor:'#2A3D4E'}}>
                    <FontAwesomeIcon className="me-2" icon={faFileInvoice} />Kushtet e Garancionit:</Card.Header>
                    <Card.Body>
                        {kushtet.length > 0 ? (
                            <>
                                {kushtet.map((kusht, index) => (
                                    <Row key={index} className="mb-2">
                                        <Col className='border'>
                                          <Col className='d-flex flex-row'>
                                              <Form.Control
                                                  className='border-0'
                                                  type="text"
                                                  value={kusht}
                                                  onChange={(e) => handleChangeKushtet(index, e.target.value)}
                                              />
                                              <Button variant='btn btn-outline-danger m-2' onClick={() => handleDeleteRow(index)}><FontAwesomeIcon icon={faTrashCan}/></Button>
                                          </Col>
                                        </Col>
                                    </Row>
                                ))}
                            </>
                        ) : (
                            "Nuk ka kushte!"
                        )}
                    </Card.Body>
                    <Card.Footer className="d-flex justify-content-between">
                        <Button variant="primary" onClick={() => setKushtet([...kushtet,''])}>
                            Shto Kushte
                        </Button>
                        <div className="text-end">
                                <Button variant="success" disabled = {buttonLoading} onClick={() => ruajNdryshimet()}>
                                <FontAwesomeIcon icon={faSave} className="me-2" />
                                  {buttonLoading ? <><Spinner size='sm' /> Duke Ruajtur...</> : 'Ruaj Ndryshimet'}
                                </Button>
                            </div>
                    </Card.Footer>
                </Card>
            </Col>
        </Row>

       
    </Container>}
    </>
  )
}

export default Parametrat
