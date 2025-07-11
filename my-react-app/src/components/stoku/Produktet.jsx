import { useState, useEffect, useContext } from 'react';
import { Col, Container, Row, Button, Form, Spinner,Badge,Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan,faEdit } from '@fortawesome/free-solid-svg-icons';
import ModalPerPyetje from '../ModalPerPyetje';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import ShtoNjeProdukt from './ShtoNjeProdukt';
import { useNavigate } from 'react-router-dom';
import AnimatedSpinner from '../AnimatedSpinner';
import AuthContext,{ formatCurrency } from "../AuthContext";
import SaveExcelOneSheet from '../SaveExcelOneSheet';
import { useTranslation } from 'react-i18next';

export default function Produktet() {

  const {t} = useTranslation('stoku')
  const navigate = useNavigate();
  const [produktet, setProduktet] = useState([]);
  const [filteredProduktet, setFilteredProduktet] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalPerPyetje, setShowModalPerPyetje] = useState(false);
  const [idPerAnulim, setIdPerAnulim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eliminoVleratZero, setEliminoVleratZero] = useState(false);
  const [filterShifra, setFilterShifra] = useState('');
  const [filterEmertimi, setFilterEmertimi] = useState('');
  const [filterSasia, setFilterSasia] = useState('');
  const [filterKategoria, setFilterKategoria] = useState('');
  const [produkti,setProdukti] = useState({})
  const {authData} = useContext(AuthContext);
  const [triggerReload,setTriggerReload] = useState(false)
  const showToast = useToast()

  useEffect(() => {
    fetchData()
    setLoading(false)
  }, [triggerReload]);

  const fetchData = async () => {
    await window.api.fetchTableProdukti().then(receivedData => {
      setProduktet(receivedData);
      setFilteredProduktet(receivedData);
    });
    let isoFmt = new Intl.DateTimeFormat('sv-SE').format(new Date());

  }
  
  const thirreModalPerPyetje = (produktiID) => {
    setIdPerAnulim(produktiID);
    setShowModalPerPyetje(true);
  };

  const handleConfirmModalPerPyetje = async () => {
    setLoading(true);
    await handleDeleteProduktin();
    setLoading(false);
  };

  const handleCloseModalPerPyetje = () => setShowModalPerPyetje(false);
  const handleCloseModal = () => setShowModal(false);

  const handleDeleteProduktin = async () => {
    const data = {
      idPerAnulim,
      perdoruesiID: authData.perdoruesiID,
      nderrimiID:authData.nderrimiID
    }
    try {
      const response = await window.api.fshijeProduktin(data);
      if (response.success) {
        showToast( t("Produkti u Anulua me sukses!") ,"success");
      } else {
        showToast(response.error || t("Fshirja e produktit dështoi!") , "error");
      }
    } catch (error) {
      showToast(t("Diçka shkoi keq!"),'error');
    }finally{
      setShowModalPerPyetje(false);
      setTriggerReload(prev => !prev)
    }
  };


  useEffect(() => {
    const applyFilters = () => {
        let filtered = [...produktet];
        if (filterShifra) {
            filtered = filtered.filter(item => item.shifra.toLowerCase().includes(filterShifra.toLowerCase()) );
        }
        if (filterEmertimi) {
            filtered = filtered.filter(item => item.emertimi.toLowerCase().includes(filterEmertimi.toLowerCase()));
        }
        if (filterSasia) {
            filtered = filtered.filter(item => item.sasia == filterSasia);
        }
        if (filterKategoria) {
            filtered = filtered.filter(item => item.emertimiKategorise.toLowerCase().includes(filterKategoria.toLowerCase()));
        }
        if (eliminoVleratZero) {  
            filtered = filtered.filter(item => item.sasia > 0);
          }
          

        setFilteredProduktet(filtered);
    };

    applyFilters();
}, [produktet, filterShifra, filterEmertimi, filterSasia, filterKategoria, eliminoVleratZero]);



  const handleDetaje = (subjektiID) =>{
    navigate(`/detajePerProdukt/${subjektiID}`)
  }

  const thirreNdryshoProduktin = (produkti) => {
    setProdukti(produkti)
    setShowModal(true)
  }
  const thirreShtoProduktin = () => {
    setProdukti('')
    setShowModal(true)
    
  }
  
  return (
    <Container fluid className='mt-5'>
      <Row>
        <Col className='d-flex justify-content-start'>
          <Button variant='success' className='text-light p-3 fs-5 mx-3' onClick={() => thirreShtoProduktin()}>{t('Krijo Nje Produkt')}</Button>
          <Button variant='info' className='text-dark p-3 fs-5 mx-3' onClick={() => navigate('/kategorite')}>{t('Kategorite')}</Button>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col>
          <Form>
            <Row>
              <Col>
                <Form.Control
                  type="text"
                  placeholder={t("Filtro me Shifer")}
                  value={filterShifra}
                  onChange={(e) => setFilterShifra(e.target.value)}
                />
              </Col>
              <Col>
                <Form.Control
                  type="text"
                  placeholder={t("Filtro me Emertimin")}
                  value={filterEmertimi}
                  onChange={(e) => setFilterEmertimi(e.target.value)}
                />
              </Col>
              <Col>
                <Form.Control
                  type="text"
                  placeholder={t("Filtro nga Sasia")}
                  value={filterSasia}
                  onChange={(e) => setFilterSasia(e.target.value)}
                />
              </Col>
              <Col>
                <Form.Control
                  type="text"
                  placeholder={t("Filtro me Kategori")}
                  value={filterKategoria}
                  onChange={(e) => setFilterKategoria(e.target.value)}
                />
              </Col>
              <Col>
              <Form.Group className='d-flex mt-2'>
              <Form.Label className='mx-3'>{t('Elimino Vlerat Zero')}</Form.Label>
                <Form.Check
                  checked = {eliminoVleratZero}
                  onChange={() => setEliminoVleratZero(prev => !prev)}
                />
              </Form.Group>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>

      <Row>
      {loading ? <AnimatedSpinner /> : 
            <div className="table-responsive tableHeight50 mt-4">
                <Table responsive striped bordered hover className="text-center">
                <thead className="table-light">
                <tr className='fs-5 '>
                  <th scope="col">{t('Nr')}</th>
                  <th scope="col">{t('Shifra')}</th>
                  <th scope="col">{t('Emertimi')}</th>
                  <th scope="col">{t('Pershkrimi')}</th>
                  <th scope="col">{t('Sasia')}</th>
                  {authData.aKaUser == 'admin' ? <th scope="col">{t('CmimiBlerjes')}</th> : null}
                  <th scope="col">{t('CmimiShitjes')}</th>
                  <th scope="col">{t('Komenti')}</th>
                  <th scope="col">{t('me Fature te Rregullt')}</th>
                  <th scope="col">{t('Kategoria')}</th>
                  <th scope="col">{t('TVSH %')}</th>
                  <th scope="col">{t('Opsionet')}</th>

                </tr>
              </thead>
              <tbody className=' text-nowrap'>
                {filteredProduktet.slice().reverse().map((item, index) => (
                  <tr key={index}>
                    <th scope="row">{filteredProduktet.length - index}</th>
                    <td>{authData.aKaUser == 'admin'
                      ? <Button  variant='' className='hover text-primary text-decoration-underline' style={{color:'#24AD5D',fontSize:'15px'}} 
                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        onClick={() => handleDetaje(item.produktiID)}>{item.shifra}</Button> 
                      : item.shifra}</td>
                    <td>{item.emertimi}</td>
                    <td>{item.pershkrimi}</td>
                    <td>{item.sasiStatike ? t('Sasi Statike') : item.sasia}</td>
                    {authData.aKaUser == 'admin' ? <td>{formatCurrency(item.cmimiBlerjes)}</td> : null}
                    <td>{formatCurrency(item.cmimiShitjes)}</td>
                    <td>{item.komenti}</td>
                    <td>{<Badge bg={item.meFatureTeRregullt == 'po' ? 'success' : 'danger'}>{item.meFatureTeRregullt == 'po' ? t('po') : t('jo')}</Badge>}</td>
                    <td>{item.emertimiKategorise}</td>
                    <td>{item.tvsh} %</td>
                    <td className='d-flex flex-row justify-content-between'>
                    
                      <Button  variant='outline-primary' className='mx-1' onClick={() => thirreNdryshoProduktin(item)}><FontAwesomeIcon icon={faEdit}/></Button>
                        <Button variant='outline-danger' className='mx-1' onClick={() => thirreModalPerPyetje(item.produktiID)} disabled = {item.sasia > 0}>
                          {loading && idPerAnulim === item.produktiID ? (
                            <Spinner animation="border" role="status" size="sm">
                              <span className="visually-hidden">Loading...</span>
                            </Spinner>
                          ) : (
                            <FontAwesomeIcon icon={faTrashCan} />
                          )}
                        </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </Table>
              </div>
          }
      </Row>
      
      <SaveExcelOneSheet  data={filteredProduktet.map((
        { cpu, ram, disku, gpu, kategoriaID,sasia, sasiStatike,produktiID,...rest},index) => ({
          Nr: index + 1,
          Shifra:rest.shifra,
          Emertimi: rest.emertimi,
          Pershkrimi: rest.pershkrimi,
          Sasia: sasiStatike ? t('Sasi Statike') : sasia,
          CmimiBlerjes: formatCurrency(rest.cmimiBlerjes),
          CmimiShitjes: formatCurrency(rest.cmimiShitjes),
          Komenti: rest.komenti,
          MeFatureTeRregullt: rest.meFatureTeRregullt,
          Kategoria: rest.emertimiKategorise,
          TVSH: rest.tvsh + ' %',
        }))} fileName = {t('Stoku')}
      />
      <ShtoNjeProdukt show={showModal} prejardhja={'meRefresh'} handleClose={() => setShowModal(false)} produkti = {produkti} handleConfirm={fetchData}/>
      <ModalPerPyetje show={showModalPerPyetje} handleConfirm={handleConfirmModalPerPyetje} handleClose={handleCloseModalPerPyetje} />
      <ToastContainer />
    </Container>
  );
}
