import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Table, Form,Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons'; 
import ModalPerPyetje from './ModalPerPyetje'
import { formatCurrency, formatLongDateToAlbanian, formatTime } from './AuthContext';
import {useToast} from './ToastProvider'
import {ToastContainer } from 'react-toastify';
import NdryshoServisinPerfunduar from './NdryshoServisinPerfunduar';
import NdryshoShpenzimin from './shpenzimi/NdryshoShpenzimin';
import  AuthProvider  from './AuthContext';
import AnimatedSpinner from './AnimatedSpinner';
import FilterPaymentOptions from './administrimi/FilterPaymentOptions';
import SaveExcelOneSheet from './SaveExcelOneSheet';
import '../assets/css/transaksionet.css'
import { useTranslation } from 'react-i18next';

export default function Transaksionet() {

  const {t} = useTranslation('others')
  const navigate = useNavigate()
  const [transaksionet, setTransaksionet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterShifra, setFilterShifra] = useState('');
  const [filterLloji, setFilterLloji] = useState('');
  const [filterPerdoruesi,setFilterPerdoruesi] = useState('')
  const [showModalPerPyetje,setShowModalPerPyetje] = useState(false)
  const [dataPerPerdorim,setDataPerPerdorim] = useState({})
  const [buttonLoading,setButtonLoading] = useState(false)
  const showToast = useToast()
  const [modalNdryshoShpenzim,setModalNdryshoShpenzim] = useState(false)
  const [dataNdryshoShpenzim,setDataNdryshoShpenzim] = useState()
  const [modalNdryshoServisim,setModalNdryshoServisim] = useState(false)
  const [dataNdrshoServisim,setDataNdryshoServisim] = useState()
  const {authData,updateAuthData} = useContext(AuthProvider)
  let muaji = new Date().getMonth()+1
  {muaji < 10 ? muaji = `0${muaji}` : null}
  const [filterDataTransaksionitStart, setFilterDataTransaksionitStart] = useState(`${new Date().getFullYear()}-${muaji}-01`);
  const [filterDataTransaksionitEnd, setFilterDataTransaksionitEnd] = useState(new Date().toISOString().split('T')[0]);
  const [filterMenyraPageses, setFilterMenyraPageses] = useState('')
  
  useEffect(() => {
   fetchData()
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await window.api.fetchDetailedTransactions();
      setTransaksionet(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTransaksionet = transaksionet.filter(item => {
    const itemDate = new Date(item.dataTransaksionit).toISOString().split('T')[0];
    return (
      (!filterShifra || item.shifra.toLowerCase().includes(filterShifra)) &&
      (!filterPerdoruesi || item.perdoruesi.toLowerCase().includes(filterPerdoruesi)) &&
      (!filterLloji || item.lloji.toLowerCase().includes(filterLloji.toLowerCase())) &&
      (!filterMenyraPageses || item.emertimiMenyresPageses?.toLowerCase().includes(filterMenyraPageses.toLowerCase())) &&
      itemDate >= filterDataTransaksionitStart &&
      itemDate <= filterDataTransaksionitEnd
    );
  });

  const thirreModalPerPyetje = (item) => {
    setDataPerPerdorim(item)
    setShowModalPerPyetje(true)
}

const totals = filteredTransaksionet.reduce(
  (acc, t) => {
    acc.totalPerPagese += t.totaliperPagese;
    acc.totalIPageses += t.totaliIPageses;
    acc.totalMbetja += t.mbetjaPerPagese;
    return acc;
  },
  { totalPerPagese: 0, totalIPageses: 0, totalMbetja: 0 }
);

const confirmModalPerPyetje = async () => {
  const data = {
      lloji:dataPerPerdorim.lloji,
      transaksioniID:dataPerPerdorim.transaksioniID,
      perdoruesiID : authData.perdoruesiID,
      nderrimiID:authData.nderrimiID
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
        case 'Servisim' : showToast(t('Servisi mund te anulohet vetem nga sektori i Servisimit!'), 'warning')
            break;
        case 'Pagese Bonuseve' : showToast(t('Pagesa e Bonuseve mund te Anulohet vetem nga sektori i Administrimit'), 'warning') 
            break;
        case 'Pagese per Blerje':
        case 'Pagese per Shitje':
        case 'Pagese per Servisimi': showToast(t('Pagesa e Dokumentit mund te Anulohet vetem nga sektori i Dokumentit Perkates'), 'warning')
            break;
        case 'Pagese Page' : showToast(t('Pagesa e Pages mund te Anulohet vetem nga sektori i Administrimit'), 'warning')
            break;
        default : showToast(t('Veprimi nuk Lejohet!'),'warning')
          }

      if (result.success) {
        showToast(`${t('Transaksioni i llojit')} ${dataPerPerdorim.lloji} ${t(' u Anulua me Sukses!')}`, "success");
         fetchData();
        } else {
          showToast(t('Gabim gjatë Anulimit!'), "error"); 

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
    case 'Pagese Bonuseve' : showToast(t('Pagesa e Bonuseve mund te Anulohet vetem nga sektori i Administrimit'), 'warning') 
        break;
    case 'Pagese per Blerje':
    case 'Pagese per Shitje':
    case 'Pagese per Servisimi': showToast(t('Pagesa e Pages mund te Anulohet vetem nga sektori i Administrimit'), 'warning')
        break;
    case 'Pagese Page' : showToast(t('Pagesa e Pages mund te Anulohet vetem nga sektori i Administrimit'), 'warning')
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
  }
}

const showServisimModal = async (id) => {
  try {
      const result = await window.api.fetchTableServisi();
      const data = result.find(item => item.servisimiID == id);
      
      if (!data) {
          showToast(t('Gabim: Nuk u gjet servisi me këtë ID'), 'error');
          return; 
      }

      setDataNdryshoServisim(data);
      setModalNdryshoServisim(true); 

  } catch (error) {
      showToast(t('Gabim gjatë marrjes së të dhënave për ndryshim:') + error, 'error');
  }
};

const handleConfirmNdryshoServisinPerfunduar =  () => {
  fetchData()
  setModalNdryshoServisim(false)
}

function truncate(text, max) {
  return text?.length > max ? text.slice(0, max) + '…' : text;
}

const handleFilterSelect = (e) =>{
  setFilterMenyraPageses(e)
  if(e == ''){
    setFilterMenyraPageses('')
  }
}

  return (
    <Container fluid className='mt-5'>
      <Row className="mb-3 d-flex flex-wrap justify-content-between align-items-center">
        <Col>
          <Form.Group>
            <Form.Label>{t('Shifra')}</Form.Label>
            <Form.Control
              type="text"
              value={filterShifra}
              onChange={(e) => setFilterShifra(e.target.value)}
              placeholder={t("Filtroni sipas shifres")}
            />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group>
            <Form.Label>{t('Lloji')}</Form.Label>
            <Form.Control
              type="text"
              value={filterLloji}
              onChange={(e) => setFilterLloji(e.target.value)}
              placeholder={t("Filtroni sipas llojit")}
            />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group>
            <Form.Label>{t('Perdoruesi')}</Form.Label>
            <Form.Control
              type="text"
              value={filterPerdoruesi}
              onChange={(e) => setFilterPerdoruesi(e.target.value)}
              placeholder={t("Filtroni sipas perdoruesit")}
            />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group>
            <Form.Label>{t('Data e fillimit')}</Form.Label>
            <Form.Control
              type="date"
              value={filterDataTransaksionitStart}
              onChange={(e) => setFilterDataTransaksionitStart(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group>
            <Form.Label>{t('Data e mbarimit')}</Form.Label>
            <Form.Control
              type="date"
              value={filterDataTransaksionitEnd}
              onChange={(e) => setFilterDataTransaksionitEnd(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col>
          <FilterPaymentOptions filter={filterMenyraPageses} onSelect={handleFilterSelect} />
        </Col>
      </Row>

      {loading ? (
        <AnimatedSpinner />
      ) : (
        <Row >
          <div className=" tabela" style={{ maxHeight: '700px',overflowY:'auto' ,position: 'relative' }}>
            <Table striped bordered hover >
              <thead>
                <tr>
                  <th
                    style={{
                      position: 'sticky',
                      left: 0,
                      background: '#fff',
                      zIndex: 2,
                      width: '60px'
                    }}
                  >
                    {t('Nr.')}
                  </th>
                  <th
                    style={{
                      position: 'sticky',
                      left: 60,
                      background: '#fff',
                      zIndex: 2,
                      minWidth: '120px'
                    }}
                  >
                    {t('Shifra')}
                  </th>
                  <th>{t('Lloji')}</th>
                  <th style={{ minWidth: '200px' }}>{t('Përshkrimi')}</th>
                  <th>{t('Totali për Pagesë')}</th>
                  <th>{t('Totali i Pagesës')}</th>
                  <th>{t('Mbetja për Pagesë')}</th>
                  <th>{t('Mënyra e Pagesës')}</th>
                  <th style={{ minWidth: '200px' }}>{t('Komenti')}</th>
                  <th>{t('Ndërrimi / Data dhe Ora')}</th>
                  <th>{t('Përdoruesi')}</th>
                  <th>{t('Opsionet')}</th>

                </tr>
              </thead>
              <tbody className="text-nowrap">
               {filteredTransaksionet?.length > 0 ? 
               <>
                {filteredTransaksionet
                  .slice()
                  .reverse()
                  .map((t, i) => (
                    <tr key={t.transaksioniID}>
                      <td
                        className="fw-bold"
                        style={{
                          position: 'sticky',
                          left: 0,
                          background: '#fff',
                          zIndex: 1
                        }}
                      >
                        {filteredTransaksionet.length - i}
                      </td>

                      <td
                        style={{
                          position: 'sticky',
                          left: 60,
                          background: '#fff',
                          zIndex: 1
                        }}
                      >
                        <Button
                          variant="link"
                          className="p-0"
                          style={{ fontSize: '15px' }}
                          onClick={() => shifraClick(t)}
                        >
                          {t.shifra}
                        </Button>
                      </td>

                      <td>{t.lloji}</td>

                      <td
                        className="text-truncate"
                        style={{ maxWidth: '200px' }}
                      >
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>{t.pershkrimi}</Tooltip>}
                        >
                          <span>{truncate(t.pershkrimi, 26)}</span>
                        </OverlayTrigger>
                      </td>

                      <td>{formatCurrency(t.totaliperPagese)}</td>
                      <td>{formatCurrency(t.totaliIPageses)}</td>

                      <td>
                        <Badge
                          bg={t.mbetjaPerPagese > 0 ? 'danger' : 'success'}
                          pill
                          className="fw-bold"
                        >
                          {formatCurrency(t.mbetjaPerPagese)}
                        </Badge>
                      </td>

                      <td>
                        <Badge bg="info" pill>
                          {t.emertimiMenyresPageses || t('E Pa Përcaktuar!')}
                        </Badge>
                      </td>

                      <td
                        className="text-truncate"
                        style={{ maxWidth: '200px' }}
                      >
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>{t.komenti}</Tooltip>}
                        >
                          <span>{truncate(t.komenti,26)}</span>
                        </OverlayTrigger>
                      </td>

                      <td>
                        {t.numriPercjelles} /{' '}
                        {formatLongDateToAlbanian(t.dataTransaksionit)} /{' '}
                        {formatTime(t.dataTransaksionit)}
                      </td>
                      <td>{t.perdoruesi}</td>

                      <td className="text-center">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          disabled={t.pershkrimi?.startsWith('Kosto e postes')}
                          onClick={() => thirreModalPerPyetje(t)}
                        >
                          <FontAwesomeIcon icon={faTrashCan} />
                        </Button>
                      </td>
                    </tr>
                  ))} 
               </>: <td colSpan={12}><h5 className='text-center'>{t('Nuk Egzistojne te Dhena!')}</h5></td>}
              </tbody>

             {filteredTransaksionet?.length > 0 &&  <tfoot className="my-Footer " >
                <tr  >
                  <th colSpan={4} className="text-end">{t('Totali')}:</th>
                  <th className=''>{formatCurrency(totals.totalPerPagese)}</th>
                  <th>{formatCurrency(totals.totalIPageses)}</th>
                  <th>{formatCurrency(totals.totalMbetja)}</th>
                  <th colSpan={5} />
                </tr>
              </tfoot>}
            </Table>
          </div>
        </Row>
      )}

      <Row className="mt-3 border-top pt-3">
        <Col>
          <div className="d-flex justify-content-end align-items-center gap-3">
            <SaveExcelOneSheet
              fileName="Transaksionet"
              data={filteredTransaksionet.map(({
                menyraPagesesID,
                transaksioniID,
                perdoruesiID,
                nderrimiID,
                eshtePublik,
                llojiID,
                numriPercjelles,
                dataTransaksionit,
                pershkrimi,
                emertimiMenyresPageses,
                ...rest
              }, index) => {
                const d = new Date(dataTransaksionit);
                const MM = String(d.getMonth()+1).padStart(2,'0');
                const DD = String(d.getDate()).padStart(2,'0');
                const YYYY = d.getFullYear();
                const HH = String(d.getHours()).padStart(2,'0');
                const MI = String(d.getMinutes()).padStart(2,'0');
                const SS = String(d.getSeconds()).padStart(2,'0');
                return {
                  Nr: index + 1,
                  Shifra: rest.shifra,
                  Lloji: rest.lloji,
                  Pershkrimi: pershkrimi,
                  Totali_per_Pages: formatCurrency(rest.totaliperPagese),
                  Totali_i_Pageses: formatCurrency(rest.totaliIPageses),
                  Mbetja_per_Pages: formatCurrency(rest.mbetjaPerPagese),
                  Mënyra_e_Pagesës: emertimiMenyresPageses || 'E Pa Përcaktuar!',
                  Komenti: rest.komenti,
                  Perdoruesi: rest.perdoruesi,
                  Nderrim_Data_Transaksionit: `${numriPercjelles}/${MM}.${DD}.${YYYY}`,
                  Ora_Transaksionit: `${HH}:${MI}:${SS}`,
                };
              })}
            />

            <Link to="logs" className="btn btn-primary">
              {t('Logs')}
            </Link>
          </div>
        </Col>
      </Row>

     


      <ModalPerPyetje show={showModalPerPyetje} handleClose={()=> setShowModalPerPyetje(false)} handleConfirm={confirmModalPerPyetje} />
        <NdryshoShpenzimin show = {modalNdryshoShpenzim} handleClose = {() => setModalNdryshoShpenzim(false)} dataPerNdryshim = {dataNdryshoShpenzim} />
        <NdryshoServisinPerfunduar show={modalNdryshoServisim} handleClose={() => setModalNdryshoServisim(false)} data={dataNdrshoServisim} handleConfirm={handleConfirmNdryshoServisinPerfunduar}/>   
      <ToastContainer/>
    </Container>
  );
}
