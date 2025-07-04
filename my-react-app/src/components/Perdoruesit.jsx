import {useState,useEffect, useContext} from 'react'
import { Container, Row, Col, Button, Table, Modal, Form, InputGroup, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashCan,faCheck } from '@fortawesome/free-solid-svg-icons'; 
import AnimatedSpinner from './AnimatedSpinner';
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';
import AuthContext from "../components/AuthContext";
import ModalPerPyetje from './ModalPerPyetje'
import FilterPerdorues from './FilterPerdorues';

export default function Perdoruesit() {
    
    const [loading,setLoading] = useState(true)
    const [perdoruesit,setPerdoruesit] = useState([])
    const [filteredPerdoruesit,setFilteredPerdoruesit] = useState([])
    const [buttonLoading,setButtonLoading] = useState(false)
    const [dataPerPerdorues,setDataPerPerdorues] = useState({emri:'',fjalekalimi:'',roli:''})
    const [shtoPerdoruesModal,setShtoPerdoruesModal] = useState(false)
    const [perNdryshim,setPerNdryshim] = useState()
    const { authData } = useContext(AuthContext)
    const [dataPerDelete,setDataPerDelete] = useState()
    const [modalPerPyetje,setModalPerPyetje] = useState(false)
    const [searchTerms,setSearchTerms] = useState({emertimi:'',roli:'all'})
    const showToast = useToast()
    const [triggerReload,setTriggerReload] = useState(false)

    useEffect(() =>{
       
        fetchData()
        
    },[triggerReload])

    const fetchData = async () => {
        try {
            const receivedData = await window.api.fetchTableQuery(
                `SELECT  *,
                        CASE 
                            WHEN EXISTS (SELECT 1 FROM blerje WHERE perdoruesiID = perdoruesi.perdoruesiID)
                                OR EXISTS (SELECT 1 FROM shitje WHERE perdoruesiID = perdoruesi.perdoruesiID)
                                OR EXISTS (SELECT 1 FROM transaksioni WHERE perdoruesiID = perdoruesi.perdoruesiID)
                                OR EXISTS (SELECT 1 FROM servisimi WHERE perdoruesiID = perdoruesi.perdoruesiID)
                                OR EXISTS (SELECT 1 FROM shpenzimi WHERE perdoruesiID = perdoruesi.perdoruesiID)
                                OR EXISTS (SELECT 1 FROM logs WHERE perdoruesiID = perdoruesi.perdoruesiID)
                            THEN CAST(1 AS BIT)  -- Returns TRUE if related data exists
                            ELSE CAST(0 AS BIT)   -- Returns FALSE if no related data exists
                        END AS DataExists
                    FROM 
                        perdoruesi;
`
            )
            setFilteredPerdoruesit(receivedData)
            setPerdoruesit(receivedData)

        }catch(error){
            console.log(error)
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => { // perFiltrim
       if(perdoruesit){
         const filterResult = perdoruesit.filter(perdoruesi => {

            if(searchTerms.roli != 'all'){
                return perdoruesi.roli == searchTerms.roli && perdoruesi.emri.toLowerCase().includes(searchTerms.emertimi.toLowerCase())
            }

            return perdoruesi.emri.toLowerCase().includes(searchTerms.emertimi.toLowerCase())
        })

        setFilteredPerdoruesit(filterResult)
       }
    },[perdoruesit,searchTerms])

    const handleChangeShtoPerdorues = (event) => {
        const { name, value } = event.target;
        setDataPerPerdorues({
            ...dataPerPerdorues,
            [name]: value
        });

    };

    const emptyDataPerPerdorues = () => {
      setDataPerPerdorues({
        emri:'',
        mbiemri:'',
        pagaBaze:'',
        nrTelefonit:'',
        aktiv:1,
        punonjesID:''
      })
      setPerNdryshim(null)
    }


    const shtoPerdorues = async () => {
        
        setButtonLoading(true);
        const data = {
            ...dataPerPerdorues,
            perdoruesiAktualID:authData.perdoruesiID,
            nderrimiID:authData.nderrimiID
        }
        try {
            
            await window.api.shtoPerdoruesin(data);
           showToast('Perdoruesi u shtua me sukses', 'success')
        } catch (e) {
            showToast('Perdoruesi nuk mund te shtohet', 'error')    
        } finally {
            setButtonLoading(false);
            fetchData()
            setShtoPerdoruesModal(false)

        } 
    };

    const ndryshoPerdorues = async () => {
        setButtonLoading(true);
        setShtoPerdoruesModal(false)
        try {
            const data = {
                ...dataPerPerdorues,
                perdoruesiAktualID:authData.perdoruesiID,
                nderrimiID:authData.nderrimiID,
            }
            console.log('dataPerNdryshim',data)
            await window.api.ndryshoPerdorues(data);
            showToast('Perdoruesi u ndryshua me sukses', 'success')
        } catch (error) {
            showToast('Perdoruesi nuk mund te ndryshohet', 'error')
        } finally {
            setButtonLoading(false);
            fetchData()
        } 
    };
    const thirreModalPerPyetje = (item) => {
        setDataPerDelete(item)
        setModalPerPyetje(true)
    }
    const handleConfirm = async () => {
        setButtonLoading(true)
        try {
            const data = {
                ...dataPerDelete,
                perdoruesiAktualID:authData.perdoruesiID,
                nderrimiID:authData.nderrimiID
            }
            await window.api.deletePerdoruesi(data);
            showToast('Perdoruesi u Anulua me sukses', 'success')
        } catch (error) {
            showToast('Perdoruesi nuk mund te anulohet', 'error')
        } finally {
            setButtonLoading(false);
            fetchData()
            setModalPerPyetje(false)
        } 
    }

    const handleFilterSelect = (e) =>{
        setSearchTerms({
            ...searchTerms,
            roli:e
        })
    }
  return (
  <>
    {loading ? <AnimatedSpinner/> : <Container>
        <Row className='d-flex flex-row align-items-center'>
            <Col lg={4}>
                <Form.Control placeholder='Kerko me Emertim...' value={searchTerms.emertimi} onChange={(e) => setSearchTerms({...searchTerms,emertimi:e.target.value})}/>
            </Col>
            <Col lg={4}>
                <FilterPerdorues  filter={searchTerms.roli} onSelect={handleFilterSelect}/>
            </Col>
        </Row>
        <Row className='tabeleMeMaxHeight50'> 
            {loading ? <AnimatedSpinner/>:
            <>
                <Table striped bordered hover className="mt-3">
                <thead>
                <tr>
                    <th>Nr.</th>
                    <th>Emri i Perdoruesit</th>
                    <th>Roli</th>
                    <th>Veprime</th>
                </tr>
                </thead>
                <tbody>
                {filteredPerdoruesit.slice().reverse().map((item, index) => (
                <tr key={index}>
                    {item.punonjesit != 0 ? (
                    <>
                        <th scope="row">{perdoruesit.length - index}</th>
                        <td>{item.emri}</td>
                        <td>{item.roli}</td>
                        <td>
                            {authData.perdoruesiID != item.perdoruesiID ? <>
                                <Button variant="outline-primary" className="me-2" onClick={() => {setDataPerPerdorues(item);setPerNdryshim(true);setShtoPerdoruesModal(true)}}>
                                <FontAwesomeIcon icon={faEdit} /> Ndrysho
                                </Button>
                                <Button 
                                        variant="outline-danger"
                                        onClick={() => thirreModalPerPyetje(item)}
                                        disabled={item.DataExists}>
                                        <FontAwesomeIcon icon={faTrashCan} /> Fshij
                                </Button>
                            </>:'Nuk Mund te Veprohet me Perdoruesin Aktual'}
                        </td>
                    </>
                    ) : 'Nuk ka te dhena!'}
                </tr>
                ))}

                </tbody>
            </Table>
            <Row className='justify-content-end'>    
                <Button variant="success" className='w-25' onClick={()=> {emptyDataPerPerdorues(); setShtoPerdoruesModal(true)}}>Shto Perdorues të Ri</Button>
            </Row>
            </>}
        </Row>
        <ToastContainer/>

        <Modal
                        show={shtoPerdoruesModal}
                        onHide={() => {
                            buttonLoading ? null : setShtoPerdoruesModal(false);
                        }}
                        centered
                    >
                        <Modal.Header closeButton>
                            <Modal.Title className="text-dark">Forma për{!perNdryshim ? <> Regjistrim </> : <> Ndryshim </>}të Perdoruesit</Modal.Title>
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
                                                value={dataPerPerdorues.emri}
                                                onChange={handleChangeShtoPerdorues}
                                                placeholder="Shkruaj Emrin..."
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="formLastName">
                                            <Form.Label>Fjalekalimi</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="fjalekalimi"
                                                value={dataPerPerdorues.fjalekalimi}
                                                onChange={handleChangeShtoPerdorues}
                                                placeholder="Shkruaj Fjalekalimin..."
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className="mb-3 align-items-center">
                                    <Col >
                                        <Form.Group controlId="formRole">
                                            <Form.Label>Roli</Form.Label>
                                            <Form.Select
                                                name="roli"
                                                value={dataPerPerdorues.roli || ""}
                                                onChange={handleChangeShtoPerdorues}
                                            >
                                                <option value="" disabled hidden>Zgjidh Rolin...</option>
                                                <option value="admin">admin</option>
                                                <option value="perdorues">perdorues</option>
                                            </Form.Select>
                                        </Form.Group>

                                    </Col>
                                </Row>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" disabled={buttonLoading} onClick={() => setShtoPerdoruesModal(false)}>
                                Mbyll
                            </Button>
                            <Button variant="primary" disabled={buttonLoading || !dataPerPerdorues.emri || !dataPerPerdorues.fjalekalimi || !dataPerPerdorues.roli} onClick={() => {perNdryshim ? ndryshoPerdorues() : shtoPerdorues()}}>
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

                    <ModalPerPyetje show={modalPerPyetje} handleClose={() => {setModalPerPyetje(false)}} handleConfirm={handleConfirm} />

    </Container>}
  </>
  )
}
