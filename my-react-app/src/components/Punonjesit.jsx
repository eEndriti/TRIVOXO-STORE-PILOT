import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Table, Modal, Form, InputGroup, Spinner,OverlayTrigger,Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashCan, faGift, faCoins, faCheckCircle, faTimesCircle,faPencil } from '@fortawesome/free-solid-svg-icons';
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';
import AnimatedSpinner from './AnimatedSpinner';
import ModalPerPyetje from './ModalPerPyetje'
import DetajePunonjes from './DetajePunonjes';
import StatusToggle from "./StatusToggle";
import  AuthProvider  from './AuthContext';

export default function Punonjesit() {
    const [loading, setLoading] = useState(true);
    const [punonjesit, setPunonjesit] = useState([]);
    const [filteredPunonjesit, setFilteredPunonjesit] = useState([]);
    const [shtoPunonjesModal, setShtoPunonjesModal] = useState(false);
    const [buttonLoading, setButtonLoading] = useState(false);
    const [dataPerPunonjes, setDataPerPunonjes] = useState({ emri: '', mbiemri: '', pagaBaze: '', nrTelefonit: '',aktiv:1 ,punonjesID:'' });
    const [showModalPerPyetje,setShowModalPerPyetje] = useState(false)
    const [dataPerFshirje,setDataPerFshirje] = useState()
    const [perNdryshim,setPerNdryshim] = useState()
    const [showDetaje,setShowDetaje] = useState(false)
    const [reload,setReload] = useState(false)
    const [searchTerms , setSearchTerms] = useState({emri:'', nrTelefonit:'', statusi:true})
    const showToast = useToast()
    const {authData} = useContext(AuthProvider)
    useEffect(() => {
        fetchData();
    }, [reload]);

    const fetchData = async () => {
        try {
            await window.api.fetchTablePunonjesit().then((receivedData) => {
                setPunonjesit(receivedData);
                setFilteredPunonjesit(receivedData)
            });
        } catch (error) {
            showToast('Gabim gjate marrjes se te dhenave' +error,'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true)
        const filtered = punonjesit.filter(punonjesi => {
            return punonjesi.emri.toLowerCase().includes(searchTerms.emri.toLowerCase())&&
                   punonjesi.nrTelefonit.includes(searchTerms.nrTelefonit) &&
                   punonjesi.aktiv == searchTerms.statusi
        })

        setFilteredPunonjesit(filtered)
        setLoading(false)
    },[searchTerms,punonjesit])

    const handleChangeShtoPunonjes = (event) => {
        const { name, value } = event.target;
        setDataPerPunonjes({
            ...dataPerPunonjes,
            [name]: value
        });
    };
    
    const emptyDataPerPunonjes = () => {
      setDataPerPunonjes({
        emri:'',
        mbiemri:'',
        pagaBaze:'',
        nrTelefonit:'',
        aktiv:1,
        punonjesID:''
      })
      setPerNdryshim(null)
    }

    const shtoPunonjes = async () => {
        setButtonLoading(true);
        setShtoPunonjesModal(false);
        const data = {
            ...dataPerPunonjes,
            perdoruesiID:authData.perdoruesiID,
            nderrimiID:authData.nderrimiID
        }
        try {
            await window.api.shtoPunonjes(data);
            showToast('Punonjesi u shtua me sukses','success');
        } catch (error) {
            showToast('Punonjesi nuk mund te Shtohet!' +error,'error');
        } finally {
            setButtonLoading(false);
            setReload(prev => !prev)
        }
    };

    const modalPerPyetje = (item) => {
      setDataPerFshirje(item)
      setShowModalPerPyetje(true)
    }

    const handleConfirmModal = async() => {
      if(dataPerFshirje){
        const data = {
            ...dataPerFshirje,
            idPerAnulim:dataPerFshirje.punonjesID,
            perdoruesiID:authData.perdoruesiID,
            nderrimiID:authData.nderrimiID
        }
        console.log(data)
        try{
          await window.api.fshijePunonjesin(data)
            showToast('Punonjesi u Anulua me sukses','success')
      } catch (error) {
            showToast('Punonjesi nuk mund te Anulohet!' +error,'error');
      } finally {
          setButtonLoading(false);
        setShowModalPerPyetje(false)
        setReload(prev => !prev)
      }
      }
    }

    const ndryshoPunonjes = async () => {
      setButtonLoading(true);
      setShtoPunonjesModal(false)
      const data = {
        ...dataPerPunonjes,
        perdoruesiID:authData.perdoruesiID,
        nderrimiID:authData.nderrimiID
    }
      try {
          await window.api.ndryshoPunonjes(data);
            showToast('Punonjesi u ndryshua me sukses','success');
      } catch (error) {
            showToast('Punonjesi nuk mund te Ndryshohet!' +error,'error');
      } finally {
          setButtonLoading(false);
          setReload(prev => !prev)
        }
  };


    return (
        <>
            <ToastContainer position="top-center" autoClose={3000} />
            {loading ? (
                <AnimatedSpinner />
            ) : (
                <Container>
                    <hr/>

                    <Row className='d-flex flex-row justify-content-start align-items-end'>
                        <Col lg = {3}>
                            <Form.Control placeholder='Kerko me Emer...' value={searchTerms.emri} onChange={(e) => setSearchTerms({...searchTerms,emri:e.target.value})} />
                        </Col>
                        <Col lg = {3}>
                            <Form.Control placeholder='Kerko me Nr.Telefonit...'  value={searchTerms.nrTelefonit} onChange={(e) => setSearchTerms({...searchTerms,nrTelefonit:e.target.value})}/>
                        </Col>
                        <Col lg = {3}>
                            <StatusToggle
                                label="Statusi i Punonjësit"
                                status={searchTerms.statusi}
                                onToggle={() =>
                                    setSearchTerms(prevData => ({ ...prevData, statusi: !prevData.statusi }))
                                }
                            />                        
                        </Col>
                    </Row>
                    <Row className='tabeleMeMaxHeight '>
                        <Table striped bordered hover className="mt-3" >
                            <thead >
                                <tr>
                                    <th>Nr.</th>
                                    <th>Emri</th>
                                    <th>Mbiemri</th>
                                    <th>Data e Punesimit</th>
                                    <th>Paga Baze</th>
                                    <th>Statusi</th>
                                    <th>Nr.Telefonit</th>
                                    <th>Veprime</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPunonjesit.slice().reverse().map((item, index) => (
                                    <tr key={index}>
                                        {item.punonjesit != 0 ? (
                                            <>
                                                <th scope="row">{punonjesit.length - index}</th>
                                                <td>{item.emri}</td>
                                                <td>{item.mbiemri}</td>
                                                <td>{new Date(item.dataPunësimit).toLocaleDateString('al-AL')}</td>
                                                <td>{item.pagaBaze.toFixed(2)} €</td>
                                                <td>
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={
                                                            <Tooltip>
                                                                {item.aktiv ? 'Aktiv' : 'Jo Aktiv'}
                                                            </Tooltip>
                                                        }
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={item.aktiv ? faCheckCircle : faTimesCircle}
                                                            className={item.aktiv ? 'text-success' : 'text-danger'}
                                                            size="lg"
                                                        />
                                                    </OverlayTrigger>
                                                </td>
                                                <td>{item.nrTelefonit}</td>
                                                <td>
                                                    <Button variant="outline-primary" className="me-2" onClick={() => {emptyDataPerPunonjes();setPerNdryshim(item); setShtoPunonjesModal(true);setDataPerPunonjes(item)}}>
                                                        <FontAwesomeIcon icon={faEdit} /> Ndrysho
                                                    </Button>
                                                    <Button variant="outline-danger" className="me-2" onClick={() => {emptyDataPerPunonjes();modalPerPyetje(item)}}>
                                                        <FontAwesomeIcon icon={faTrashCan} /> Fshij
                                                    </Button>

                                                    <Button variant="outline-secondary"  onClick={() => {setShowDetaje(true);setDataPerPunonjes(item)}}>
                                                        Detaje...
                                                    </Button>                                          
                                                </td>
                                            </>
                                        ) : (
                                            'Nuk ka te dhena!'
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                            <Row className='justify-content-end'>
                                <Button variant="success" className="w-25" onClick={() => {emptyDataPerPunonjes(); setShtoPunonjesModal(true)}}>
                                    Shto Punonjës të Ri
                                </Button>
                            </Row>
                    </Row>
                    <hr/>
                    {showDetaje && 
                        <Row>
                            <DetajePunonjes punonjesID = {dataPerPunonjes.punonjesID} emri = {dataPerPunonjes.emri} mbiemri = {dataPerPunonjes.mbiemri} defaultPaga={dataPerPunonjes.pagaBaze.toFixed(2)}/>
                        </Row>
                    }
                    <Modal
                        show={shtoPunonjesModal}
                        onHide={() => {
                            buttonLoading ? null : setShtoPunonjesModal(false);
                        }}
                        centered
                    >
                        <Modal.Header closeButton>
                            <Modal.Title className="text-dark">{!perNdryshim ? <>Forma për Regjistrim të Punonjësit</> : <>Forma për Ndryshim të Punonjësit</>}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group controlId="formFirstName">
                                            <Form.Label>Emri</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="emri"
                                                value={dataPerPunonjes.emri}
                                                onChange={handleChangeShtoPunonjes}
                                                placeholder="Shkruaj Emrin..."
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="formLastName">
                                            <Form.Label>Mbiemri</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="mbiemri"
                                                value={dataPerPunonjes.mbiemri}
                                                onChange={handleChangeShtoPunonjes}
                                                placeholder="Shkruaj Mbiemrin..."
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className="mb-3 align-items-center">
                                    <Col >
                                        <Form.Group controlId="formBaseSalary">
                                            <Form.Label>Paga Bazë</Form.Label>
                                            <InputGroup>
                                                <Form.Control
                                                    type="number"
                                                    name="pagaBaze"
                                                    value={dataPerPunonjes.pagaBaze}
                                                    onChange={handleChangeShtoPunonjes}
                                                    placeholder="Shkruaj Pagen Bazë..."
                                                />
                                                <InputGroup.Text>€</InputGroup.Text>
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group controlId="formBaseSalary">
                                            <Form.Label>Nr Telefonit</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="nrTelefonit"
                                                    value={dataPerPunonjes.nrTelefonit}
                                                    onChange={handleChangeShtoPunonjes}
                                                    placeholder="Shkruaj Nr. Telefonit..."
                                                />                                 
                                        </Form.Group>
                                    </Col>
                                    {perNdryshim ? <Col>
                                        <StatusToggle
                                        label="Statusi i Punonjësit"
                                        status={dataPerPunonjes.aktiv}
                                        onToggle={() =>
                                            setDataPerPunonjes(prevData => ({ ...prevData, aktiv: !prevData.aktiv }))
                                        }
                                    />
                                    </Col>:null}
                                </Row>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" disabled={buttonLoading} onClick={() => setShtoPunonjesModal(false)}>
                                Mbyll
                            </Button>
                            <Button variant="primary" disabled={buttonLoading || dataPerPunonjes.emri.trim() == '' || dataPerPunonjes.mbiemri.trim() == '' || dataPerPunonjes.pagaBaze < 1 || !dataPerPunonjes.pagaBaze || dataPerPunonjes.nrTelefonit < 1 || !dataPerPunonjes.nrTelefonit} onClick={() => {perNdryshim ? ndryshoPunonjes() :shtoPunonjes()}}>
                                {buttonLoading ? (
                                    <>
                                        <Spinner size="sm" /> {'Duke ruajtur'}
                                    </>
                                ) : (
                                    <>{perNdryshim ? 'Ruaj Ndryshimet' : 'Regjistro'}</>
                                )}
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <ModalPerPyetje show={showModalPerPyetje} handleClose={() => {setShowModalPerPyetje(false)}} handleConfirm={handleConfirmModal} />
                </Container>
            )}
        </>
    );
}
