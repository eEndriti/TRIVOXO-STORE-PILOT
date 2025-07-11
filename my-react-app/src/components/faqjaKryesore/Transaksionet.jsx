import { useState,useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom';
import { Container,Button,Row,Col,Modal,Form, Spinner, InputGroup,Table,Badge } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashCan,faCheck } from '@fortawesome/free-solid-svg-icons'; 
import ModalPerPyetje from '../ModalPerPyetje'
import {useToast} from '../ToastProvider'
import NdryshoShpenzimin from '../shpenzimi/NdryshoShpenzimin';
import NdryshoServisinPerfunduar from '../NdryshoServisinPerfunduar';
import AnimatedSpinner from '../AnimatedSpinner';
import {ToastContainer } from 'react-toastify';
import dummyTransaksionet from '../../assets/dummyData.json/transaksionet.json'
import dummyNderrimet from '../../assets/dummyData.json/nderrimet.json'
import AuthContext, { formatCurrency, formatDate, formatLongDateToAlbanian, normalizoDaten } from '../AuthContext';
import Charts from './Charts';
import { useTranslation } from 'react-i18next';
const isElectron = !!(window && window.electronAPI);

export default function Transaksionet() {
  const {t} = useTranslation('faqjaKryesore')
    const navigate = useNavigate()
    const [loading,setLoading] = useState(true)
    const [transaksionet,setTransaksionet] = useState([])
    const [transaksionetENderrimit,setTransaksionetENderrimit] = useState([])
    const { authData,updateAuthData } = useContext(AuthContext)
    const [buttonLoading,setButtonLoading] = useState(false)
    const [showModalPerPyetje,setShowModalPerPyetje] = useState(false)
    const [dataPerPerdorim,setDataPerPerdorim] = useState({})
    const [nderrimet,setNderrimet] = useState([])
    const [selectedNderrimi,setSelectedNderrimi] = useState()
    const [selectedNderrimiData,setSelectedNderrimiData] = useState()
    const [tregoGrafikun,setTregoGrafikun] = useState(false)
    const showToast = useToast();
    const [modalNdryshoShpenzim,setModalNdryshoShpenzim] = useState(false)
    const [dataNdryshoShpenzim,setDataNdryshoShpenzim] = useState()
    const [modalNdryshoServisim,setModalNdryshoServisim] = useState(false)
    const [dataNdrshoServisim,setDataNdryshoServisim] = useState()

    useEffect(() => {

        fetchData();
    
      }, []);
      
      const fetchData = async () => {
        try{
          if(isElectron){
             const [transaksionetData,nderrimetData] = await Promise.all([
            window.api.fetchTableTransaksionet(),
            window.api.fetchTableNderrimi(),
            ]);
            setTransaksionet(transaksionetData);
            setNderrimet(nderrimetData)
          }else{
            setTransaksionet(dummyTransaksionet.transaksionet)
            setNderrimet(dummyNderrimet.nderrimet)
            console.log(dummyNderrimet)
          }
          

        }catch(e){
          console.log(e)
        }finally{
          setLoading(false)
        }
      };
    
      useEffect(() => {
        if(selectedNderrimi){
          setTregoGrafikun(true)
          const filterResult = nderrimet.find(item => item.nderrimiID = selectedNderrimi )
        const dataFormatuar = formatLongDateToAlbanian(filterResult.dataFillimit)
        setSelectedNderrimiData({
          nrPercjelles:filterResult.numriPercjelles,
          dataFillimit:dataFormatuar
        })
        }
      },[selectedNderrimi])

      useEffect(() => {
        let filteredTransaksionet;
        
        if(authData.aKaUser == 'admin'){
          filteredTransaksionet = transaksionet.filter(item => {
            const isMatchingDay = isDateToday(item.dataTransaksionit);
            const isPublic = authData.aKaUser == "perdorues" ? item.eshtePublik : true;
            return isMatchingDay && isPublic;
          });
        }else if(authData.aKaUser == 'perdorues'){
          filteredTransaksionet = transaksionet.filter(item => {
            const isMatchingShift = item.nderrimiID == Number(authData.nderrimiID);
            const isPublic = authData.aKaUser == "perdorues" ? item.eshtePublik : true;
            return isMatchingShift && isPublic;
          });
        }

        setTransaksionetENderrimit(filteredTransaksionet);

      }, [transaksionet, authData.nderrimiID, authData.aKaUser]);

     const isDateToday = (dateString) => {
        const givenDate = new Date(dateString);
        const today = new Date();
      
        return (
          givenDate.getDate() === today.getDate() &&
          givenDate.getMonth() === today.getMonth() &&
          givenDate.getFullYear() === today.getFullYear()
        );
      };

    const thirreModalPerPyetje = (item) => {
        setDataPerPerdorim(item)
        setShowModalPerPyetje(true)
    }

    const confirmModalPerPyetje = async () => {
        const data = {
            lloji:dataPerPerdorim.lloji,
            transaksioniID:dataPerPerdorim.transaksioniID,
            perdoruesiID:authData.perdoruesiID,
            nderrimiID:authData.nderrimiID,
          }
        try{
            let result

            switch(dataPerPerdorim.lloji){
                case 'Shitje' : result = await window.api.anuloShitjen(data)
                    break;
                case 'Blerje' : result = await window.api.anuloBlerjen(data)
                    break;
                case 'Shpenzim' : result = await window.api.anuloShpenzimin(data)
                    break;
              case 'Servisim':
                showToast(t('Servisi mund te anulohet vetem nga sektori i Servisimit!'), 'warning');
                break;
              case 'Pagese Bonuseve':
                showToast(t('Pagesa e Bonuseve mund te Anulohet vetem nga sektori i Administrimit'), 'warning');
                break;
              case 'Pagese per Blerje':
              case 'Pagese per Shitje':
              case 'Pagese per Servisimi':
                showToast(t('Pagesa e Dokumentit mund te Anulohet vetem nga sektori i Dokumentit Perkates'), 'warning');
                break;
              case 'Pagese Page':
                showToast(t('Pagesa e Pages mund te Anulohet vetem nga sektori i Administrimit'), 'warning');
                break;
              default:
                showToast(t('Veprimi nuk Lejohet!'), 'warning');
            }

      

            if (result.success) {
              showToast(t(`Transaksioni i llojit`) + t(dataPerPerdorim.lloji) + t(' u Anulua me Sukses!'), "success");
               fetchData();
              } else {
                showToast(t("Gabim gjatë Anulimit!"), "error"); 
 
              }
        }catch(e){
            console.log(e)
        }finally{
            setButtonLoading(false)
            updateAuthData({reloadLayout:!authData.reloadLayout})

        }
    }

    const shifraClick = (item) => {
      const lloji = item.lloji
     
      switch(lloji){
        case 'Shitje'  : 
        case 'Modifikim Shitje': navigate(`/ndryshoShitjen/${item.llojiID}`)
            break;
        case 'Blerje' : 
        case 'Modifikim Blerje' : navigate(`/ndryshoBlerjen/${item.llojiID}`)
            break;
        case 'Shpenzim' : showShpenzimModal(item.llojiID)
            break;
        case 'Servisim':
        case 'Modifikim Servisi': showServisimModal(item.llojiID)
            break;
        case 'Pagese Bonuseve':
          showToast(t('Pagesa e Bonuseve mund te ndryshohet vetem nga sektori i Administrimit'), 'warning');
          break;
        case 'Pagese per Blerje':
        case 'Pagese per Shitje':
        case 'Pagese per Servisimi':
          showToast(t('Pagesa e Dokumentit mund te ndryshohet vetem nga sektori i Dokumentit Perkates'), 'warning');
          break;
        case 'Pagese Page':
          showToast(t('Pagesa e Pages mund te ndryshohet vetem nga sektori i Administrimit'), 'warning');
          break;

         
      }
    }

    const showShpenzimModal = async (id) => {
      try {
          const result = await window.api.fetchTableShpenzimet()
          const data = result.find(item => item.shpenzimiID == id)
          setDataNdryshoShpenzim(data) 

      } catch (error) {
         showToast(t('Gabim gjate marrjes se te dhenave per ndryshim') + error, 'error')
      }finally{
          setModalNdryshoShpenzim(true)
          updateAuthData({reloadLayout:!authData.reloadLayout})

      }
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
          showToast(t('Gabim gjate marrjes se te dhenave per ndryshim') + error, 'error');
      }finally{
        updateAuthData({reloadLayout:!authData.reloadLayout})

      }
  };
  

    const handleConfirmNdryshoServisinPerfunduar =  () => {
      fetchData()
      setModalNdryshoServisim(false)
    }
  return (
    <Container fluid className="pt-3 modern-container">
    {loading ? (
      <AnimatedSpinner />
    ) : (
        <Row className="section-container my-4">
        <h3 className="section-title">{t('Transaksionet e')} {authData.aKaUser == 'admin' ? t('Dites') : t('Nderrimit')}</h3>
        <div className="table-container tableHeight50">
            <Table responsive="sm" striped bordered hover size="sm" className="custom-table">
            <thead className="table-header">
                <tr>
                <th>{t('Nr')}</th>
                <th>{t('Shifra')}</th>
                <th>{t('Lloji')}</th>
                <th>{t('Përshkrimi')}</th>
                <th>{t('Totali Për Pagesë')}</th>
                <th>{t('Totali Pagesës')}</th>
                <th>{t('Mbetja Për Pagesë')}</th>
                <th>{t('Komenti')}</th>
                <th>{t('Koha')}</th>
                <th>{t('Opsionet')}</th>

                </tr>
            </thead>
            <tbody>
                {transaksionetENderrimit?.slice().reverse().map((item, index) => (
                item.transaksioniID !== 0 && (
                    <tr key={index}>
                    <td>{transaksionetENderrimit.length - index}</td>
                    <td>
                      <Button variant='' className='hover text-primary text-decoration-underline' style={{color:'#24AD5D',fontSize:'15px'}} onClick={() => shifraClick(item)}
                         onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                         onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
                        {item.shifra}
                      </Button>
                    </td>
                    <td>{item.lloji}</td>
                    <td className="text-wrap">{item.pershkrimi}</td>
                    <td>{formatCurrency(item.totaliperPagese)}</td>
                    <td>{formatCurrency(item.totaliIPageses)}</td>
                    <td>
                        <Badge bg={item.mbetjaPerPagese > 0 ? 'danger' : 'success'} pill className="fw-bold" >
                          {formatCurrency(item.mbetjaPerPagese)}
                        </Badge>                    
                    </td>
                    <td>{item.komenti}</td>
                    <td>{item.dataTransaksionit.toLocaleTimeString()}</td>
                    <td className="d-flex flex-row justify-content-around">
                       
                        <Button
                        variant="outline-danger"
                        className="mx-1"
                        disabled = {item?.pershkrimi?.startsWith('Kosto e postes')}
                        onClick={() =>
                            thirreModalPerPyetje(item)
                        }
                        >
                        <FontAwesomeIcon icon={faTrashCan} />
                        </Button>
                    </td>
                    </tr>
                )
                ))}
            </tbody>
            </Table>
        </div>
        </Row>
    )}

    {authData.aKaUser == 'admin' && 
      <Row className='d-flex flex-column align-items-center '>
        <Col lg={3} className='mb-3 d-flex'>
          <Col className='mx-2'>
            <Form.Select 
              value={selectedNderrimi || ""} // Ensures default is selected
              onChange={(e) => setSelectedNderrimi(e.target.value)}
            >
              <option value="" disabled>
                {t('Selekto Nderrimin')}
              </option>
              {nderrimet?.slice(0, -1).reverse().map((item) => (
                <option key={item.nderrimiID} value={item.nderrimiID}>
                  {item.numriPercjelles} - {formatLongDateToAlbanian(item.dataFillimit)}
                </option>
              ))}
            </Form.Select>

          </Col>
          <Col>
              {selectedNderrimi &&               
              <Button variant='outline-primary' onClick={() => {setTregoGrafikun(false);setSelectedNderrimi('')}}>{tregoGrafikun ? t('Mbyll Grafikun') : t('Krahaso Nderrimet')}</Button>
            }
          </Col>
        </Col>
        <Col lg={10} className='mb-3'>
          {selectedNderrimiData && tregoGrafikun && <Charts transaksionet={transaksionet} nderrimiAktual={authData.nderrimiID} nderrimiSelektuar={selectedNderrimi} nrPercjelles={selectedNderrimiData.nrPercjelles} dataNderrimitSelektuar={selectedNderrimiData.dataFillimit}/>}
        </Col>
      </Row>}
    <ModalPerPyetje show={showModalPerPyetje} handleClose={()=> setShowModalPerPyetje(false)} handleConfirm={confirmModalPerPyetje} />

    <NdryshoShpenzimin show = {modalNdryshoShpenzim} handleClose = {() => setModalNdryshoShpenzim(false)} dataPerNdryshim = {dataNdryshoShpenzim} />
    <NdryshoServisinPerfunduar show={modalNdryshoServisim} handleClose={() => setModalNdryshoServisim(false)} data={dataNdrshoServisim} handleConfirm={handleConfirmNdryshoServisinPerfunduar}/>
    <ToastContainer />
  </Container>
  )
}
