import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Button, Table, Modal, Form, Spinner, Card, Toast,InputGroup,Alert, FormControl} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faEdit, faTrashCan,faUmbrellaBeach,faGift, faCoins,faTriangleExclamation,faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import AnimatedSpinner from '../AnimatedSpinner';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import ModalPerPyetje from '../ModalPerPyetje'
import MenyratPagesesExport from '../MenyratPagesesExport';
import AuthContext , {formatCurrency, normalizoDaten} from '../AuthContext';
import { set } from 'lodash';
import { useTranslation } from 'react-i18next';
export default function DetajePunonjes({punonjesID,emri,mbiemri,defaultPaga}) {
    const [loading, setLoading] = useState(true);
    const [showData,setShowData] = useState(null)
    const [pushimet, setPushimet] = useState([]);
    const [bonuset, setBonuset] = useState([]);
    const [pagat, setPagat] = useState([]);
    const [filteredPushimet, setFilteredPushimet] = useState([]);
    const [filteredBonuset, setFilteredBonuset] = useState([]);
    const [filteredPagat, setFilteredPagat] = useState([]);
    const [bonusetNeDetaje, setBonusetNeDetaje] = useState([]);
    const [bonusetPerPunonjes, setBonusetPerPunonjes] = useState([]);
    const [buttonLoading,setButtonLoading] = useState(false)
    const [modalPerBonuset,setModalPerBonuse] = useState(false)
    const [totalBonuset,setTotalBonuset] = useState()
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);
    const [muaji,setMuaji] = useState(new Date().getMonth()+1)
    const [muajiEmertim,setMuajiEmertim] = useState()
    const [viti,setViti] = useState(currentYear)
    const [activeSalary,setActiveSalary] = useState([])
    const [ndryshoModal,setNdryshoModal] = useState(false)
    const [showModalPerPyetje,setShowModalPerPyetje] = useState(false)
    const [pageseRroge,setPageseRroge] = useState(false)
    const [selectedMenyraPageses,setSelectedMenyraPageses] = useState(null)
    const [modalPerPushime,setModalPerPushime] = useState(false)
    const [idPerPerdorim,setIdPerPerdorim] = useState()
    const [perNdryshim,setPerNdryshim] = useState()
    const [dataPerPushim,setDataPerPushim] = useState({dataFillimit:'',dataMbarimit:'',nrDiteve:'',lloji:'',arsyeja:''})
    const {authData,updateAuthData} = useContext(AuthContext)
    const [startDate, setStartDate] = useState();
    const [endDate, setEndDate] = useState();
    const [triggerReload, setTriggerReload] = useState(false);
    const [dataPunesimit,setDataPunesimit] = useState()
    const showToast = useToast()
    const {t} = useTranslation('administrimi')
    const albanianMonths = [
        "Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor",
        "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor"
      ];

    useEffect(() => {
        fetchData();
    }, [punonjesID,triggerReload]);

    const fetchData = async () => {
        try {
            const fetchedPushimet = await window.api.fetchTablePushimet();
            const fetchedBonuset = await window.api.fetchTableBonuset();
            const fetchedPaga = await window.api.fetchTablePagat();
            const fetchedBonusetNeDetaje = await window.api.fetchTableQuery(`
                SELECT b.bonusetID,  b.dataBonuseve,  b.shuma,  bp.dataPageses,  bp.menyraPagesesID,  bp.punonjesiID,  bp.statusi, bp.shifra,bp.transaksioniID,  m.emertimi 
            FROM bonuset b
            JOIN bonusetPunonjesit bp ON bp.bonusetID = b.bonusetID
            LEFT JOIN menyraPageses m ON m.menyraPagesesID = bp.menyraPagesesID
            `)
            const dataPunonjesit = await window.api.fetchTableQuery(`
                SELECT dataPunësimit from punonjesit where punonjesID = ${punonjesID}
            `)
            if(dataPunonjesit.length > 0){
                setDataPunesimit(dataPunonjesit[0].dataPunësimit)
            }
            setPushimet(fetchedPushimet.filter(item => punonjesID == item.punonjesID));
            setBonuset(fetchedBonuset);
            setPagat(fetchedPaga.filter(item => punonjesID == item.punonjesID));
            setFilteredPushimet(fetchedPushimet.filter(item => punonjesID == item.punonjesID));
            setFilteredPagat(fetchedPaga.filter(item => punonjesID == item.punonjesID));
            setBonusetNeDetaje(fetchedBonusetNeDetaje)
            setFilteredBonuset(fetchedBonusetNeDetaje);
            setStartDate(`${new Date().getFullYear()}-01-01`)
            setEndDate(new Date().toISOString().substring(0, 10))
        } catch (error) {
            console.log(error)
        }finally{
            setLoading(false);
        }
        
    };

    useEffect(() => {
        const total = bonusetPerPunonjes.reduce((acc, item) => acc + item.shuma, 0);
        setTotalBonuset(total);
    }, [bonusetPerPunonjes]);

    useEffect(() => {
        setShowData(null)
    }, [punonjesID]);

    useEffect(() => { //per filtrim te bonuseve,pagave,pushimeve ne baz te dates
        const normalizedStart = normalizoDaten(startDate)
        const normalizedEnd = normalizoDaten(endDate)

        const pagatFiltered = pagat.filter(paga => {
            const pagaDate = normalizoDaten(new Date(paga.dataPageses)) 
            
            return pagaDate >= normalizedStart && pagaDate <= normalizedEnd;
        });
       setFilteredPagat(pagatFiltered)
        const bonusetFiltered = bonusetNeDetaje.filter(bonusi => {
            const pagaDate = normalizoDaten( new Date(bonusi.dataPageses)); 
        
            return pagaDate >= normalizedStart && pagaDate <= normalizedEnd;
        })
        setFilteredBonuset(bonusetFiltered)

       const pushimetFiltered = pushimet.filter(pushim => {
        const pushimStart = normalizoDaten(new Date(pushim.dataFillimit));
        const pushimEnd = normalizoDaten(new Date(pushim.dataMbarimit));
       
    
    
        return pushimStart <= normalizedEnd && pushimEnd >= normalizedStart;
    });
    
        setFilteredPushimet(pushimetFiltered)
    },[startDate,endDate])

      const updateMenyraPageses = (menyraPageses) => {
        setSelectedMenyraPageses(menyraPageses);
      };

      const emptyActiveSalary = () => {
        setActiveSalary(null)
      }

      const handleActiveSalaryChange = (event) => {
        const { name, value } = event.target;
        setActiveSalary({
            ...activeSalary,
            [name]: value
        });
      }

     const setDataPerPageseRroge = () => {
        setActiveSalary({
            dataPageses: new Date().toISOString().split('T')[0],
            paga:defaultPaga,
            bonusi : 0,
            zbritje : 0
        })
        setPageseRroge(true)
        setNdryshoModal(true)
        setSelectedMenyraPageses(null)
      }

    const handleShowData = (element) => {
        setShowData((prevData) => (prevData === element ? null : element));
      };

      const formatLongDateToAlbanian = (dateString) => {
        const date = new Date(dateString);  
        const day = date.getDate()    
        const month = albanianMonths[date.getMonth()];
        const year = date.getFullYear();
        
        return `${day}-${month}-${year}`;
      };
    

      const ndryshoRrogen = async () => {
        setButtonLoading(true);
        const data = {
            ...activeSalary,
            menyraPagesesID:selectedMenyraPageses.menyraPagesesID,
            perdoruesiID:authData.perdoruesiID,
            nderrimiID:authData.nderrimiID,
            shifra: activeSalary.shifra,
        }   

          try {
                await window.api.ndryshoPagen(data);
                showToast(t('Paga u Ndryshua!') , 'success')
          } catch (error) {
                showToast(t('Paga nuk mund te Ndryshohet') + error , 'error')
          } finally {
                setNdryshoModal(false)
              setButtonLoading(false);
              setTriggerReload(!triggerReload)
              updateAuthData({reloadLayout:!authData.reloadLayout})

            }
      }

      const handleConfirm = async () => {
            try{
                const data = {
                    pagaID:activeSalary.pagaID,
                    perdoruesiID:authData.perdoruesiID,
                    shifra:activeSalary.shifra,
                    emri:activeSalary.emri,
                }
              await window.api.fshijePagen(data)
              showToast(t('Paga u Anulua me Sukses!') , 'success')
             
          } catch (error) {
            showToast(t('Paga nuk mund te Anulohet!') + error , 'error')
          } finally {
              setButtonLoading(false);
              setTriggerReload(!triggerReload)
              updateAuthData({reloadLayout:!authData.reloadLayout})

          }
          
      }

      const paguajRrogen = async () => {
        try{
            const data = {
                ...activeSalary,
                punonjesID,
                menyraPagesesID:selectedMenyraPageses.menyraPagesesID,
                nderrimiID:authData.nderrimiID,
                perdoruesiID:authData.perdoruesiID,
                emriPunonjesit:emri,
                mbiemriPunonjesit:mbiemri,
            }  

          await window.api.paguajPagen(data)
          showToast(t('Paga u Pagua me Sukses!') , 'success')
          
      } catch (error) {
          showToast(t('Paga nuk mund te Paguhet!') + error , 'error')
      } finally {
          setButtonLoading(false);
          setNdryshoModal(false)
          setTriggerReload(!triggerReload)
          updateAuthData({reloadLayout:!authData.reloadLayout})

      }
      
  }

    function isWithin30Days(mssqlDate) {
        const inputDate = new Date(mssqlDate); 
        const currentDate = new Date();
    
        const diffInMs = currentDate - inputDate;
        
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
        return diffInDays <= 30;
    }

    useEffect(() => {
        if (modalPerBonuset) {
            kalkuloBonusetPerPunonjes();
        }
    }, [muaji, viti, modalPerBonuset]); 
    
    const kalkuloBonusetPerPunonjes = () => {
        setSelectedMenyraPageses(null);
        setMuajiEmertim(albanianMonths[muaji - 1]); 
        
        const bonusetPerPunonjes = [];
        bonuset.forEach(bonusi => {
            const matchingBonusInPunonjesit = bonusetNeDetaje.find(bonusDetaj => 
                bonusDetaj.bonusetID === bonusi.bonusetID && bonusDetaj.punonjesiID === punonjesID && bonusDetaj.statusi === 1 
            );
            if (!matchingBonusInPunonjesit) {
                const bonusDate = new Date(bonusi.dataBonuseve);
                const bonusMonth = bonusDate.getMonth() + 1; 
                const bonusYear = bonusDate.getFullYear();
                if (bonusMonth == muaji && bonusYear == viti && bonusi.dataBonuseve > dataPunesimit) {
                    bonusetPerPunonjes.push({
                        ...bonusi, 
                    });
                }
            }
        });
    
        setBonusetPerPunonjes(bonusetPerPunonjes);
        setModalPerBonuse(true);
    };

    const paguajBonuset = async () => {
        setButtonLoading(true)
        const data = {
            punonjesiID:punonjesID,
            menyraPagesesID:selectedMenyraPageses.menyraPagesesID,
            bonusetPerPunonjes,
            totalBonuset,
            perdoruesiID:authData.perdoruesiID,
            nderrimiID:authData.nderrimiID
        }
        try{
            await window.api.paguajBonuset(data)
            showToast(t('Bonuset u Paguan me Sukses!') , 'success')
        }catch(error){
            showToast(t('Bonuset nuk mund te Paguhen!') + error , 'error')
        }finally{
            setModalPerBonuse(false)
            setButtonLoading(false)
            setTriggerReload(!triggerReload)
            updateAuthData({reloadLayout:!authData.reloadLayout})

        }
    }

    const handleAnuloBonusin = async (id,shumaPageses,menyraPagesesID) => {
        const data = {
            transaksioniID:id,
            shumaPageses,
            punonjesID,
            menyraPagesesID,
            emriPunonjesit:emri,
            mbiemriPunonjesit:mbiemri,
            perdoruesiID:authData.perdoruesiID,
        }
        try{
            await window.api.anuloBonusin(data)
            showToast(t('Bonusi u Anulua me Sukses!') , 'success')
        }catch(error){
            showToast(t('Bonusi nuk mund te Anulohet!') + error , 'error')
            console.log(error)
        }finally{
            setTriggerReload(!triggerReload)
            updateAuthData({reloadLayout:!authData.reloadLayout})

        }
    }

    const dataPerPushimChange = (event) => {
        const { name, value } = event.target;
        setDataPerPushim({
            ...dataPerPushim,
            [name]: value,
            punonjesID:punonjesID
        });
    }


    const addDays = (dateStr, days) => {
        const date = new Date(dateStr);
        date.setDate(date.getDate() + parseInt(days, 10));
        return date.toISOString().split('T')[0]; 
    };

     useEffect(() => {
            if (dataPerPushim.dataFillimit && dataPerPushim.nrDiteve) {
                const calculatedEndDate = addDays(dataPerPushim.dataFillimit, dataPerPushim.nrDiteve);
                setDataPerPushim({
                    ...dataPerPushim,
                    dataMbarimit:calculatedEndDate
                });
            }
        
     },[dataPerPushim.nrDiteve])

     useEffect(() => {      
                if (dataPerPushim.dataFillimit && dataPerPushim.dataMbarimit) {
                const startDate = new Date(dataPerPushim.dataFillimit);
                const endDate = new Date(dataPerPushim.dataMbarimit);
                const timeDiff = endDate.getTime() - startDate.getTime();
                const calculatedDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                setDataPerPushim({
                    ...dataPerPushim,
                    nrDiteve:calculatedDays
                })
            }
    
    },[dataPerPushim.dataMbarimit])

    useEffect(() => {      
        if (dataPerPushim.dataMbarimit && dataPerPushim.nrDiteve) {

        const startDate = new Date(dataPerPushim.dataFillimit);
        const endDate = new Date(dataPerPushim.dataMbarimit);
        const timeDiff = endDate.getTime() - startDate.getTime();
        const calculatedDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        setDataPerPushim({
            ...dataPerPushim,
            nrDiteve:calculatedDays
        })
    }

},[dataPerPushim.dataFillimit])

    const handleShtoPushimin = async () => {
        setButtonLoading(true)
        if(dataPerPushim){
            try{
                const data = {
                    ...dataPerPushim,
                    perdoruesiID:authData.perdoruesiID,
                    nderrimiID:authData.nderrimiID
                }
                await window.api.shtoPushimin(data)
                showToast(t('Pushimi u Shtua me Sukses!') , 'success')
            }catch(error){
                showToast(t('Pushimi nuk mund te Shtohet!') + error , 'error')
            }finally{
                setModalPerPushime(false)
                setButtonLoading(false)
                setTriggerReload(!triggerReload)
                updateAuthData({reloadLayout:!authData.reloadLayout})

            }
        }
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
    
        return `${year}-${month}-${day}`;
    }

    const openModalNdryshoPushimin = (pushimi) => {
        setPerNdryshim(true)
        pushimi.dataFillimit = formatDate(pushimi.dataFillimit)
        pushimi.dataMbarimit = formatDate(pushimi.dataMbarimit)
        setDataPerPushim(pushimi)
        setModalPerPushime(true)
    }

    const handleNdryshoPushimin = async () => {
        setButtonLoading(true)
        if(dataPerPushim){
            try{
                const data = {
                    ...dataPerPushim,
                    perdoruesiID:authData.perdoruesiID,
                    nderrimiID:authData.nderrimiID,
                    emri,
                    mbiemri
                }
                await window.api.ndryshoPushimin(data)
                showToast(t('Pushimi u Ndryshua me Sukses!') , 'success')
            }catch(error){
                showToast(t('Pushimi nuk mund te Ndryshohet!') + error , 'error')
            }finally{
                setModalPerPushime(false)
                setButtonLoading(false)
                setTriggerReload(!triggerReload)
                updateAuthData({reloadLayout:!authData.reloadLayout})

            }
        }
    }

    const handlePushimiDelete = async (pushimi) => {
        try{
            const data = {
                ...pushimi,
                perdoruesiID:authData.perdoruesiID,
                nderrimiID:authData.nderrimiID,
                emri,
                mbiemri
            }
            await window.api.deletePushimi(data)
            showToast(t('Pushimi u Anulua me Sukses!') , 'success')
        }catch(error){
            showToast(t('Pushimi nuk mund te Anulohet!') + error , 'error')
        }finally{
            setTriggerReload(!triggerReload)
            updateAuthData({reloadLayout:!authData.reloadLayout})

        }
    }
    return (
        <Container className="py-5">
            <Row className='text-center mb-4 d-flex flex-row justify-content-center'>
                <Col>
                    <h4 className="text-center mb-4">{t('Menaxho Punonjësin:')} 
                        <span className='d-inline fw-bold fs-5 border-bottom border-1 border-dark mx-1'>{emri}</span>
                    </h4>
                </Col>
                <Col className='d-flex'>
                    <h5 className='m-2'>{t('Ne Periudhen')}: </h5>
                    <Form.Group className='mx-1'>
                    <Form.Control
                    type='date'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className='mx-1'>
                    <Form.Control
                    type='date'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    />
                </Form.Group>
                </Col>
            </Row>
            {loading ? (
                <AnimatedSpinner/>
            ) : (
                <>
                    <Row className="mb-4">
                        <Col className="text-center">        
                            <Button variant="primary" className="mx-2" onClick={() => handleShowData('r')} >
                                <FontAwesomeIcon icon={faCoins} className='text-warning'/> {t('Menaxho Pagen')}
                            </Button>
                            <Button variant="primary" className="mx-2" onClick={() => handleShowData('b')} >
                                <FontAwesomeIcon icon={faGift} className='text-info'/> {t('Menaxho Bonuset')}   
                            </Button>
                            <Button variant="primary" className="mx-2" onClick={() => handleShowData('p')}>
                                <FontAwesomeIcon icon={faUmbrellaBeach} /> {t('Menaxho Pushimet')}
                            </Button>
                        </Col>
                    </Row>

                    {showData == 'r' ? <Row>
                        <Col>
                            <Card className="mb-4 shadow">
                                <Card.Body>
                                    <Card.Title className='fs-3 pb-2'>{t('Menaxho Pagen')}:</Card.Title>
                                    <div className='tableHeight50'>
                                        <Table striped bordered hover variant="light">
                                            <thead>
                                                <tr>
                                                    <th>{t('Nr.')}</th>
                                                    <th>{t('Data Pageses')}</th>
                                                    <th>{t('Paga')}</th>
                                                    <th>{t('Bonusi')}</th>
                                                    <th>{t('Zbritje')}</th>
                                                    <th>{t('Menyra e Pageses')}</th>
                                                    <th>{t('Veprime')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPagat.slice().reverse().map((paga, index) => (
                                                    <tr key={index}>
                                                        <td>{pagat.length -index}</td>
                                                        <td>{formatLongDateToAlbanian(paga.dataPageses)} / {paga.dataPageses.toLocaleTimeString() } </td>
                                                        <td>{formatCurrency(paga.paga)}</td>
                                                        <td>{formatCurrency(paga.bonusi)}</td>
                                                        <td>{formatCurrency(paga.zbritje)}</td>
                                                        <td>{paga.menyraPageses}</td>
                                                        <td>
                                                            <Button variant="outline-primary" className='mx-1' disabled = {!isWithin30Days(paga.dataPageses)} onClick={() => {setSelectedMenyraPageses(null);setPageseRroge(false);emptyActiveSalary();setActiveSalary(paga);setNdryshoModal(true)}}>
                                                                <FontAwesomeIcon icon={faEdit} /> {t('Ndrysho')}
                                                            </Button>
                                                            <Button variant="outline-danger" className='mx-1' onClick={() => {emptyActiveSalary();setActiveSalary(paga);setShowModalPerPyetje(true)}}>
                                                                <FontAwesomeIcon icon={faTrashCan} /> {t('Anulo')}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                    <Alert variant="warning" className="d-flex align-items-center mt-3">
                                        <FontAwesomeIcon icon={faTriangleExclamation} size={20} className="me-2" />
                                        <span>
                                            <strong>{t('Kujdes!')}</strong> {t('Pagat me te vjetra se 30 Dite nuk mund te ndryshohen!')}
                                        </span>
                                    </Alert>
                                </Card.Body>
                                <Card.Footer>
                                    <Button variant="outline-success" className='float-end' onClick={() => setDataPerPageseRroge()}>
                                        <FontAwesomeIcon icon={faCoins} className="text-warning" /> {t('Paguaj Rrogen')}
                                    </Button>
                                </Card.Footer>
                            </Card>

                        </Col>
                    </Row>:null}

                   {showData == 'p' ?  <Row>
                        <Col>
                            <Card className="mb-4 shadow">
                                <Card.Body>
                                <Card.Title className='fs-3 pb-2'>{t('Menaxho Pushimet')}:</Card.Title>
                                    <div className='tableHeight50'>
                                        <Table striped bordered hover variant="light">
                                                <thead>
                                                    <tr>
                                                        <th>{t('Nr.')}</th>
                                                        <th>{t('Data Fillimit')}</th>
                                                        <th>{t('Nr. Diteve')}</th>
                                                        <th>{t('Data Mbarimit')}</th>
                                                        <th>{t('Lloji')}</th>
                                                        <th>{t('Arsyeja')}</th>
                                                        <th>{t('Veprime')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredPushimet.slice().reverse().map((pushimi, index) => (
                                                        <tr key={index}>
                                                            <td>{pushimet.length - index}</td>
                                                            <td>{formatLongDateToAlbanian(pushimi.dataFillimit)}</td>
                                                            <td>{pushimi.nrDiteve}</td>
                                                            <td>{formatLongDateToAlbanian(pushimi.dataMbarimit)}</td>
                                                            <td>{pushimi.lloji}</td>
                                                            <td>{pushimi.arsyeja}</td>
                                                            <td>
                                                                <Button variant="outline-primary" className='mx-1' onClick={() => openModalNdryshoPushimin(pushimi)}>
                                                                    <FontAwesomeIcon icon={faEdit} /> {t('Ndrysho')}
                                                                </Button>
                                                                <Button variant="outline-danger" className='mx-1' onClick={() => handlePushimiDelete(pushimi)}>
                                                                    <FontAwesomeIcon icon={faTrashCan} /> {t('Anulo')}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                        </Table>
                                    </div>
                                    
                                </Card.Body>
                                <Card.Footer>
                                    <Button variant='outline-success' className='float-end' onClick={() => {
                                        const tomorrow = new Date();
                                        tomorrow.setDate(tomorrow.getDate() + 1);

                                        setDataPerPushim(prevState => ({
                                            ...prevState, 
                                            dataFillimit: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
                                          }));setDataPerPushim(prevState => ({
                                            ...prevState, 
                                            dataMbarimit: tomorrow.toISOString().split('T')[0] // Format: YYYY-MM-DD
                                          }));setModalPerPushime(true)}}><FontAwesomeIcon icon={faUmbrellaBeach} /> {t('Shto Nje Pushim')}</Button>
                                </Card.Footer>
                            </Card>
                        </Col>
                    </Row>:null}

                   {showData == 'b'?  <Row>
                        <Col>
                            <Card className="mb-4 shadow">
                                <Card.Body>
                                <Card.Title className='fs-3 pb-2'>{t('Menaxho Bonuset')}:</Card.Title>
                                {filteredBonuset && 
                                    <div className='tableHeight50'>
                                     <Table striped bordered hover className='text-center' variant="light" >
                                        <thead>
                                            <tr>
                                                <th>{t('Nr.')}</th>
                                                <th>{t('Shifra')}</th>
                                                <th>{t('Shuma e Paguar')}</th>
                                                <th>{t('Data e Pageses')}</th>
                                                <th>{t('Menyra e Pageses')}</th>
                                                <th>{t('Veprime')}</th>

                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBonuset.slice().reverse().map((bonus, index) => (
                                                <tr key={index}>
                                                    <td>{bonusetNeDetaje.length - index}</td>
                                                    <td>{bonus.shifra}</td>
                                                    <td>{formatCurrency(bonus.shuma)}</td>
                                                    <td>{formatLongDateToAlbanian(bonus.dataPageses)} / {bonus.dataPageses.toLocaleTimeString() }
                                                    </td>
                                                    <td>{bonus.emertimi}</td>
                                                    <td>                                                       
                                                        <Button variant="outline-danger" className='mx-1' disabled = {!isWithin30Days(bonus.dataPageses)} onClick={() => handleAnuloBonusin(bonus.transaksioniID,bonus.shuma,bonus.menyraPagesesID)}>
                                                            <FontAwesomeIcon icon={faTrashCan} /> {t('Anulo Pagesen')}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>}
                                    <Alert variant="warning" className="d-flex align-items-center mt-3">
                                        <FontAwesomeIcon icon={faTriangleExclamation} size={20} className="me-2" />
                                        <span>
                                            <strong>{t('Kujdes!')}</strong> {t('Bonuset me te vjetra se 30 Dite nuk mund te ndryshohen!')}
                                        </span>
                                    </Alert>
                                </Card.Body>                                
                                <Card.Footer>
                                    <Button variant="outline-success" className="me-2 float-end" onClick={() => kalkuloBonusetPerPunonjes() }>
                                        <FontAwesomeIcon icon={faGift} /> {t('Paguaj Bonuset')}
                                    </Button>
                                </Card.Footer>
                            </Card>
                        </Col>
                    </Row>:null}

                    
                </>
            )}


            {/** Modal per Bonuse */}
            <Modal size="lg" show={modalPerBonuset} onHide={() => {buttonLoading ? null: setModalPerBonuse(false)}} centered>
                <Modal.Header closeButton>
                    <Modal.Title className="text-dark">{t('Forma Per Kalkulim dhe Pagese te Bonuseve')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="mb-3 d-flex justify-content-start ">
                            <Col md={3}>
                                <Form.Group controlId="formFirstName">
                                    <Form.Label>{t('Muaji')}</Form.Label>
                                    <Form.Select
                                        name="muaji"
                                        value={muaji}
                                        onChange={(e) => {
                                            const selectedMonth = parseInt(e.target.value, 10);
                                            setMuaji(selectedMonth);
                                            setMuajiEmertim(albanianMonths[selectedMonth - 1]); 
                                        }} 
                                    >
                                        <option value="">{t('Zgjidhni muajin')}</option>
                                        {albanianMonths.map((month, index) => (
                                            <option key={index} value={index + 1}>
                                                {month}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group controlId="formFirstName">
                                    <Form.Label>{t('Viti')}</Form.Label>
                                    <Form.Select
                                        name="viti"
                                        value={viti}
                                        onChange={(e) => setViti(e.target.value)} 
                                    >
                                        <option value="">{t('Zgjidhni Vitin')}</option>
                                        {years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        {bonusetPerPunonjes.length > 0 ? (
                                <Row className='d-flex flex-column'>
                                    <Col className="mb-3 align-items-center">
                                        <Table striped bordered hover responsive>
                                            <thead className="table-light">
                                                <tr>
                                                    <th>{t('Nr.')}</th>
                                                    <th>{t('Data')}</th>
                                                    <th>{t('Shuma')} (€)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bonusetPerPunonjes.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{formatLongDateToAlbanian(item.dataBonuseve)}</td>
                                                        <td >{formatCurrency(item.shuma)}</td>
                                                        
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                </Col>
                                <Col className="d-flex justify-content-center">
                                <Form className="mx-auto" >
                                    <Row className="p-4 bg-white rounded-3 shadow d-flex flex-row flex-wrap">
                                    {/* Totali */}
                                    <Col xs={12} md={6} className="d-flex align-items-center mb-3 mb-md-0">
                                        <Form.Label column className="fs-5 fw-bold me-2">
                                        {t('Totali')}:
                                        </Form.Label>
                                        <InputGroup className="flex-fill">
                                        <Form.Control
                                            type="text"
                                            readOnly
                                            disabled
                                            value={formatCurrency(totalBonuset, true)}
                                            className="fs-5 bg-light text-end"
                                        />
                                        <InputGroup.Text>€</InputGroup.Text>
                                        </InputGroup>
                                    </Col>

                                    {/* Metoda e Pageses */}
                                    <Col xs={12} md={6} className="d-flex justify-content-start justify-content-md-end">
                                        <MenyratPagesesExport updateMenyraPageses={updateMenyraPageses} />
                                    </Col>
                                    </Row>
                                </Form>

                                
                            </Col>
                                                </Row>

                                ) : (
                                    <Alert variant="warning" className="d-flex align-items-center justify-content-center">
                                        <FontAwesomeIcon icon={faExclamationCircle} size="lg" className="me-3" />
                                        <p className="mb-0 fw-bold">{t('Nuk Egzistojne Bonuse per kete Date!')}</p>
                                    </Alert>
                                )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" disabled={buttonLoading} onClick={() => {buttonLoading ? null: setModalPerBonuse(false)}}>
                        {t('Mbyll')}
                    </Button>
                    <Button variant="primary" disabled={buttonLoading || !selectedMenyraPageses || bonusetPerPunonjes.length < 1} onClick={() => paguajBonuset()}>
                        {buttonLoading ? (
                            <><Spinner size="sm" /> {t('Duke ruajtur')}</>
                        ) : (
                            t('Paguaj Totalin')
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/**Modal per ndryshim ose pagese rroge */}
            <Modal size='md'
                        show={ndryshoModal}
                        onHide={() => {
                            buttonLoading ? null : setNdryshoModal(false);
                        }}
                        centered
                    >
                        <Modal.Header closeButton>
                            <Modal.Title className="text-dark">{pageseRroge ? t('Paguaj Rrogen') : t('Ndrysho Rrogen e Paguar')}</Modal.Title>
                        </Modal.Header>
                          <Modal.Body>
                            <Form>
                                <Row className="mb-3 d-flex justify-content-center">
                                    <Col md={6}>
                                        <Form.Group controlId="formFirstName">
                                            <Form.Label>{t('Data')}</Form.Label>
                                            {pageseRroge ? 
                                             <Form.Control
                                             type="date"
                                             name="data"
                                             defaultValue={new Date().toISOString().split('T')[0]}
                                             onChange={(e) => handleActiveSalaryChange(e)}
                                             readOnly={!pageseRroge}  
                                             />:
                                            <Form.Control
                                                type="text"
                                                name="data"
                                                value={formatLongDateToAlbanian(activeSalary.dataPageses)}
                                                onChange={(e) => handleActiveSalaryChange(e)}
                                                readOnly={!pageseRroge}  
                                                />
                                            }

                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group controlId="formFirstName">
                                              <Form.Label>{t('Paga')}</Form.Label>
                                              <InputGroup>
                                              <Form.Control
                                                  type="text"
                                                  name="paga"
                                                  min={1}
                                                  value={activeSalary.paga}
                                                  onChange={(e) => handleActiveSalaryChange(e)}

                                              />
                                              <InputGroup.Text>€</InputGroup.Text>
                                              </InputGroup>
                                          </Form.Group>
                                    </Col>
                                </Row>
                                  <Row className="mb-3 align-items-center">
                                     <Col md={6}>
                                        <Form.Group controlId="formFirstName">
                                            <Form.Label>{t('Bonusi i Pages')}</Form.Label>
                                            <InputGroup>
                                            <Form.Control
                                                type="number"
                                                name="bonusi"
                                                min={0}
                                                value={activeSalary.bonusi}
                                                onChange={(e) => handleActiveSalaryChange(e)}

                                            />
                                            <InputGroup.Text>€</InputGroup.Text>
                                            </InputGroup>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group controlId="formFirstName">
                                              <Form.Label>{t('Zbritja')}</Form.Label>
                                              <InputGroup>
                                              <Form.Control
                                                  type="number"
                                                  name="zbritje"
                                                  min={0}
                                                  value={activeSalary.zbritje}
                                                  onChange={(e) => handleActiveSalaryChange(e)}
                                              />
                                              <InputGroup.Text>€</InputGroup.Text>
                                              </InputGroup>
                                          </Form.Group>
                                    </Col>
                                  </Row>
                            </Form>
                            <Row>
                                <MenyratPagesesExport updateMenyraPageses={updateMenyraPageses} />
                            </Row>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="outline-secondary" disabled={buttonLoading} onClick={() => {
                            buttonLoading ? null : setNdryshoModal(false);
                        }}>
                                {t('Mbyll')}
                            </Button>
                            <Button variant="primary" disabled={buttonLoading || !selectedMenyraPageses || !activeSalary.paga || activeSalary.paga < 1} onClick={() => {pageseRroge ? paguajRrogen() : ndryshoRrogen()}}>
                                {buttonLoading  ? (
                                    <>
                                        <Spinner size="sm" /> {t('Duke ruajtur')}
                                    </>
                                ) : (
                                    <> { pageseRroge ? t('Paguaj Rrogen') : t('Ruaj Ndryshimet') }</>
                                )}
                            </Button>
                        </Modal.Footer>
            </Modal>

            {/**Modal per ndryshim ose regjistrim pushimi */}
            <Modal show={modalPerPushime} onHide={() => {buttonLoading ? null : setModalPerPushime(false)}} centered size="md" className="shadow-lg">
            <Modal.Header closeButton className="border-bottom">
                <Modal.Title className="">{perNdryshim ? t('Ndrysho') : t('Regjistro')} {t('Ditët e Pushimit')}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="px-4">
                <Form>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="dataFillimit">
                                <Form.Label className="fw-semibold">{t('Data e Fillimit')}</Form.Label>
                                    <div className="input-group shadow-sm">
                                         <FormControl
                                            type='date'
                                            name='dataFillimit'
                                            onChange={(e) => dataPerPushimChange(e)}
                                            dateFormat="dd/MM/yyyy"
                                            className="form-control"
                                            placeholderText={t("Zgjidhni datën")}
                                            value={dataPerPushim.dataFillimit}
                                            selected={dataPerPushim.dataMbarimit}

                                        />
                                       
                                    </div>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="dataMbarimit">
                                <Form.Label className="fw-semibold">{t('Data e Mbarimit')}</Form.Label>
                               
                                    <div className="input-group shadow-sm">
                                        <FormControl
                                            type='date'
                                            selected={dataPerPushim.dataMbarimit}
                                            value={dataPerPushim.dataMbarimit}
                                            name='dataMbarimit'
                                            onChange={(e) => dataPerPushimChange(e)}
                                            dateFormat="dd/MM/yyyy"
                                            className="form-control"
                                            placeholderText={t("Zgjidhni datën")}
                                            minDate={dataPerPushim.dataFillimit}
                                        />
                                    </div>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col md={6}>
                            <Form.Group controlId="nrDiteve">
                                <Form.Label className="fw-semibold">{t('Nr. Ditëve')}</Form.Label>
                                    <Form.Control
                                        type="number"
                                        min="1"
                                        name='nrDiteve'
                                        value={dataPerPushim.nrDiteve}
                                        onChange={(e) => dataPerPushimChange(e)}
                                        className="shadow-sm"
                                        placeholder={t("Numri i ditëve")}
                                    />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="lloji">
                                <Form.Label className="fw-semibold">{t('Lloji')}</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={dataPerPushim.lloji}
                                        name='lloji'
                                        onChange={(e) => dataPerPushimChange(e)}
                                        className="shadow-sm"
                                        placeholder={t("Lloji i pushimit")}
                                    />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group controlId="arsyeja" className="mb-3">
                        <Form.Label className="fw-semibold">{t('Arsyeja')}</Form.Label>
                        
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={dataPerPushim.arsyeja}
                                name='arsyeja'
                                onChange={(e) => dataPerPushimChange(e)}
                                className="shadow-sm"
                                placeholder={t("Shkruani arsyen")}
                            />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between border-0">
                <Button variant="outline-secondary" onClick={() => {buttonLoading ? null : setModalPerPushime(false)}} className="px-4">{t('Anulo')}</Button>
                <Button variant="primary" disabled={buttonLoading || !dataPerPushim.arsyeja || !dataPerPushim.lloji || !dataPerPushim.dataFillimit || !dataPerPushim.dataMbarimit || !dataPerPushim.nrDiteve || dataPerPushim.nrDiteve < 1} onClick={() => {perNdryshim ? handleNdryshoPushimin() :handleShtoPushimin()}}>
                                {buttonLoading  ? (
                                    <>
                                        <Spinner size="sm" /> {t('Duke ruajtur')}
                                    </>
                                ) : (
                                    <> {perNdryshim ? t('Ruaj Ndryshimet') : t('Regjistro')} </>
                                )}
                            </Button>            </Modal.Footer>
            </Modal>

            <ModalPerPyetje show={showModalPerPyetje} handleClose={() => {buttonLoading ? null : setShowModalPerPyetje(false)}} handleConfirm={handleConfirm} />

            <ToastContainer/>
        </Container>
    );
}
