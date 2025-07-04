import { useState,useEffect, useContext,useMemo } from 'react'
import { Container,Row,Col,Button,Table,Form,Spinner, Badge } from 'react-bootstrap'
import KerkoSubjektin from './subjekti/KerkoSubjektin'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faEdit, faTrashCan,faCheckCircle, faTimesCircle,faEuroSign } from '@fortawesome/free-solid-svg-icons'; 
import ModalPerPyetje from './ModalPerPyetje'
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';
import UpdateServise from './UpdateServise'
import AuthContext, { formatCurrency } from "../components/AuthContext";
import NdryshoServisinPerfunduar from './NdryshoServisinPerfunduar';
import ShtoPagese from './ShtoPagese';
import AnimatedSpinner from './AnimatedSpinner';

export default function Serviset() {
    const [loading,setLoading] = useState(true)
    const [selectedSubjekti, setSelectedSubjekti] = useState({ emertimi: "", kontakti: "", subjektiID: null });
    const [serviset,setServiset] = useState([])
    const [filterServiset,setFilterServiset] = useState([])
    const [kontakti,setKontakti] = useState(selectedSubjekti.kontakti)
    const [komenti,setKomenti] = useState()
    const [aKaData,setAKaData] = useState(false)
    const [aKaAdapter,setAKaAdapter] = useState(false)
    const [aKaÇante,setAKaÇante] = useState(false)
    const [aKaGarancion,setAKaGarancion] = useState(false)
    const [shifraGarancionit,setShifraGarancionit] = useState('')
    const [modalPerPyetje,setModalPerPyetje] = useState(false)
    const [filterDataStart, setFilterDataStart] = useState(() => {
        const today = new Date();
        today.setDate(1); 
        return today.toISOString().split('T')[0]; 
      });
    const [filterDataEnd, setFilterDataEnd] = useState(new Date().toISOString().split('T')[0]);
    const [filterShifra, setFilterShifra] = useState('');
    const [filterSubjekti, setFilterSubjekti] = useState('');
    const [filterKontakti, setFilterKontakti] = useState('');
    const [filterStatusi, setFilterStatusi] = useState('Aktiv');
    const [modalPerUpdate,setModalPerUpdate] = useState(false)
    const [data,setData] = useState({})
    const [updateType,setUpdateType] = useState()
    const {authData,updateAuthData} = useContext(AuthContext)
    const [dataPerAnulim,setDataPerAnulim] = useState({idPerAnulim:0 ,shifra:"",statusi:"",totaliPerPagese:0,totaliPageses:0})
    const [ndryshoServisinPerfunduar,setNdryshoServisinPerfunduar] = useState(false)
    const [dataPerShtoPagese,setDataPerShtoPagese] = useState()
    const [showShtoPagese,setShowShtoPagese] = useState(false)
      const showToast = useToast();

    useEffect(() => {
        
        fetchData();
      }, []);

      const fetchData = async () => {
        setLoading(true);
        try {
          const receivedData = await window.api.fetchTableServisi();
          setServiset(receivedData);
          setFilterServiset(receivedData);
        } catch (error) {
          showToast('Error fetching data:'+ error,'error');
        } finally {
          setLoading(false); 
        }
      };
  

       const filteredServiset2 = useMemo(() => {
        // 1) normalize filters
        console.log('filterServiset',filterServiset)
        const statusFilter   = filterStatusi;
        const shifraFilter   = filterShifra ? filterShifra.toLowerCase() : null;
        const subjFilter     = filterSubjekti ? filterSubjekti.toLowerCase() : null;
        const kontaktFilter  = filterKontakti;
        
        const hasDateFilter  = filterDataStart && filterDataEnd;
        const startTs = hasDateFilter
          ? new Date(filterDataStart).setHours(0, 0, 0, 0)
          : null;
        const endTs   = hasDateFilter
          ? new Date(filterDataEnd).setHours(23, 59, 59, 999)
          : null;
        console.log('statusi useState',statusFilter)
        return filterServiset.filter(item => {
          if (statusFilter != null && item.statusi !== statusFilter) {
            console.log('Statusiiiii',item.statusi)
            return false;
          }
          if (shifraFilter && !item.shifra.toLowerCase().includes(shifraFilter)) {
            return false;
          }
          if (subjFilter && !item.subjekti.toLowerCase().includes(subjFilter)) {
            return false;
          }
          if (kontaktFilter && !item.kontakti.includes(kontaktFilter)) {
            return false;
          }
          if (hasDateFilter) {
            const itemTs = new Date(item.dataPranimit).setHours(0, 0, 0, 0);
            if (itemTs < startTs || itemTs > endTs) {
              return false;
            }
          }
          return true;
        });
      }, [
        serviset,
        filterStatusi,
        filterShifra,
        filterSubjekti,
        filterKontakti,
        filterDataStart,
        filterDataEnd
      ]);
    
    
    const handleSelectSubjekti = (result) => {
        setSelectedSubjekti({
          emertimi: result.emertimi,
          kontakti: result.kontakti,
          subjektiID: result.subjektiID,
        });
        setKontakti(result.kontakti)
      };
    
    const checkData = () => {
        if(selectedSubjekti.emertimi.length > 1){
            if(aKaGarancion){
                if(shifraGarancionit.length < 1) {
                    showToast('Duhet te shenoni shifren e garancionit!','warning')
                }else{
                    handleShtoServisin()
                }
            }else{
                handleShtoServisin()
            }
        }else{
            showToast('Selektoni subjektin per te vazhduar!','warning')
        }
    }

    const handleShtoServisin = async () => {
        let pajisjetPercjellese = ''

        {aKaData ? pajisjetPercjellese = 'Data/' : ''}
        {aKaAdapter ? pajisjetPercjellese += 'Adapter/' : ''}
        {aKaÇante ? pajisjetPercjellese += 'Çante' : ''}

            setLoading(true)
                const data ={
                    kontakti:kontakti,
                    komenti,
                    pajisjetPercjellese,
                    statusi:'Aktiv',
                    shifraGarancionit,
                    perdoruesiID:1,
                    nderrimiID:authData.nderrimiID,
                    subjektiID:selectedSubjekti.subjektiID
                }
                try {
                    const result = await window.api.insertServisi(data);
                    if (result.success) {
                        showToast('Servisi u Regjistrua me Sukses!', 'success'); 
                    } else {
                        showToast('Gabim gjate regjistrimit: ' + result.error,'error');
                    }
                  } catch (error) {
                    showToast('Gabim gjate komunikimit me server: ' + error.message,'error');
                  } finally {
                    setLoading(false);
                    fetchData();
                  }
    }

    const thirreModal = (item) => {
        setDataPerAnulim({
            idPerAnulim:item.servisimiID,
            shifra:item.shifra,
            statusi:item.statusi,
            transaksioniID:item.transaksioniID,
            totaliPerPagese:item.totaliPerPagese,
            totaliPageses:item.totaliPageses,
            menyraPagesesID:item.menyraPagesesID,
            perdoruesiID:authData.perdoruesiID
        })
        setModalPerPyetje(true)
    }

    const confirmModal = () => {
        deleteServisin()
    }

    const closeModalPerPyetje = () => {
        setModalPerPyetje(false)
    }

    const deleteServisin = async () => {
        try{
            
        const result = await window.api.deleteServisi(dataPerAnulim);

        if (result.success) {
            showToast(`Servisi u Anulua me Sukses !`, 'success');
        } else {
            showToast('Gabim gjate Anulimit: ' + result.error,'error');
        }
        }catch(e){
            showToast('Gabim gjate Anulimit: ' + e,'error');
        }finally{
            fetchData()
            updateAuthData({reloadLayout:!authData.reloadLayout})

        }
    }
    
    const handleShowUpdateModal = (data,type) => {
        setData(data)
        setUpdateType(type)
        if(type == 'Perfunduar'){
            setUpdateType('perfundo')
            setData({
                ...data,
                ndryshoServisinPerfunduar:true
            })
        }
        setModalPerUpdate(true)
    }
    const handleNdryshoServisinPerfunduar = (data) => {
        setData(data)
        setNdryshoServisinPerfunduar(true)
    }
    const closeModalPerUpdate = () => {
        setModalPerUpdate(false)
    }

    const hapeShtoPagese = (item) =>{
        setDataPerShtoPagese({
            ...item,
            llojiDokumentit:'servisimi',
            IDDokumentit:item.servisimiID,
            mbetjaPerPagese:item.mbetjaPageses
        })
        console.log('prejblej',dataPerShtoPagese)
        setShowShtoPagese(true)
    }

    const handleConfirmServisinPerfunduar = () => {
        fetchData()
    }

    const handleServisChange = () => {
        fetchData()
    }
  return (
    <Container fluid className='mt-5'>
        <Row className='bg-light border-bottom border-1 border-dark'>
            <Form className=" rounded-3 ">
                <h4 className="text-center mb-3 fw-bold border-bottom">Prano Servisin:</h4>
            
                <Col className="d-flex flex-row justify-content-start mb-2">
                    <Form.Group className="me-3" >
                        <Form.Label className="fw-bold">Klienti</Form.Label>
                        <KerkoSubjektin
                            filter="klient"
                            value={selectedSubjekti.emertimi}
                            onSelect={handleSelectSubjekti}
                            className="form-control form-control-lg bg-dark"
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label className="fw-bold">Kontakti</Form.Label>
                        <Form.Control
                            type="number"
                            value={kontakti} onChange={(e) => setKontakti(e.target.value)}
                            className="form-control form-control-lg"
                        />
                    </Form.Group>
                    <Form.Group className="ms-3" style={{ flex: 0.5 }}>
                        <Form.Label className="fw-bold">Data</Form.Label>
                        <Form.Check className="fs-4 text-info" checked={aKaData} onClick={() => setAKaData(!aKaData)}/>
                    </Form.Group>

                    <Form.Group className="ms-3" style={{ flex: 0.5 }}>
                        <Form.Label className="fw-bold">Adapter</Form.Label>
                        <Form.Check className="fs-4 text-info" checked={aKaAdapter} onClick={() => setAKaAdapter(!aKaAdapter)}/>
                    </Form.Group>

                    <Form.Group className="ms-3" style={{ flex: 0.5 }}>
                        <Form.Label className="fw-bold">Çantë</Form.Label>
                        <Form.Check className="fs-4 text-info" checked={aKaÇante} onClick={() => setAKaÇante(!aKaÇante)}/>
                    </Form.Group>

                    <Form.Group className="ms-3" style={{ flex: 0.5 }}>
                        <Form.Label className="fw-bold">Garancion:</Form.Label>
                        <Form.Check className="fs-4 text-info" checked={aKaGarancion} onClick={() => setAKaGarancion(!aKaGarancion)}/>
                        {aKaGarancion && <Form.Control type='text' className='mt-3'                             onChange={(e) => setShifraGarancionit(e.target.value)}
                        placeholder='Shifren e Garancionit...'/>}
                    </Form.Group>
                </Col>

                <Col className="d-flex flex-row justify-content-between">
                    <Form.Group >
                        <Form.Label className="fw-bold ">Komenti:</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            className="form-control-lg"
                            placeholder="Shto komente për servisin..."
                            onChange={(e) => setKomenti(e.target.value)}
                        />
                    </Form.Group>
                    <Button variant="success" className='fs-5 h-25 m-5 p-3' onClick={() => checkData()} disabled={loading}>
                    {loading ? (
                        <>
                        <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                        />{' '}
                        Duke ruajtur...
                        </>
                    ) : (
                        'Shto Servisin...'
                    )}
                </Button>
                    
                </Col>

                
            </Form>
        </Row>

        <Row className="mt-4">
                <Form className="p-3 bg-light rounded">
                    <Row>
                        <Col>
                            <Form.Group>
                                <Form.Label>Periudha Kohore</Form.Label>
                                <Form.Control className='mb-1'
                                    type="date"
                                    value={filterDataStart}
                                    readOnly = {authData.aKaUser != 'admin'}
                                    onChange={(e) => {authData.aKaUser == 'admin' ? setFilterDataStart(e.target.value) : null}}
                                />
                                <Form.Control
                                    type="date"
                                    value={filterDataEnd}
                                    readOnly = {authData.aKaUser != 'admin'}
                                    onChange={(e) => {authData.aKaUser == 'admin' ? setFilterDataEnd(e.target.value) : null}}
                                />
                            </Form.Group>                          
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Shifra</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={filterShifra}
                                    placeholder="Shifra..."
                                    onChange={(e) => setFilterShifra(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Subjekti</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={filterSubjekti}
                                    placeholder="Subjekti..."
                                    onChange={(e) => setFilterSubjekti(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Kontakti</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={filterKontakti}
                                    placeholder="Kontakti..."
                                    onChange={(e) => setFilterKontakti(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                               <Form.Label>Statusi</Form.Label>
                                    <div
                                    onClick={() => setFilterStatusi(filterStatusi == 'Aktiv' ? 'Perfunduar' : 'Aktiv')} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: filterStatusi === 'Aktiv'  ? '#24AD5D' : '#d9534f',
                                        color: '#fff',
                                        padding: '8px 20px',
                                        borderRadius: '25px',
                                        fontWeight: '500',
                                        fontSize: '0.9rem',
                                        transition: 'background-color 0.3s',
                                        gap: '10px', }}
                                    >
                                    <FontAwesomeIcon icon={filterStatusi ? faCheckCircle : faTimesCircle} />
                                    <span>{filterStatusi === 'Aktiv' ? 'Aktiv' : 'Perfunduar'}</span>
                                    </div>
                            </Form.Group>
                        </Col>
                    </Row>
                </Form>
            </Row>

        <Row className='mt-5'>
            <div className="table-responsive tableHeight50 mb-5">
            <Table striped bordered hover >
                <thead>
                <tr className='fs-5 '>
                    <th scope="col">Nr</th>
                    <th scope="col">Shifra</th>
                    <th scope="col">Subjekti</th>
                    <th scope="col">Kontakti</th>
                    <th scope="col">Komenti</th>
                    <th scope="col">Pajisjet Percjellese</th>
                    {filterStatusi != 'Aktiv' ? <><th scope="col">Totali per Pagese</th>
                        <th scope="col">Mbetja per Pagese</th></>:null}
                    <th scope="col">Data dhe Ora e Pranimit</th>
                    {filterStatusi == 'Aktiv' ? null : <th scope="col">Data e Perfundimit</th>}
                    <th scope="col">Perdoruesi</th>
                    <th scope="col">Statusi</th>
                    <th scope="col">Garancioni</th>
                    <th scope="col">Opsionet</th>
                </tr>
                </thead>
                <tbody className='text-nowrap'>
                {loading ? <AnimatedSpinner/> : <>
                    {filteredServiset2?.length > 0 ? <>
                        {filteredServiset2.slice().reverse().map((item, index) => (
                            <tr key={index}>
                                {item.transaksioniID != 0 ? (
                                <>
                                    <th scope="row">{filteredServiset2.length - index}</th>
                                    <td>{item.shifra}</td>
                                    <td>{item.subjekti}</td>
                                    <td>{item.kontakti}</td>
                                    <td>{item.komenti}</td>
                                    <td>{item.pajisjetPercjellese}</td>
                                    {filterStatusi != 'Aktiv' ? 
                                    <>
                                        <td>{item.totaliPerPagese == null ? null : item.totaliPerPagese.toFixed(2)}€</td>
                                        <td><Badge bg={item.mbetjaPageses > 0 ? 'danger' : 'success'} pill>{formatCurrency(item.mbetjaPageses)}</Badge></td>
                                    </>:null}
                                    <td>{item.dataPranimit.toLocaleDateString()}<br/>{item.dataPranimit.toLocaleTimeString()}</td>
                                    {filterStatusi != 'Aktiv' ? 
                                    <>
                                    {item.dataPerfundimit != null ? <td>{item.dataPerfundimit.toLocaleDateString()}<br/>{item.dataPerfundimit.toLocaleTimeString()}</td> : null}
                                    </>:null}
                                    <td>{item.perdoruesi}</td>
                                    <td className={item.statusi == 'Perfunduar' ? 'text-success fw-bold' : 'fw-bold text-danger'}>{item.statusi}</td>
                                    <td>{item.shifraGarancionit}</td>
                                    <td>

                                    {item.statusi == 'Perfunduar' ?
                                            <>
                                            <Button variant='btn btn-outline-primary' className='mx-1' onClick={() => handleNdryshoServisinPerfunduar(item)}>
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </Button>
                                                <Button variant='btn btn-outline-success' className='mx-1' onClick={() => hapeShtoPagese(item)} disabled={item.mbetjaPageses == 0 }>
                                                    <FontAwesomeIcon  icon={faEuroSign} />
                                                </Button>
                                            </>: null}

                                        
                                            
                                        {item.statusi == 'Aktiv' ?
                                            <>
                                            <Button variant='btn btn-outline-primary' className='mx-1' onClick={() => handleShowUpdateModal(item,item.statusi)}>
                                                    <FontAwesomeIcon icon={faEdit} />
                                                </Button>
                                                <Button variant='btn btn-outline-success' className='mx-1' onClick={() => handleShowUpdateModal(item,'perfundo')}>
                                                    <FontAwesomeIcon  icon={faCheck} />
                                                </Button>
                                            </>: null}
                                            <Button variant='btn btn-outline-danger' className='mx-1' onClick={() => thirreModal(item)}>
                                                    <FontAwesomeIcon  icon={faTrashCan} />
                                                </Button>
                                    </td>
                                    </>
                                ) : null}
                            </tr>
                            ))}
                    </> : <td colSpan={14}><h5 className='text-center'>Nuk ka te dhena per tu shfaqur!</h5></td>}
                </>}

                </tbody>
            </Table>
            </div>
        </Row>
        <ToastContainer />
        <ModalPerPyetje show={modalPerPyetje} handleClose={closeModalPerPyetje} handleConfirm={confirmModal} />
        <UpdateServise show={modalPerUpdate} handleClose={closeModalPerUpdate} updateType={updateType} data = {data} handleConfirm={handleServisChange}/>
        <NdryshoServisinPerfunduar show={ndryshoServisinPerfunduar} handleClose={() => setNdryshoServisinPerfunduar(false)} data={data} handleConfirm={handleConfirmServisinPerfunduar}/>
        <ShtoPagese show={showShtoPagese} handleClose={() => setShowShtoPagese(false)} data={dataPerShtoPagese} />

    </Container>
  )
  
}
