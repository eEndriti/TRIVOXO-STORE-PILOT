import React, { useState, useEffect, useContext } from 'react'
import {Modal,Form,Button,Spinner,Col,Row} from 'react-bootstrap'
import AnimatedSpinner from '../AnimatedSpinner'
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import  AuthProvider  from '../AuthContext';
import MenyratPagesesExport from '../MenyratPagesesExport';
import { useTranslation } from 'react-i18next';
export default function NdryshoShpenzimin({show,handleClose,dataPerNdryshim = {}}) {
    const {t} = useTranslation('shpenzimi')
    const [buttonLoading,setButtonLoading] = useState(false)
    const [loading,setLoading] = useState(true)
    const [llojiShpenzimeveSelektuarID,setLlojiShpenzimeveSelektuarID] = useState()
    const [llojetShpenzimeve,setLlojetShpenzimeve] = useState([])
    const [selectedShumaStandarde,setSelectedShumaStandarde] = useState()
    const [data,setData] = useState()
    const showToast = useToast();
    const {authData,updateAuthData} = useContext(AuthProvider)
    useEffect(() => {

        if (!show) return;
        
        const fetchData = async() => {
            try{
                await window.api.fetchTableLlojetShpenzimeve().then(receivedData => {
                    setLlojetShpenzimeve(receivedData);
                    console.log(dataPerNdryshim)
                    setData({
                        ...dataPerNdryshim,
                        menyraPagesesIDFillestare:dataPerNdryshim.menyraPagesesID,
                        menyraPagesesID:''
                    })
                  });
            }catch(e){
                console.log(e)
            }finally{
                setLoading(false)
                ndryshoSelektimin(dataPerNdryshim.llojetShpenzimeveID)
            }
        }

        fetchData()
    },[show])

    const ndryshoSelektimin = (vlera) => {
        setLlojiShpenzimeveSelektuarID(vlera);
       if(llojetShpenzimeve){
        const selectedItem = llojetShpenzimeve.find(item => item.llojetShpenzimeveID == vlera);
        if (selectedItem) {
          setSelectedShumaStandarde(selectedItem.shumaStandarde);
        }
       }
      };

      const handleSelectChange = (event) => {
        ndryshoSelektimin(event.target.value)
      }

     const handleRuajNdryshimet = async () =>{

        setButtonLoading(true)
        let result
        
        try{
            const data2 = {
                llojetShpenzimeveID:llojiShpenzimeveSelektuarID,
                shumaShpenzimit:data?.shumaShpenzimit,
                komenti:data?.komenti,
                transaksioniID:data.transaksioniID,
                shpenzimiID:data.shpenzimiID,
                perdoruesiID:authData.perdoruesiID,
                nderrimiID:authData.nderrimiID,
                shifra:dataPerNdryshim.shifra,
                menyraPagesesID:data.menyraPagesesID,
                menyraPagesesIDFillestare:data.menyraPagesesIDFillestare
              }
              console.log('data2',data2)
              await window.api.ndryshoShpenzimin(data2)
              showToast(t("Ndryshimet u ruajten me sukses!"), 'success')

        }catch(e){
            showToast(t('Gabim gjate ndryshimit: ')+e , 'error');
        }finally{
            setLoading(false)
            setButtonLoading(false)
            handleClose()
            updateAuthData({reloadLayout:!authData.reloadLayout})
            
        }
    }

    const handleInputChange = (target) => {
        const {name,value} = target

        setData({
            ...data,
            [name]:value
        })
        
    }

  return (
   <>
    {loading ? <AnimatedSpinner/> :
    <Modal show={show} onHide={handleClose}>
    <Modal.Header closeButton>
        <Modal.Title>{t('Ndrysho Shpenzimin')}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
        <Form.Group>
        <Form.Label>{t('Shifra:')}</Form.Label>
        <Form.Control
            type="text"
            disabled
            value={dataPerNdryshim.shifra}
        />
        </Form.Group>
        <Col className='d-flex flex-row align-items-center justify-content-between my-2'>
            <Form.Group className='w-75 mx-2'>
                <Form.Label className='mb-2'>{t('Lloji i Shpenzimit:')}</Form.Label>
                    <Form.Select onChange={handleSelectChange}     value={llojiShpenzimeveSelektuarID || ""}  aria-label={t("Selekto nje Lloj Shpenzimi")}>
                        <option value="" disabled selected >{t("Selekto nje Lloj Shpenzimi")}</option>
                        {llojetShpenzimeve.map((item, index) => (
                        <option key={index} value={item.llojetShpenzimeveID}>
                            {item.emertimi}
                        </option>
                        ))}
                    </Form.Select>
            </Form.Group>
            
            <Form.Group>
            <Form.Label>{t('Shuma:')}</Form.Label>
            <Form.Control className=''
                type="number"
                name = 'shumaShpenzimit'
                min={0}
                value={data?.shumaShpenzimit}
                onChange={(e) => handleInputChange(e.target)}
            />
            </Form.Group>
        </Col>
        <Form.Group>
        <Form.Label>{t('Komenti:')}</Form.Label>
        <Form.Control
            as="textarea"
            name = 'komenti'
            value={data?.komenti}
            onChange={(e) => handleInputChange(e.target)}
        />
        </Form.Group>
        <Row className='d-flex flex-row align-items-center justify-content-start my-3'>
            <MenyratPagesesExport updateMenyraPageses={(menyra) => setData({...data,menyraPagesesID:menyra.menyraPagesesID})} selectedMenyra={data.menyraPagesesID} />
        </Row>
    </Modal.Body>
    <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>{t('Mbyll')}</Button>
        <Button variant="primary" onClick={handleRuajNdryshimet} disabled={buttonLoading || data?.shumaShpenzimit < 1 || !data?.shumaShpenzimit || !data.menyraPagesesID}>{buttonLoading ? <>
        <Spinner as="span" animation='border' size='sm' role='status' aria-hidden={true}/>{''}{t('Duke Ruajtur...')}
        </> :t('Ruaj Ndryshimet')}</Button>
    </Modal.Footer>
  </Modal>
  }        <ToastContainer />

      </>
  )
}
