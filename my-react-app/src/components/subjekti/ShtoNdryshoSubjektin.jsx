import { useContext, useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import AuthProvider from '../AuthContext';
import { useTranslation } from 'react-i18next';

export default function ShtoNdryshoSubjektin({show,handleClose,data = {}}) {

    const {t} = useTranslation('subjekti')
    const [loading,setLoading] = useState()
    const [inputEmertimi,setInputEmertimi] = useState('')
    const [inputKontakti,setInputKontakti] = useState('')
    const {authData} = useContext(AuthProvider)
    const showToast = useToast()
    useEffect(() => {
      setInputEmertimi(data.inputEmertimi || ''); // Default to an empty string
      setInputKontakti(data.inputKontakti || ''); // Default to an empty string
  }, [data]);
  

    const handleSubmit = () =>{
        if(data.ndrysho){
            handleNdryshoSubjektin()
        }else 
            handleShtoSubjektin()
    }
    const handleNdryshoSubjektin = async () => {
        setLoading(true)
        if(inputEmertimi.length > 1 && inputKontakti.length > 1){
            const dataPerNdryshim={
                emertimi:inputEmertimi,
                kontakti:inputKontakti,
                subjektiID:data.idPerNdryshim,
                perdoruesiID:authData.perdoruesiID,
                nderrimiID:authData.nderrimiID
            }
            try {
                const result = await window.api.ndryshoSubjektin(dataPerNdryshim);
                if (result.success) {
                  showToast(`${data.lloji == 'klient' ? t('Klienti') : t('Furnitori')} ${t('u Ndryshua me Sukses!')}`, 'success'); 
                } else {
                  showToast(t('Gabim gjate Ndryshimit:') + result.error , 'error');
                }
              } catch (error) {
                showToast(t('Gabim gjate komunikimit me server:') + error.message , 'error');
              } finally {
                setLoading(false);
              }
        }else{
            showToast(t('Plotesoni fushat me më shume karaktere!'), 'warning')
            setLoading(false)
        }
      };

    const handleShtoSubjektin = async () => {
        setLoading(true)
        if(inputEmertimi.length > 1 && inputKontakti >= 0){
            const dataPerInsert={
                emertimi:inputEmertimi,
                kontakti:inputKontakti,
                lloji:data.lloji,
                perdoruesiID:authData.perdoruesiID,
                nderrimiID:authData.nderrimiID
            }
            try {
                const result = await window.api.insertSubjekti(dataPerInsert);
                if (result.success) {
                  showToast(t('Klienti u Regjistrua me Sukses!'), 'success'); 
                } else {
                  showToast(t('Gabim gjate regjistrimit:') + result.error , 'error');
                }
              } catch (error) {
                showToast(t('Gabim gjate komunikimit me server:') + error.message , 'error');
              } finally {
                setLoading(false);
                handleClose(true)
              }
        }else{
          showToast(t('Plotesoni fushat me më shume karaktere!'), 'warning')
            setLoading(false)
        }
      };

      const kontrolloValidetin = () => {
        return (
            loading || 
            inputEmertimi.trim().length < 0 || 
            inputKontakti.trim().length < 0
        );
    };
    

  return (
    <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>{data.ndrysho ? t('Ndrysho'): t('Shto')} {t('nje')} {data.lloji == 'klient' ? t('Klient') : t('Furnitor')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form>
                <Form.Group className='mb-3'>
                    <Form.Label className='fw-bold'>{t('Emertimi')}:</Form.Label>
                    <Form.Control type='text' defaultValue={data.inputEmertimi} onChange={(e) => setInputEmertimi(e.target.value)} placeholder={data.lloji == 'klient' ? t('Emertimi i Klientit...'):t('Emertimi i Furnitorit...')} /> 
                </Form.Group>
                <Form.Group className='mb-3 fw-bold'>
                    <Form.Label>{t('Kontakti')}:</Form.Label>
                    <Form.Control type='number' defaultValue={data.inputKontakti} onChange={(e) => setInputKontakti(e.target.value)} placeholder={data.lloji == 'klient' ? t('Kontakti i Klientit...'):t('Kontakti i Furnitorit...')} /> 
                </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant='secondary' onClick={handleClose}>
                {t('Anulo')}
            </Button>
            <Button variant='primary' onClick={handleSubmit} disabled={kontrolloValidetin()}>
            {loading ? (
                <>
                <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                />{' '}
                {t('Duke ruajtur...')}
                </>
            ) : <>
                {data.ndrysho ? t('Ruaj Ndryshimet...') : <>{data.lloji == 'klient' ? t('Shto Klientin') : t('Shto Furnitorin')}</>}
                </>}
                
            </Button>
        </Modal.Footer>
        <ToastContainer/>
    </Modal>
  )
}
