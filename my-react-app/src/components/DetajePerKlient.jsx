import { useState, useEffect,useMemo, useContext } from 'react';
import { Container, Row, Col, Form, Spinner, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight,faTrashCan,faEye } from '@fortawesome/free-solid-svg-icons';
import AuthContext, { formatCurrency, formatLongDateToAlbanian, normalizoDaten } from '../components/AuthContext';
import AnimatedSpinner from './AnimatedSpinner';
import ModalPerPyetje from './ModalPerPyetje'
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';
import PerfomancaKlientit from './PerfomancaKlientit'
import DetajePerKlientCharts from './DetajePerKlientCharts';
import { useNavigate } from 'react-router-dom';
import NdryshoServisinPerfunduar from './NdryshoServisinPerfunduar';
export default function DetajePerKlient() {
    const navigate = useNavigate();
    const { subjektiID, lloji } = useParams();
    const [subjekti, setSubjekti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [buttonLoading,setButtonLoading] = useState(false)
    const [shitjet, setShitjet] = useState([]);
    const [blerjet, setBlerjet] = useState([]);
    const [serviset, setServiset] = useState([]);
    const [pagesat, setPagesat] = useState([]);
    const [activeShifra, setActiveShifra] = useState(null); 
    const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-01-01`);
    const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
    const [profiti, setProfiti] = useState([]); 
    const [combinedData, setCombinedData] = useState([]);
    const [totals, setTotals] = useState({
        totalTotaliPerPagese: 0,
        totalTotaliPageses: 0,
        totalMbetjaPerPagese: 0
      });
    const [dataPerAnulimPagese,setDataPerAnulimPagese] = useState()
    const [modalPerPyetje,setModalPerPyetje] = useState(false)
    const {authData} = useContext(AuthContext)
    const [pagesaAktiveOnline,setPagesaAktiveOnline] = useState()
    const [shifraSearch,setShifraSearch] = useState()
    const [totaliIPagesave,setTotaliIPagesave] = useState() // kjo osht mbledhja e pagesave ne tabelen pagesat per klient vetem
    const [paymentPercentage,setPaymentPercentage] = useState()
    const [totalsFormatiMujore,setTotalsFormatiMujor] = useState() //kjo i ndan pagesat qe jon ne muaj per klient vetem
    const [triggerReload,setTriggerReload] = useState(false)
    const showToast = useToast()

    const [modalNdryshoServisim,setModalNdryshoServisim] = useState(false)
    const [dataNdrshoServisim,setDataNdryshoServisim] = useState()
    
    useEffect(() => {
       
        
        fetchData();
    }, [subjektiID, lloji,triggerReload]); 
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const [subjektiData, shitjeData, blerjeData, servisiData, profitiResult, pagesaData,totalsFormatiMujorReceived] = await Promise.all([
                window.api.fetchTableSubjekti(lloji),
                window.api.fetchTableShitje(),
                window.api.fetchTableBlerje(),
                window.api.fetchTableServisi(),
                window.api.fetchTableQuery(`SELECT SUM(p.shuma) AS TotalProfiti FROM profiti p JOIN shitje s ON p.transaksioniID = s.transaksioniID WHERE s.subjektiID = ${subjektiID};`),
                window.api.fetchTablePagesa(),
                    window.api.fetchTableQuery(
                        `SELECT month, SUM(totaliBorgjit) AS totaliBorgjit,SUM(totaliPageses) as 'totaliPagesave'
                            FROM (
                                -- Borxhi nga shitjet
                                SELECT FORMAT(dataShitjes, 'yyyy-MM') AS month, 
                                    SUM(mbetjaPerPagese) AS totaliBorgjit,
                                    SUM(totaliPageses) AS totaliPageses
                                FROM shitje
                                WHERE subjektiID = ${subjektiID} AND transaksioniID IS NOT NULL
                                GROUP BY FORMAT(dataShitjes, 'yyyy-MM')

                                UNION ALL

                                -- Borxhi nga servisimi
                                SELECT FORMAT(dataPerfundimit, 'yyyy-MM') AS month, 
                                    SUM(mbetjaPageses) AS totaliBorgjit,
                                    SUM(totaliPageses) AS totaliPageses
                                FROM servisimi
                                WHERE subjektiID = ${subjektiID} AND dataPerfundimit IS NOT NULL
                                GROUP BY FORMAT(dataPerfundimit, 'yyyy-MM')
                            ) AS combined
                            GROUP BY month
                            ORDER BY month;`)
                ]);

           
            const filteredSubjekti = subjektiData.filter(item => item.subjektiID == subjektiID);
            const filteredShitjet = shitjeData.filter(item => item.subjektiID == subjektiID);
            const filteredBlerjet = blerjeData.filter(item => item.subjektiID == subjektiID);
            const filteredServiset = servisiData.filter(item => item.subjektiID == subjektiID);
            const filteredPagesa = pagesaData.filter(item => item.subjektiID == subjektiID);
            setTotalsFormatiMujor(totalsFormatiMujorReceived)

            let combined 

            if(lloji == 'klient') {
                combined = [...filteredShitjet, ...filteredServiset].map(item => ({
                    ...item,
                    mbetjaPerPagese: item.mbetjaPerPagese ?? item.mbetjaPageses
                })).sort((a, b) => new Date(a.dataShitjes || a.dataPerfundimit) - new Date(b.dataShitjes || b.dataPerfundimit));

                setTotaliIPagesave(filteredPagesa.reduce((total, pagesa) => total + pagesa.shumaPageses, 0));
        
            }else{
                combined = [...filteredBlerjet].map(item => ({
                    ...item,
                    mbetjaPerPagese: item.mbetjaPerPagese ?? item.mbetjaPageses
                })).sort((a, b) => new Date(a.dataShitjes || a.dataPerfundimit) - new Date(b.dataShitjes || b.dataPerfundimit));
        
            }
            const totals = combined.reduce((acc, item) => {
                acc.totalTotaliPerPagese += item.totaliPerPagese || 0;
                acc.totalTotaliPageses += item.totaliPageses || 0;
                acc.totalMbetjaPerPagese += item.mbetjaPerPagese || 0;
                return acc;
            }, { totalTotaliPerPagese: 0, totalTotaliPageses: 0, totalMbetjaPerPagese: 0 });

            setPaymentPercentage(calculatePaymentPercentage(totals.totalTotaliPerPagese,totals.totalTotaliPageses))
            // Update state
            setSubjekti(filteredSubjekti);
            setShitjet(filteredShitjet);
            setBlerjet(filteredBlerjet);
            setServiset(filteredServiset);
            setProfiti(profitiResult[0]?.TotalProfiti || 0);
            setPagesat(filteredPagesa);
            setCombinedData(combined);
            setTotals(totals);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTransaksionet = useMemo(() => {
        const data = lloji === 'klient' ? combinedData : blerjet;
    
        return data
            .filter(item => {
                const itemDate = new Date(item.dataShitjes || item.dataPerfundimit || item.dataBlerjes);
                return itemDate >= normalizoDaten(startDate) && itemDate <= normalizoDaten(endDate);
            })
            .filter(tr => shifraSearch ? tr.shifra.toLowerCase().includes(shifraSearch.toLowerCase()) : true);
    }, [lloji, combinedData, blerjet, startDate, endDate, shifraSearch]); 
    
    
    const calculatePaymentPercentage = (totaliPerPagese, totaliPageses) => {
        if (!totaliPerPagese || totaliPerPagese === 0) return 0; 
        return ((totaliPageses / totaliPerPagese) * 100).toFixed(2); 
      };
      

    useEffect(() => {
        window.api.fetchTablePagesa().then((receivedData) => {
            const filteredData = receivedData.filter((item) => item.subjektiID == subjektiID);
            setPagesat(filteredData);
            setLoading(false);
        });
    }, [subjektiID]);

    const handleStartDateChange = (e) => {
        setStartDate(e.target.value);
      };
    
      const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
      };

    const detajetEPagesave = (item) => {
        if(item.lloji == 'online'){
            setPagesaAktiveOnline(true)
        }else {
            setPagesaAktiveOnline(false)
        }
        if (activeShifra === item.shifra) {
            setActiveShifra(null); 
        } else {
            setActiveShifra(item.shifra); 
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center pt-5 mt-5">
                <AnimatedSpinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            </div>
        );
    }

    if (subjekti.length == 0) {
        return <h5 className="text-center text-danger mt-5">Nuk u gjet asnjë {lloji}!</h5>;
    }

    const deletePagesa = (item) =>{
        let llojiDokumentit
        if(item.shifra.startsWith('S-')){
            llojiDokumentit = 'servisimi'
        }else if(item.shifra.startsWith('SH')){
            llojiDokumentit = 'shitje'
        }else if(item.shifra.startsWith('B')){
            llojiDokumentit = 'blerje'
        }
        setDataPerAnulimPagese({
            ...item,
            llojiDokumentit,
            perdoruesiID:authData.perdoruesiID,
            nderrimiID:authData.nderrimiID
        })
        setModalPerPyetje(true)
    }
    const handleConfirmModal = async () => {
        setButtonLoading(true)

        try{

            await window.api.deletePagesa(dataPerAnulimPagese)
            showToast('Pagesa u Anulua me sukses!' , 'success')
            
        }catch(e){
            showToast('Pagesa nuk mund te Anulohet!' , 'error')
        }finally{
            setButtonLoading(false)
            setTriggerReload(!triggerReload)
        }
    }

    const shifraClick = (item) => {
        const lloji = getLloji(item.shifra)
        
        switch(lloji){
          case 'Shitje'  : navigate(`/ndryshoShitjen/${item.shitjeID}`)
              break;
          case 'Blerje' :  navigate(`/ndryshoBlerjen/${item.blerjeID}`)
              break;
          case 'Servisim':showServisimModal(item.servisimiID)
              break;
        }
      }

      const getLloji = (shifra) => {
        if(shifra.startsWith('SH-')) return 'Shitje'
        if(shifra.startsWith('B-')) return 'Blerje'
        if(shifra.startsWith('S-')) return 'Servisim'
    }

    const showServisimModal = async (id) => {
        try {
            const result = await window.api.fetchTableServisi();
            const data = result.find(item => item.servisimiID == id);
            
            if (!data) {
                showToast('Gabim: Nuk u gjet servisi me këtë ID', 'error');
                return; 
            }
    
            setDataNdryshoServisim(data);
            setModalNdryshoServisim(true); 
    
        } catch (error) {
            showToast('Gabim gjatë marrjes së të dhënave për ndryshim: ' + error, 'error');
        }
    };
    
  
      const handleConfirmNdryshoServisinPerfunduar =  () => {
        fetchData()
        setModalNdryshoServisim(false)
      }

    return (
        <Container fluid >
           <Row className='my-4'>
            <Col className='d-flex flex-row'>
                <Form.Group className='d-flex align-items-center me-3'>
                <Form.Label className='me-2 fw-bold'>{lloji == 'klient' ? 'Klienti:' : 'Furnitori:'}</Form.Label>
                <Form.Control type="text" value={subjekti[0].emertimi} disabled />
                </Form.Group>

                <Form.Group className='d-flex align-items-center'>
                <Form.Label className='me-2 fw-bold'>Kontakti:</Form.Label>
                <Form.Control type="number" value={subjekti[0].kontakti} disabled />
                </Form.Group>

                <OverlayTrigger placement="right" 
                    overlay={
                        <Tooltip id="tooltip-right">
                            Totali i Fitimit nga ky Klient eshte : {formatCurrency(profiti)} 
                        </Tooltip>
                    }
                >
                    <FontAwesomeIcon icon={faEye} style={{ cursor: 'pointer',opacity:0.03 }} />
                </OverlayTrigger>
            </Col>
            <Col>
                <PerfomancaKlientit totaliPerPagese = {totals.totalTotaliPerPagese} totaliPageses = {totals.totalTotaliPageses} lloji={lloji}/>
            </Col>
            <Col className='d-flex flex-column align-items-end'>
                <h4 className='px-3 mb-3'>Transaksionet brenda Periudhes:</h4>

                <Col className='d-flex flex-row'>
                <Form.Group className='mx-1'>
                    <Form.Control
                    type='date'
                    value={startDate}
                    onChange={handleStartDateChange}
                    />
                </Form.Group>

                <Form.Group className='mx-1'>
                    <Form.Control
                    type='date'
                    value={endDate}
                    onChange={handleEndDateChange}
                    />
                </Form.Group>
                </Col>
            </Col>
            </Row>

           
           
            <Row className='d-flex flex-column'>
                <Col lg={2} >
                    <Form.Control
                        type="text"
                        placeholder="Kërko sipas Shifres"
                        value={shifraSearch}
                        onChange={(e) => setShifraSearch(e.target.value)}
                    />
                </Col>
                <Col>
                        <div className=" my-3">
                            <div className="table-responsive tableHeight50">
                                <table className="table table-lg table-striped border table-hover text-center">
                                    <thead className="table-secondary">
                                        <tr className="fs-5">
                                            <th scope="col">Nr</th>
                                            <th scope="col">Shifra e {lloji == 'klient' ? 'Shitjes' : 'Blerjes'}</th>
                                            <th scope="col">Totali Per Pagese</th>
                                            <th scope="col">Totali Pageses</th>
                                            <th scope="col">Mbetja Per Pagese</th>
                                            <th scope="col">Data e {lloji == 'klient' ? 'Shitjes' : 'Blerjes'}</th>
                                            <th scope="col">Nr Pagesave</th>
                                            <th scope="col">Detaje</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-dark">
                                        {filteredTransaksionet.slice().reverse().map((item, index) => {
                                            const nrPagesave = item.totaliPageses === 0 ? 0 : pagesat.filter(pagesa => pagesa.shifra === item.shifra).length;
                                            return (
                                                <tr key={index}>
                                                    <th scope="row">{lloji == 'klient' ? combinedData.length - index :blerjet.length - index}</th>
                                                    <td>
                                                        <Button variant='' className='hover ' style={{color:'#24AD5D',fontSize:'15px'}} onClick={() => shifraClick(item)}
                                                            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
                                                            {item.shifra}
                                                        </Button>
                                                    </td>
                                                    <td>{formatCurrency(item.totaliPerPagese)}</td>
                                                    <td>{formatCurrency(item.totaliPageses)}</td>
                                                    <td className={item.mbetjaPerPagese > 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                                                        {formatCurrency(item.mbetjaPerPagese)}
                                                    </td> 
                                                    {lloji == 'klient' ?  
                                                    <td>{item.shifra.startsWith('SH') ? formatLongDateToAlbanian(item.dataShitjes) : formatLongDateToAlbanian(item.dataPerfundimit)}</td>
                                                    :  
                                                    <td>{new Date(item.dataBlerjes).toLocaleDateString()}</td>
                                                    }
                                                    <td className='fw-bold'>{nrPagesave}</td>
                                                    <td>
                                                        {nrPagesave > 0 && (
                                                            <FontAwesomeIcon 
                                                                className={`px-3 ${activeShifra === item.shifra ? 'text-primary' : 'text-secondary'}`}
                                                                onClick={() => detajetEPagesave(item)} 
                                                                icon={activeShifra === item.shifra ? faChevronDown : faChevronRight} 
                                                            />
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>

                                </table>
                            </div>
                        </div>
                </Col>
            </Row>

           {activeShifra ?
            <Row>
                    <hr/>

            <Col className='d-flex flex-column align-items-center'>
                    <div className='text-center'>
                        <h5>Pagesat e {activeShifra.startsWith('S-')  ? 'Servisit' : null} 
                            {activeShifra.startsWith('SH')  ? 'Shitjes' : null}
                            {activeShifra.startsWith('B')  ? 'Blerjes' : null} me Shifer: <span className='fs-3 fw-bold'>{activeShifra}</span></h5>
                    </div>
                    <div className="w-50 my-3">
                        <div className="table-responsive tableHeight50">
                            <table className="table table-sm table-striped border table-hover text-center">
                                <thead className="table-secondary">
                                    <tr className="fs-5">
                                        <th scope="col">Nr</th>
                                        <th scope="col">Vlera e Pageses</th>
                                        <th scope="col">Data e Pageses</th>
                                        <th scope="col">Menyra e Pageses</th>
                                        <th scope="col">Opsionet</th>
                                    </tr>
                                </thead>
                                <tbody className="border-dark">
                                {pagesat
                                    .slice()
                                    .reverse()
                                    .filter(item => item.shifra === activeShifra) 
                                    .map((item, index,filteredPagesat) => (
                                        <tr key={index}>
                                        <th scope="row">{filteredPagesat.length - index}</th>
                                        <td className="fw-bold">{formatCurrency(item.shumaPageses)}</td>
                                        <td>{formatLongDateToAlbanian(item.dataPageses)}</td>
                                        <td>{item.menyraPageses}</td>
                                        <td>
                                            <Button  variant='btn btn-outline-danger' disabled = {pagesaAktiveOnline} onClick={() => deletePagesa(item)}>
                                                <FontAwesomeIcon icon={faTrashCan}/>
                                            </Button>
                                        </td>
                                        </tr>
                                    ))}

                                </tbody>
                            </table>
                        </div>
                    </div>
                
            </Col>
            <hr/>

        </Row>
        :null}
    
        <Row >
            <Col className='d-flex flex-row m-5 pt-5 justify-content-center'>
                <Button variant='info' className='p-3 m-3 w-25 rounded fs-4'>Totali Per Pagese : <span className='fs-2'>{formatCurrency(totals.totalTotaliPerPagese)} </span></Button> 
               <Button variant='success' className='p-3 m-3 w-25 rounded fs-4'>Totali i Paguar :<span className='fs-2'>{formatCurrency(totals.totalTotaliPageses)}</span></Button>                     
               <Button variant='danger' className='p-3 m-3 w-25 rounded fs-4'>Mbetja per Pagese :<span className='fs-2'>{formatCurrency(totals.totalMbetjaPerPagese)}</span></Button> 
            </Col>                                           
        </Row>
        <Row>
        </Row>
        <ToastContainer />

        <Row>
            <DetajePerKlientCharts totals = {totals} nrTransaksioneve={combinedData.length} totalsFormatiMujore={totalsFormatiMujore} lloji = {lloji}/>
        </Row>
        <NdryshoServisinPerfunduar show={modalNdryshoServisim} handleClose={() => setModalNdryshoServisim(false)} data={dataNdrshoServisim} handleConfirm={handleConfirmNdryshoServisinPerfunduar}/>
        <ModalPerPyetje show={modalPerPyetje} handleClose={() => setModalPerPyetje(false)} handleConfirm={handleConfirmModal}/>
        </Container>
    );
}
