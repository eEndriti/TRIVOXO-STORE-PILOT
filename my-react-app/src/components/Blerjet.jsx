import { useState, useEffect,useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Form, Spinner, Card, Table, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faEdit,faChevronRight,faChevronDown,faEuroSign } from '@fortawesome/free-solid-svg-icons';
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';
import ModalPerPyetje from './ModalPerPyetje';
import DetajePerShitjeBlerje from './DetajePerShitjeBlerje';
import AnimatedSpinner from './AnimatedSpinner';
import ShtoPagese from './ShtoPagese';
import LineChartComponent from './Charts/LineChartComponent';
import PieChartComponent from './Charts/PieChartComponent';
import AuthContext,{ formatCurrency, localTodayDate } from './AuthContext';

export default function Blerjet() {
      const navigate = useNavigate();  
    const [blerjet, setBlerjet] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-01-01`);
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10)); 
    const [showModalPerPyetje, setShowModalPerPyetje] = useState(false);
    const [idPerAnulim, setIdPerAnulim] = useState();
    const [IDPerDetaje,setIDPerDetaje] = useState()
    const [shifraPerDetaje,setShifraPerDetaje] = useState()
    const [dataPerShtoPagese,setDataPerShtoPagese] = useState()
    const [showShtoPagese,setShowShtoPagese] = useState(false)
    const { authData,updateAuthData } = useContext(AuthContext);
    const showToast = useToast();
    const [triggerReload, setTriggerReload] = useState(false);

    useEffect(() => {
        fetchData()
        if (authData.aKaUser !== undefined) { 
            if (authData.aKaUser != 'admin') {
                setEndDate(localTodayDate);
                setStartDate(localTodayDate);
            }
        }
    }, [triggerReload,authData.aKaUser]);

    const fetchData = async () => {
        try {
            setLoading(true)
            await window.api.fetchTableBlerje().then((receivedData) => {
                setBlerjet(receivedData);
                setLoading(false);
            });
        } catch (e) {
            showToast('Gabim gjate shkarkimit te te dhenave: ' + e.message, 'error');
        }finally{
            setLoading(false)
        }
    }
    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const handleClientChange = (e) => setClientFilter(e.target.value);
    const handleUserChange = (e) => setUserFilter(e.target.value);
    const handleStartDateChange = (e) => setStartDate(e.target.value);
    const handleEndDateChange = (e) => setEndDate(e.target.value);

    const filteredBlerjet = blerjet.filter(item => {
        const itemDate = new Date(item.dataBlerjes).toISOString().slice(0, 10);
        return (
            item.shifra.toLowerCase().includes(searchTerm.toLowerCase()) &&
            item.klienti.toLowerCase().includes(clientFilter.toLowerCase()) &&
            item.perdoruesi.toLowerCase().includes(userFilter.toLowerCase()) &&
            (!startDate || itemDate >= startDate) &&
            (!endDate || itemDate <= endDate)
        );
    });

    const thirreModalPerPyetje = (idPerAnulim) => {
        setShowModalPerPyetje(true);
        setIdPerAnulim(idPerAnulim);
    };
    
    const handleConfirmModal = () => {
        handleDeleteBlerje();
    };
    
    const handleCloseModalPerPyetje = () => {
        setShowModalPerPyetje(false);
    };
    
    const handleDeleteBlerje = async () => {
        const data = {
            lloji: 'Blerje',
            transaksioniID: idPerAnulim,
            perdoruesiID: authData.perdoruesiID,
            nderrimiID: authData.nderrimiID,
        };
        try {
            await window.api.anuloBlerjen(data);
            showToast(`Blerja u Anulua me Sukses !`, 'success');

        } catch (error) {
            showToast('Gabim gjate Anulimit: ' + error , 'error');

        }finally{
            setTriggerReload(!triggerReload)
            updateAuthData({reloadLayout:!authData.reloadLayout})

        }
    };


    const shfaqProduktetEBlerjes = (ID,shifra) => {
        setShifraPerDetaje(shifra)
       if(IDPerDetaje == ID){
            setIDPerDetaje(null)
       }else{
            setIDPerDetaje(ID)
       }
}   

const hapeShtoPagese = (item) =>{
    setDataPerShtoPagese({
        ...item,
        llojiDokumentit:'blerje',
        IDDokumentit:item.blerjeID,
        subjekti:item.klienti
    })
    console.log('prejblej',dataPerShtoPagese)
    setShowShtoPagese(true)
}
    return (
        <Container fluid>
            <h4 className="text-center fw-bold pt-4">Të Gjitha Blerjet:</h4>
            <hr />

            <Row className="mb-3 p-1 ">
                <Col md={2}>
                    <Form.Control
                        type="text"
                        placeholder="Kërko sipas shifrës"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </Col>
                <Col md={3}>
                    <Form.Control
                        type="text"
                        placeholder="Kërko sipas klientit"
                        value={clientFilter}
                        onChange={handleClientChange}
                    />
                </Col>
                <Col md={3}>
                    <Form.Control
                        type="text"
                        placeholder="Kërko sipas përdoruesit"
                        value={userFilter}
                        onChange={handleUserChange}
                    />
                </Col>
                <Col md={2}>
                    <Form.Control
                        type="date"
                        value={startDate}
                        readOnly={authData.aKaUser != 'admin'}
                        onChange={authData.aKaUser != 'admin' ? handleStartDateChange  :  null}
                    />
                </Col>
                <Col md={2} className=''>
                    <Form.Control
                        type="date"
                        value={endDate}
                        readOnly={authData.aKaUser != 'admin'}
                        onChange={authData.aKaUser != 'admin' ? handleEndDateChange : null}
                    />
                </Col>
            </Row>

            {loading ? (
                <div className="d-flex justify-content-center">
                    <AnimatedSpinner animation="border" />
                </div>
            ) : (
                <Row>
                    <Col>
                        {filteredBlerjet.length < 1 ? (
                            <h5 className="text-center text-danger mt-5">
                                Nuk Ekzistojnë Blerje në këtë Interval Kohor!
                            </h5>
                        ) : (
                            <div className=" my-3 tabelaTransaksioneve">
                                <div className="table-responsive tableHeight50">
                                   <Card>
                                   <Table responsive bordered striped  hover className="text-center" >
                                        <thead className="table-light">
                                                <tr className="fs-5">
                                                    <th scope="col">Nr</th>
                                                    <th scope="col">Shifra</th>
                                                    <th scope="col">Furnitori</th>
                                                    <th scope="col">Totali Per Pagese</th>
                                                    <th scope="col">Totali Pageses</th>
                                                    <th scope="col">Mbetja Per Pagese</th>
                                                    <th scope="col">Perdoruesi</th>
                                                    <th scope="col">Nderrimi dhe Data e Blerjes</th>
                                                    <th scope="col">Data e Fatures</th>
                                                    <th scope="col">Fature e Rregullt</th>
                                                    <th scope="col">Nr i Fatures</th>
                                                    <th scope="col">Menyra e Pageses</th>
                                                    <th scope="col">Opsionet</th>
                                                </tr>
                                            </thead>
                                            <tbody className="">
                                                {filteredBlerjet.slice().reverse().map((item, index) => (
                                                    <tr key={index}>
                                                        <th scope="row">{filteredBlerjet.length - index}</th>
                                                        <td>{item.shifra}</td>
                                                        <td>{item.klienti}</td>
                                                        <td>{formatCurrency(item.totaliPerPagese)} </td>
                                                        <td>{formatCurrency(item.totaliPageses)} </td>
                                                        <td >
                                                            <Badge pill bg={item.mbetjaPerPagese > 0 ? 'danger' : 'success'} className='fw-bold'>{formatCurrency(item.mbetjaPerPagese)}</Badge>
                                                        </td>
                                                        <td>{item.perdoruesi}</td>
                                                        <td>{item.numriPercjelles + '-' + new Date(item.dataBlerjes).toLocaleDateString()}</td>
                                                        <td>{new Date(item.dataFatures).toLocaleDateString()}</td>
                                                        <td>{item.fatureERregullt === 'true' ? 'Po' : 'Jo'}</td>
                                                        <td>{item.nrFatures}</td>
                                                        <td>
                                                            <Badge bg='info'  pill>{item.menyraPagesese}</Badge>
                                                        </td>
                                                        <td className='d-flex flex-row justify-content-around align-items-center'>
                                                            <Button variant="btn btn-outline-primary" onClick={() => navigate(`/ndryshoBlerjen/${item.blerjeID}`)}>
                                                                <FontAwesomeIcon  icon={faEdit} />
                                                            </Button>
                                                            <Button variant="btn btn-outline-danger" onClick={() => thirreModalPerPyetje(item.transaksioniID)}>
                                                                <FontAwesomeIcon  icon={faTrashCan} />
                                                            </Button>
                                                            <Button variant='btn btn-outline-transparent' onClick={() => shfaqProduktetEBlerjes(item.blerjeID,item.shifra)} 
                                                                    >
                                                            <FontAwesomeIcon 
                                                                    className={` ${IDPerDetaje === item.blerjeID ? 'text-primary fs-4 fw-bold' : 'text-secondary fw-bold'}`}
                                                                    icon={IDPerDetaje === item.blerjeID ? faChevronDown : faChevronRight}
                                                                />
                                                            </Button>
                                                            <Button variant="btn btn-outline-success"  onClick={() => hapeShtoPagese(item)} disabled={item.mbetjaPerPagese == 0 }>
                                                                <FontAwesomeIcon  icon={faEuroSign} />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                   </Card>
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
                
            )}
            <hr/>
             {IDPerDetaje ? <>
                <DetajePerShitjeBlerje shifraPerDetaje = {shifraPerDetaje}  IDPerDetaje = {IDPerDetaje} lloji = {'blerje'}/>
                </>:null}
                {!loading && authData.aKaUser == 'admin' ? 

                <Row className='d-flex flex-row flex-wrap justify-content-center' >
                <Col style={{maxHeight:'400px' ,minHeight:'400px'}}>
                    <LineChartComponent dataFillimit={startDate} dataMbarimit={endDate} teDhenat={blerjet.map(sale => ({
                        ...sale,
                        dataTransaksionit: sale.dataBlerjes, 
                        }))} lloji={'Blerjeve'} />
                </Col>
                <Col className='' style={{maxHeight:'400px' ,minHeight:'400px'}}>
                    <PieChartComponent teDhenat={blerjet} labels={['Me Fature', 'Pa Fature']} lloji = {'Blerjeve'}/>
                </Col>
            </Row> : ''}

            <ToastContainer />
            <ModalPerPyetje show={showModalPerPyetje} handleClose={handleCloseModalPerPyetje} handleConfirm={handleConfirmModal} />
            <ShtoPagese show={showShtoPagese} handleClose={() => setShowShtoPagese(false)} data={dataPerShtoPagese} />

        </Container>
    );
}
