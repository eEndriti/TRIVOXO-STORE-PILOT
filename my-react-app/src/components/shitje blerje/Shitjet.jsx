import { useState, useEffect,useContext } from 'react';
import { Container, Row, Col, Button, Form,Card,Table, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan,faEdit,faChevronDown,faChevronRight,faFilePdf,faEuroSign } from '@fortawesome/free-solid-svg-icons';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import ModalPerPyetje from '../ModalPerPyetje';
import AnimatedSpinner from '../AnimatedSpinner'
import DetajePerShitjeBlerje from './DetajePerShitjeBlerje';
import { useNavigate } from 'react-router-dom';
import ShtoPagese from '../ShtoPagese';
import LineChartComponent from '../Charts/LineChartComponent';
import PieChartComponent from '../Charts/PieChartComponent';
import AuthContext , {formatCurrency, localTodayDate, normalizoDaten} from '../AuthContext';
import { useTranslation } from 'react-i18next';
export default function Shitjet() {
    
    const {t} = useTranslation('shitjeblerje')
    const navigate = useNavigate()
    const [shitjet, setShitjet] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-01-01`);
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10)); // Default to current date
    const [showModalPerPyetje, setShowModalPerPyetje] = useState(false);
    const [shitjeIDPerAnulim, setShitjeIDPerAnulim] = useState();
    const [shifraPerAnulim, setShifraPerAnulim] = useState()
    const [transaksioniIDPerAnulim, setTransaksioniIDPerAnulim] = useState();
    const [IDPerDetaje,setIDPerDetaje] = useState()
    const [llojiShitjes,setLlojiShitjes] = useState()
    const [shifraPerDetaje,setShifraPerDetaje] = useState()
    const [dataPerShtoPagese,setDataPerShtoPagese] = useState()
    const [showShtoPagese,setShowShtoPagese] = useState(false)
    const {authData,updateAuthData} = useContext(AuthContext)
    const showToast = useToast();
    const [triggerReload, setTriggerReload] = useState(false);

    useEffect(() => {
        fetchData();
    
        if (authData.aKaUser !== undefined) { 
            if (authData.aKaUser != 'admin') {
                setEndDate(localTodayDate);
                setStartDate(localTodayDate);
            }
        }
    }, [triggerReload, authData.aKaUser]); 
     

    const fetchData = async () => {
        await window.api.fetchTableShitje().then((receivedData) => {
            setShitjet(receivedData);
            setLoading(false);
        });
    }

    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const handleClientChange = (e) => setClientFilter(e.target.value);
    const handleUserChange = (e) => setUserFilter(e.target.value);
    const handleStartDateChange = (e) => setStartDate(e.target.value);
    const handleEndDateChange = (e) => setEndDate(e.target.value);

    const filteredShitjet = shitjet.filter(item => {
        const itemDate = new Date(item.dataShitjes).toISOString().slice(0, 10);
        const normalizedStartDate = normalizoDaten(startDate)
        const normalizedEndDate = normalizoDaten(endDate)
            return (
                item.shifra.toLowerCase().includes(searchTerm.toLowerCase()) &&
                item.subjekti.toLowerCase().includes(clientFilter.toLowerCase()) &&
                item.perdoruesi.toLowerCase().includes(userFilter.toLowerCase()) &&
                (!normalizedStartDate || normalizoDaten(itemDate) >= normalizedStartDate) &&
                (!normalizedEndDate || normalizoDaten(itemDate) <= normalizedEndDate)
            );
    });

    const thirreModalPerPyetje = (shitjeIDPerAnulim,transaksioniIDPerAnulim,llojiShitjes,shifraPerAnulim) => {
        setShowModalPerPyetje(true);
        setLlojiShitjes(llojiShitjes)
        setShitjeIDPerAnulim(shitjeIDPerAnulim);
        setTransaksioniIDPerAnulim(transaksioniIDPerAnulim)
        setShifraPerAnulim(shifraPerAnulim)
    };
    
    const handleConfirmModal = () => {
        handleDeleteShitje();
    };
    const handleCloseModalPerPyetje = () => {
        setShowModalPerPyetje(false);
    };
    
    const handleDeleteShitje = async () => {
        const data = {
            lloji: 'Shitje',
            transaksioniID: transaksioniIDPerAnulim,
            perdoruesiID: authData.perdoruesiID,
            nderrimiID:authData.nderrimiID,
            shitjeID:shitjeIDPerAnulim,
            shifra:shifraPerAnulim
        };
        console.log('data', data);  
        try {
            if(llojiShitjes == 'dyqan'){
                await window.api.anuloShitjen(data);
           }else if (llojiShitjes == 'online'){
                await window.api.anuloPorosineOnlineTePranuar(data)
           }

            showToast(t('Shitja u Anulua me Sukses !'), 'success');
          
        } catch (error) {
            showToast(t('Gabim gjate Anulimit') + error , 'error');

        }finally{
            setTriggerReload(!triggerReload)
            setShowModalPerPyetje(false);
            fetchData()
            updateAuthData({reloadLayout:!authData.reloadLayout})

        }
    };

    const shfaqProduktetEShitjes = (ID,shifra) => {
        setShifraPerDetaje(shifra)
       if(IDPerDetaje == ID){
            setIDPerDetaje(null)
       }else{
            setIDPerDetaje(ID)
            
       }
}   
const kontrolloStatusinGarancionit = (koha, dataShitjes) => {
    const dataAktuale = new Date(); // Data aktuale
    const dataSkadimit = new Date(dataShitjes);

    // Shto muajt e garancionit
    dataSkadimit.setMonth(dataSkadimit.getMonth() + koha);
    
    // Kontrollo nëse garancioni ka skaduar
    if (dataAktuale >= dataSkadimit) {
        return t("I Skaduar");
    } else {
        // Llogarit ditët e mbetura
        const diferencaNeMs = dataSkadimit - dataAktuale;
        const diteMbetura = Math.floor(diferencaNeMs / (1000 * 60 * 60 * 24));

        return `${diteMbetura} ${t('Ditë te Mbetura')}`;
    }
};

const hapePdf = async (shifra) =>{
    const folderPath = authData.pdfFolder
    const filePath = folderPath + '\\Garancioni ' + shifra +'.pdf'
    await window.api.openFile(filePath );
}

const hapeShtoPagese = (item) =>{
    setDataPerShtoPagese({
        ...item,
        llojiDokumentit:'shitje',
        IDDokumentit:item.shitjeID
    })
    setShowShtoPagese(true)
}

    return (
        <Container fluid className="pt-5">
            <h4 className="text-center fw-bold">{t('Të Gjitha Shitjet')}:</h4>
            <hr />

            <Row className="mb-3 p-1 ">
                <Col md={2}>
                    <Form.Control
                        type="text"
                        placeholder={t("Kërko sipas shifrës")}
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </Col>
                <Col md={3}>
                    <Form.Control
                        type="text"
                        placeholder={t("Kërko sipas klientit")}
                        value={clientFilter}
                        onChange={handleClientChange}
                    />
                </Col>
                <Col md={3}>
                    <Form.Control
                        type="text"
                        placeholder={t("Kërko sipas përdoruesit")}
                        value={userFilter}
                        onChange={handleUserChange}
                    />
                </Col>
                <Col md={2}>
                    <Form.Control
                        type="date"
                        value={startDate}
                        onChange={authData.aKaUser == 'admin' ? handleStartDateChange : null}
                        readOnly = {authData.aKaUser != 'admin'}
                    />
                </Col>
                <Col md={2} className=''>
                    <Form.Control
                        type="date"
                        value={endDate}
                        onChange={authData.aKaUser == 'admin' ? handleEndDateChange : null}
                        readOnly = {authData.aKaUser != 'admin'}

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
                        {filteredShitjet.length < 1 ? (
                            <h5 className="text-center text-danger mt-5">
                                {t('Nuk Ekzistojnë Shitje në këtë Interval Kohor!')}
                            </h5>
                        ) : (
                            <div className=" my-3 tabelaTransaksioneve">
                                <div className="table-responsive tableHeight50 mb-5">
                                    <Card>
                                    <Table responsive bordered striped  hover className="text-center" >
                                        <thead className="table-light">
                                            <tr className="fs-5">
                                                <th scope="col">{t("Nr")}</th>
                                                <th scope="col">{t("Shifra")}</th>
                                                <th scope="col">{t("Lloji")}</th>
                                                <th scope="col">{t("Totali Per Pagese")}</th>
                                                <th scope="col">{t("Totali Pageses")}</th>
                                                <th scope="col">{t("Mbetja Per Pagese")}</th>
                                                <th scope="col">{t("Subjekti")}</th>
                                                <th scope="col">{t("Nderrimi dhe Data e Shitjes")}</th>
                                                <th scope="col">{t("Menyra e Pageses")}</th>
                                                <th scope="col">{t("Perdoruesi")}</th>
                                                <th scope="col">{t("Nr Porosise")}</th>
                                                <th scope="col">{t("Koha dhe Statusi Garancionit")}</th>
                                                <th scope="col">{t("Opsionet")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="">
                                            {filteredShitjet.slice().reverse().map((item, index) => (
                                                <tr key={index} >
                                                    <th scope="row">{filteredShitjet.length - index}</th>
                                                    <td>{item.shifra}</td>
                                                    <td>{item.lloji}</td>
                                                    <td>{item.totaliPerPagese} €</td>
                                                    <td>{item.totaliPageses} €</td>
                                                    <td>
                                                        <Badge bg={item.mbetjaPerPagese > 0 ? 'danger' : 'success'} pill className="fw-bold" >
                                                        {formatCurrency(item.mbetjaPerPagese)}
                                                        </Badge>                    
                                                    </td>                                                    
                                                    <td>{item.subjekti}</td>
                                                    <td>{item.numriPercjelles + '-' + new Date(item.dataFillimit).toLocaleDateString()}</td>
                                                    <td><Badge bg='info' pill>{item.menyraPageses}</Badge></td>
                                                    <td>{item.perdoruesi}</td>
                                                    <td>{item.nrPorosise}</td>
                                                    <td>{item.kohaGarancionit > 1 ? <>{item.kohaGarancionit} {t('Muaj')} / {kontrolloStatusinGarancionit(item.kohaGarancionit,item.dataShitjes)}</>:t('Pa Garancion')}</td>
                                                    <td >
                                                       <Col className="d-flex flex-wrap-flex-row justify-content-center align-items-center mt-1">
                                                        <Button variant="btn btn-outline-primary" onClick={() => navigate(`/ndryshoShitjen/${item.shitjeID}`)}>
                                                                <FontAwesomeIcon  icon={faEdit} />
                                                            </Button>
                                                            <Button variant="btn btn-outline-danger" className='mx-2' onClick={() => thirreModalPerPyetje(item.shitjeID,item.transaksioniID,item.lloji,item.shifra)}>
                                                                <FontAwesomeIcon  icon={faTrashCan} />
                                                            </Button>
                                                            <Button variant='btn btn-outline-transparent'   onClick={() => shfaqProduktetEShitjes(item.shitjeID,item.shifra)} 
                                                                    >
                                                            <FontAwesomeIcon 
                                                                    className={` ${IDPerDetaje === item.shitjeID ? 'text-primary fs-4 fw-bold' : 'text-secondary fw-bold'}`}
                                                                    icon={IDPerDetaje === item.shitjeID ? faChevronDown : faChevronRight}
                                                                />
                                                            </Button>
                                                            <Button variant="" className='mx-2 btn btn-link' onClick={() => hapePdf(item.shifra)} disabled = {item.kohaGarancionit < 1}>
                                                                <FontAwesomeIcon  icon={faFilePdf} />
                                                            </Button>
                                                            <Button variant="btn btn-outline-success"  onClick={() => hapeShtoPagese(item)} disabled={item.mbetjaPerPagese == 0 || item.lloji == 'online'}>
                                                                <FontAwesomeIcon  icon={faEuroSign} />
                                                            </Button>
                                                       </Col>
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

            {IDPerDetaje ? <>
                <DetajePerShitjeBlerje shifraPerDetaje = {shifraPerDetaje}  IDPerDetaje = {IDPerDetaje} lloji = {'shitje'} />
                </>:null}
                
                {!loading && authData.aKaUser == 'admin' && filteredShitjet.length > 0? 
                <Row className='d-flex flex-row flex-wrap justify-content-center' >
                    <Col style={{maxHeight:'400px' ,minHeight:'400px'}}>
                        <LineChartComponent dataFillimit={startDate} dataMbarimit={endDate} teDhenat={shitjet.map(sale => ({
                            ...sale,
                            dataTransaksionit: sale.dataShitjes, 
                            }))} lloji={'Shitjeve'} />
                    </Col>
                    <Col className='' style={{maxHeight:'400px' ,minHeight:'400px'}}>
                        <PieChartComponent teDhenat={shitjet} labels={['Shitje ne Dyqan', 'Shitje Online']} lloji = {'Shitjeve'} />
                    </Col>
                </Row> : ''}

            <ToastContainer />
            <ModalPerPyetje show={showModalPerPyetje} handleClose={handleCloseModalPerPyetje} handleConfirm={handleConfirmModal} />
            <ShtoPagese show={showShtoPagese} handleClose={() => setShowShtoPagese(false)} data={dataPerShtoPagese} />
        </Container>
    );
}
