import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Form, Spinner, Card, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faEdit,faPlus,faEuro,faCheckCircle,faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import ModalPerPyetje from '../ModalPerPyetje';
import { useNavigate } from 'react-router-dom';
import ShtoNdryshoSubjektin from './ShtoNdryshoSubjektin';
import AuthProvider ,{  formatCurrency } from "../AuthContext";
import SubjectTotalsData from './SubjectTotalsData';
import { useTranslation } from 'react-i18next';
export default function Furnitor() {
    const {t} = useTranslation('subjekti')
    const navigate = useNavigate();
    const [furnitoret, setFurnitoret] = useState([]);
    const [loading, setLoading] = useState(false);
    const [emertimiSearch, setEmertimiSearch] = useState('');
    const [kontaktiSearch, setKontaktiSearch] = useState('');
    const [showModalPerPyetje, setShowModalPerPyetje] = useState(false);
    const [dataPerDelete, setDataPerDelete] = useState();
    const [modalShow, setModalShow] = useState(false);
    const [data, setData] = useState({ inputEmertimi: '', inputKontakti: '', ndrysho: false, idPerNdryshim: null, lloji: 'furnitor' });
    const [filteredFurnitoret,setFilteredFurnitoret] = useState([])
    const [triggerReload, setTriggerReload] = useState(false);
    const showToast = useToast()
    const {authData} = useContext(AuthProvider)
    const [totals, setTotals] = useState();

    useEffect(() => {
        fetchData();
    }, [triggerReload]);

    const fetchData = async () => {
        setLoading(true);
            try {
                await window.api.fetchTableSubjekti('furnitor').then((receivedData) => {
                    const filteredData = receivedData.filter(item => item.lloji == 'furnitor');
                    setFurnitoret(filteredData);
                    setFilteredFurnitoret(filteredData)
                    kalkuloTotalin(filteredData)
                });
            } catch (error) {
                showToast(t('Gabim gjate ngarkimit te furnitoreve!') + error, 'error');
            }finally{
                setLoading(false);

            }
    }

    useEffect(() => {
        const filterResult = furnitoret.filter((furnitor) => {
            return furnitor.emertimi.toLowerCase().includes(emertimiSearch.toLowerCase()) && furnitor.kontakti.includes(kontaktiSearch)
        })
        setFilteredFurnitoret(filterResult)
        kalkuloTotalin(filterResult)
    },[emertimiSearch,kontaktiSearch])

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
      

    const thirreModalPerPyetje = (data) => {
        setShowModalPerPyetje(true);
        setDataPerDelete(data);
    }

    const handleConfirmModal = () => {
        handleDeleteSubjekti();
    }

    const handleDeleteSubjekti = async () => {
        if (dataPerDelete) {
            try {
                const data = {
                    ...dataPerDelete,
                    perdoruesiID:authData.perdoruesiID,
                    nderrimiID:authData.nderrimiID
                }
                await window.api.deleteSubjekti(data);
                showToast(t('Furnitori u Anulua me Sukses!'), 'success');
                
            } catch (error) {
                showToast(t('Gabim gjate Fshirjes!') + error, 'error');
            } finally {
                setLoading(false);
                setTriggerReload(!triggerReload);
            }
        } else {
            showToast(t('Gabim, Rifreskoni faqen dhe provoni serish!'),'error');
        }
    }

    const handleCloseModalPerPyetje = () => {
        setShowModalPerPyetje(false);
    }

    const handleClose = () => setModalShow(false);

    const handleShow = () => {
        setData({ lloji: 'furnitor', ndrysho: false });
        setModalShow(true);
    };

    const handleShowNdrysho = (item) => {
        setData({
            inputEmertimi: item.emertimi,
            inputKontakti: item.kontakti,
            idPerNdryshim: item.subjektiID,
            lloji: 'furnitor',
            ndrysho: true
        });
        setModalShow(true);
    }

    const handleDetaje = (subjektiID) => {
        navigate(`/detajePerSubjekt/${'furnitor'}/${subjektiID}`);
    }

    return (
        <Container className='mt-5'>
            <Row className="justify-content-end border-bottom">
                <Col>
                    <h4 className="text-center fw-bold mb-4">{t('Furnitorët')}:</h4>
                </Col>
                <Col md={4}>
                    <Button className='w-75 ' variant='success' onClick={handleShow}>
                        {t('Krijo një Furnitor')} <FontAwesomeIcon icon={faPlus} />
                    </Button>
                </Col>
            </Row>


            <Row className="mt-4 ">
                <Col md={4} className="">
                    <Form.Control
                        type="text"
                        placeholder={t("Kërko sipas emërtimit")}
                        value={emertimiSearch}
                        onChange={(e) => setEmertimiSearch(e.target.value)}
                    />
                </Col>
                <Col md={4} className="">
                    <Form.Control
                        type="text"
                        placeholder={t("Kërko sipas emërtimit")}
                        value={kontaktiSearch}
                        onChange={(e) => setKontaktiSearch(e.target.value)}
                    />
                </Col>
            </Row>

            {loading ? (
                <div className="d-flex justify-content-center">
                    <Spinner animation="border" variant="success" />
                </div>
            ) : (
                <Row>
                    <Col>
                        {filteredFurnitoret.length < 1 ? (
                            <h5 className="text-center text-danger mt-5">
                                {t('Ende nuk keni ndonjë furnitor të regjistruar!')}
                            </h5>
                        ) : (
                            <Card className="my-3">
                                <Card.Body>
                                    <div className="table-responsive tableHeight50">
                                        <table className="table table-bordered table-hover text-center ">
                                            <thead className="table-secondary">
                                                <tr className="fs-5">
                                                    <th scope="col">{t('Nr')}</th>
                                                    <th scope="col">{t('Emërtimi')}</th>
                                                    <th scope="col">{t('Kontakti')}</th>
                                                    <th scope="col">{t('Totali për Pagesë')}</th>
                                                    <th scope="col">{t('Totali Pagesave')}</th>
                                                    <th scope="col">{t('Mbetja për Pagesë')}</th>
                                                    <th scope="col">{t('Opsionet')}</th>

                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredFurnitoret.slice().reverse().map((item, index) => (
                                                    <tr key={item.subjektiID} className="table-hover">
                                                        <th scope="row">{filteredFurnitoret.length - index}</th>
                                                        <td>{item.emertimi}</td>
                                                        <td>{item.kontakti}</td>
                                                        <td>{formatCurrency(item.totalTotaliPerPagese)}</td>
                                                        <td>{formatCurrency(item.totalTotaliPageses)}</td>
                                                        <td >
                                                            <Badge bg={item.totalMbetjaPerPagese > 0 ? 'danger' : 'success'} pill className='fw-bold'>{formatCurrency(item.totalMbetjaPerPagese)}</Badge>
                                                        </td>
                                                        <td>
                                                            <Button variant="btn btn-outline-secondary" className="mx-1" onClick={() => handleDetaje(item.subjektiID)}>
                                                                {t('Detaje...')}
                                                            </Button>
                                                            <Button variant="btn btn-outline-primary" className="mx-1" onClick={() => handleShowNdrysho(item)}>
                                                                <FontAwesomeIcon icon={faEdit} />
                                                            </Button>
                                                            <Button variant="btn btn-outline-danger" disabled={item.totalTotaliPerPagese > 0 ? true: false} className="mx-1" onClick={() => thirreModalPerPyetje(item)}>
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

            {filteredFurnitoret.length > 0 && (<SubjectTotalsData totals={totals} />)}

            <ToastContainer position="top-center" autoClose={1500} hideProgressBar={true} />

            <ModalPerPyetje show={showModalPerPyetje} handleClose={handleCloseModalPerPyetje} handleConfirm={handleConfirmModal} />
            <ShtoNdryshoSubjektin show={modalShow}                 handleClose={() => {handleClose(); setTriggerReload(!triggerReload)}}  data={data} />
        </Container>
    );
}
