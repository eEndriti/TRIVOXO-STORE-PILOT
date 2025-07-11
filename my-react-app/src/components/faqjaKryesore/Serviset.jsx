import { useState,useEffect, useContext } from 'react'
import { Container,Button,Row,Col,Modal,Form, Spinner, InputGroup,Table,Card } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashCan,faCheck } from '@fortawesome/free-solid-svg-icons'; 
import ModalPerPyetje from '../ModalPerPyetje'
import { useToast } from '../ToastProvider';
import UpdateServise from '../UpdateServise';
import AuthContext from '../AuthContext';
import {ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';

export default function Serviset() {
  const {t} = useTranslation('faqjaKryesore')
  const [loading,setLoading] = useState(true)
  const [serviset,setServiset] = useState([])
  const [servisetAktive,setServisetAktive] = useState([])
  const [showModal,setShowModal] = useState(false)
  const [burimiThirrjes,setBurimiThirrjes] = useState('')
  const [llojiPerAnulim,setLlojiPerAnulim] = useState('')
  const [idPerAnulim,setIdPerAnulim] = useState('')
  const [modalPerServisUpdate,setModalPerServisUpdate] = useState()
  const [data,setData] = useState('')
  const [updateServisType,setUpdateServisType] = useState()
  const { authData,updateAuthData } = useContext(AuthContext)
  const [buttonLoading,setButtonLoading] = useState(false)
  const showToast = useToast();

  useEffect(() => {

    fetchData();

  }, []);
  const fetchData = async () => {
    setLoading(true)

    try{
      const [servisetFetched] = await Promise.all([
        window.api.fetchTableServisi(),
      ]);

      setServiset(servisetFetched.filter(item => item.statusi === 'Aktiv'))

    }catch(e){
      console.log(e)
    }finally{
      setLoading(false)
    }
  };

  const ndryshoServisin = (data,type) =>{

    setData(data)
    setUpdateServisType(type)
    setModalPerServisUpdate(true)
  }

  const deleteServisin = async () => {
    try {
      const result = await window.api.deleteServisi(idPerAnulim);

        if (result.success) {
          showToast(t("Servisi u anulua me Sukses!"), "success");
          fetchData();       
        } else {
          showToast(t("Gabim gjatë Anulimit!"), "error");
      }
    } catch (error) {
      console.error(t("Gabim gjatë Anulimit!"), error);
    }finally{
      updateAuthData({reloadLayout:!authData.reloadLayout})
      setShowModal(false)
      fetchData()
    }

}


  const thirreModal = (lloji,transaksioniID,burimiThirrjes) =>{
    setShowModal(true)
    setBurimiThirrjes(burimiThirrjes)
    setLlojiPerAnulim(lloji)
    setIdPerAnulim(transaksioniID)
  }

  return (
    <Container fluid >
      <Col>
              <h3 className="section-title">{t('Serviset Aktive')}</h3>
              <div className="table-container">
                <Table responsive striped bordered hover size="sm" className="custom-table">
                  <thead className="table-header">
                    <tr>
                      <th>{t('Nr')}</th>
                      <th>{t('Klienti')}</th>
                      <th>{t('Kontakti')}</th>
                      <th>{t('Data dhe Ora Pranimit')}</th>
                      <th>{t('Komenti')}</th>
                      <th>{t('Pajisjet Percjellëse')}</th>
                      <th>{t('Opsionet')}</th>

                    </tr>
                  </thead>
                  <tbody className='text-nowrap'>
                    {serviset.slice().reverse().map((item, index) => (
                      <tr key={index}>
                        <td>{serviset.length - index}</td>
                        <td>{item.subjekti}</td>
                        <td>{item.kontakti}</td>
                        <td>{item.dataPranimit.toLocaleDateString()} / {item.dataPranimit.toLocaleTimeString()}</td>
                        <td>{item.komenti}</td>
                        <td>{item.pajisjetPercjellese}</td>
                        <td>
                          <Button
                            variant="outline-primary"
                            className="action-btn mx-1"
                            onClick={() => ndryshoServisin(item, 'ndrysho')}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                          <Button
                             variant="outline-danger"
                            className="action-btn mx-1"
                            onClick={() => thirreModal('', item.servisimiID, 'anuloServisin')}
                          >
                            <FontAwesomeIcon icon={faTrashCan} />
                          </Button>
                          <Button
                            variant="outline-success"
                            className="action-btn mx-1"
                            onClick={() => ndryshoServisin(item, 'perfundo')}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Col>

            <ModalPerPyetje
        show={showModal}
        handleClose={() => setShowModal(false)}
        handleConfirm={() => deleteServisin()}
      />
      <UpdateServise show={modalPerServisUpdate} handleClose={() => setModalPerServisUpdate(false)} updateType={updateServisType} data = {data} />  
      <ToastContainer />
    </Container>
  )
}
