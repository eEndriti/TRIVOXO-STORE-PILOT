import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Form, Spinner, Card, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import ModalPerPyetje from '../ModalPerPyetje';
import { useNavigate } from 'react-router-dom';
import ShtoNdryshoSubjektin from '../ShtoNdryshoSubjektin';
import { formatCurrency } from "../AuthContext";
import  AuthProvider from '../AuthContext';
import SubjectTotalsData from '../SubjectTotalsData';

export default function Klient() {
    const navigate = useNavigate();
    const [klientet, setKlientet] = useState([]);
    const [loading, setLoading] = useState(false);
    const [emertimiSearch, setEmertimiSearch] = useState('');
    const [kontaktiSearch, setKontaktiSearch] = useState('');
    const [showModalPerPyetje, setShowModalPerPyetje] = useState(false);
    const [dataPerAnulim, setDataPerAnulim] = useState();
    const [modalShow, setModalShow] = useState(false);
    const [data, setData] = useState({inputEmertimi: '', inputKontakti: '', ndrysho: false, idPerNdryshim: null, lloji: 'klient'});
    const [filteredKlientet,setFilteredKlientet] = useState([])
    const showToast = useToast()
    const [triggerReload, setTriggerReload] = useState(false);
    const {authData} = useContext(AuthProvider)
    const [totals, setTotals] = useState();
    
    useEffect(() => {
        fetchData();
    }, [triggerReload]);


    const fetchData = async () => {
        try {
            setLoading(true);

            const [klientData, servisimiData] = await Promise.all([
                window.api.fetchTableSubjekti('klient'),
                window.api.fetchTableQuery(`
                    SELECT s.subjektiID, s.lloji, s.emertimi, s.kontakti,
                           COALESCE(SUM(sh.totaliPerPagese), 0) AS totalTotaliPerPagese,
                           COALESCE(SUM(sh.totaliPageses), 0) AS totalTotaliPageses,
                           COALESCE(SUM(sh.mbetjaPageses), 0) AS totalMbetjaPerPagese
                    FROM subjekti s
                    LEFT JOIN servisimi sh ON s.subjektiID = sh.subjektiID
                    GROUP BY s.subjektiID, s.emertimi, s.kontakti, s.lloji
                `)
            ]);

            const combinedData = [...klientData, ...servisimiData];

            const aggregatedData = combinedData.reduce((acc, item) => {
                const existing = acc.find(i => i.subjektiID === item.subjektiID);
                if (existing) {
                    existing.totalTotaliPerPagese += item.totalTotaliPerPagese;
                    existing.totalTotaliPageses += item.totalTotaliPageses;
                    existing.totalMbetjaPerPagese += item.totalMbetjaPerPagese;
                } else {
                    acc.push({ ...item });
                }
                return acc;
            }, []);

            const filteredData = aggregatedData.filter(item => item.lloji === 'klient');
            setKlientet(filteredData);
            setFilteredKlientet(filteredData)
            kalkuloTotalin(filteredData)
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const filterResult = klientet.filter((klienti)=>{
            return klienti.emertimi.toLowerCase().includes(emertimiSearch.toLowerCase()) && klienti.kontakti.includes(kontaktiSearch)
        })
        setFilteredKlientet(filterResult)
        kalkuloTotalin(filterResult)
    },[emertimiSearch,kontaktiSearch])

    const thirreModalPerPyetje = (item) => {
        setShowModalPerPyetje(true);
        setDataPerAnulim(item);
    };

    const handleConfirmModal = () => {
        handleDeleteSubjekti();
    };


    const kalkuloTotalin = (data) => {
      
        const summedTotals = data.reduce(
          (acc, item) => ({
            totaliPerPagese:  acc.totaliPerPagese + item.totalTotaliPerPagese,
            totaliIPageses:   acc.totaliIPageses  + item.totalTotaliPageses,
            mbetjaPerPagese:  acc.mbetjaPerPagese + item.totalMbetjaPerPagese,
          }),
          { totaliPerPagese: 0, totaliIPageses: 0, mbetjaPerPagese: 0 }
        );
      
        setTotals(summedTotals);
      };

    const handleDeleteSubjekti = async () => {
        if (dataPerAnulim) {
            try {
                const data = {
                    ...dataPerAnulim,
                    perdoruesiID:authData.perdoruesiID,
                    nderrimiID:authData.nderrimiID
                }
                await window.api.deleteSubjekti(data);
                showToast('Klienti u Anulua me Sukses!', 'success');

            } catch (error) {
                showToast('Gabim gjate Fshirjes: ' + error , 'error');
            } finally {
                setLoading(false);
                setTriggerReload(!triggerReload);
            }
        } else {
            showToast('Gabim, Rifreskoni faqen dhe provoni serish: ', 'error');
        }
    };

    const handleCloseModalPerPyetje = () => {
        setShowModalPerPyetje(false);
    };

    const handleClose = () => setModalShow(false);

    const handleShow = () => {
        setData({
            lloji: 'klient',
            ndrysho: false
        });
        setModalShow(true);
    };

    const handleShowNdrysho = (item) => {
        setData({
            inputEmertimi: item.emertimi,
            inputKontakti: item.kontakti,
            idPerNdryshim: item.subjektiID,
            lloji: 'klient',
            ndrysho: true
        });
        setModalShow(true);
    };

    const handleDetaje = (subjektiID) => {
        navigate(`/detajePerSubjekt/${'klient'}/${subjektiID}`);
    };

    return (
        <Container className='mt-5'>
            <Row className='mb-4'>
                <Col className='text-center'>
                    <h4 className="fw-bold">Klientet:</h4>
                </Col>
                <Col md={2}>
                    <Button className='fs-5 w-100' variant='success' onClick={handleShow}>Krijo nje Klient <FontAwesomeIcon icon={faPlus} /></Button>
                </Col>
            </Row>

           

            <Row className="mb-3">
                <Col md={4}>
                    <Form.Control
                        type="text"
                        placeholder="Kërko sipas emertimit"
                        value={emertimiSearch}
                        onChange={(e) => setEmertimiSearch(e.target.value)}
                    />
                </Col>
                <Col md={4}>
                    <Form.Control
                        type="text"
                        placeholder="Kërko sipas Kontakti"
                        value={kontaktiSearch}
                        onChange={(e) => setKontaktiSearch(e.target.value)}
                    />
                </Col>
            </Row>

            {loading ? (
                <div className="d-flex justify-content-center">
                    <Spinner animation="border" />
                </div>
            ) : (
                <Row>
                    <Col>
                        {filteredKlientet.length < 1 ? (
                            <h5 className="text-center text-danger mt-5">
                                Ende nuk keni ndonje klient te regjistruar!
                            </h5>
                        ) : (
                            <Card className="my-3">
                            <Card.Body>
                                <div className="table-responsive tableHeight50">
                                        <table className="table table-bordered table-hover text-center">
                                            <thead className="table-secondary">
                                        <tr>
                                            <th scope="col">Nr</th>
                                            <th scope="col">Emertimi</th>
                                            <th scope="col">Kontakti</th>
                                            <th scope="col">Totali Per Pagese</th>
                                            <th scope="col">Totali Pageses</th>
                                            <th scope="col">Mbetja Per Pagese</th>
                                            <th scope="col">Opsionet</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredKlientet.slice().reverse().map((item, index) => (
                                            <tr key={index}>
                                                <th scope="row">{filteredKlientet.length - index}</th>
                                                <td>{item.emertimi}</td>
                                                <td>{item.kontakti}</td>
                                                <td>{formatCurrency(item.totalTotaliPerPagese)}</td>
                                                <td>{formatCurrency(item.totalTotaliPageses)}</td>
                                                <td >
                                                    <Badge bg={item.totalMbetjaPerPagese > 0 ? 'danger' : 'success'} pill className='fw-bold'>{formatCurrency(item.totalMbetjaPerPagese)}</Badge>
                                                </td>
                                                <td className="d-flex justify-content-center">
                                                    {authData.aKaUser == 'admin' &&<Button
                                                        variant="btn btn-outline-secondary"
                                                        className="mx-1"
                                                        onClick={() => handleDetaje(item.subjektiID)}
                                                    >
                                                        Detaje...
                                                    </Button>}
                                                    <Button
                                                        variant="btn btn-outline-primary"
                                                        className="mx-1"
                                                        onClick={() => handleShowNdrysho(item)}
                                                    >
                                                        <FontAwesomeIcon icon={faEdit} />
                                                    </Button>
                                                        <Button
                                                            variant="btn btn-outline-danger"
                                                            className="mx-1"
                                                            disabled = {item.totalTotaliPerPagese > 0}
                                                            onClick={() => thirreModalPerPyetje(item)}
                                                        >
                                                            <FontAwesomeIcon icon={faTrashCan} />
                                                        </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                             </Card.Body>
                             </Card>
                        )}
                    </Col>
                </Row>
            )}

                        {filteredKlientet.length > 0 && (<SubjectTotalsData totals={totals} />)}
            
            <ToastContainer />
            <ModalPerPyetje
                show={showModalPerPyetje}
                handleClose={handleCloseModalPerPyetje}
                handleConfirm={handleConfirmModal}
            />
            <ShtoNdryshoSubjektin
                show={modalShow}
                handleClose={() => {handleClose(); setTriggerReload(!triggerReload)}}
                data={data}
            />
        </Container>
    );
}
