import React, {useState,useEffect, useContext } from 'react'
import { Container,Row,Col,Form,Button,InputGroup,Spinner, FormGroup } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan,faEdit } from '@fortawesome/free-solid-svg-icons'; 
import AnimatedSpinner from '../AnimatedSpinner';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import ModalPerPyetje from '../ModalPerPyetje'
import NdryshoLlojin from './NdryshoLlojin';
import  AuthProvider  from '../AuthContext';
import { useTranslation } from 'react-i18next';
export default function LlojetShpenzimeve() {
    const {t} = useTranslation('shpenzimi')
    const [loading,setLoading] = useState(true)
    const [buttonLoading,setButtonLoading] = useState(false)
    const [shtoLlojinData,setShtoLlojinData] = useState({emertimi:'' , shumaStandarde:0})
    const [llojetShpenzimeve,setLlojetShpenzimeve] = useState({})
    const [showModalPerPyetje,setShowModalPerPyetje] = useState(false)
    const [showModalPerNdryshim,setShowModalPerNdryshim] = useState(false)
    const [dataPerNdryshim,setDataPerNdryshim] = useState({})
    const [llojetShpenzimeveID,setLlojetShpenzimeveID] = useState() // per delete
    const [dataPerDelete,setDataPerDelete] = useState({})
    const [emertimiSearch,setEmertimiSearch] = useState()
    const showToast = useToast();
    const {authData} = useContext(AuthProvider)

    useEffect(() => {
        
        fetchData()
      
      }, []);
      
      const fetchData = async () => {
        setLoading(true)
       try{
          await window.api.fetchTableLlojetShpenzimeve().then(receivedData => {
              setLlojetShpenzimeve(receivedData);
            });
            
       }catch(e){
          console.log(e)
       }finally{
          setLoading(false)
       }
      }
  

      useEffect(() => {
        if(llojetShpenzimeve.length > 1 && emertimiSearch){
          const filtered = llojetShpenzimeve.filter((item) => item.emertimi.toLowerCase().includes(emertimiSearch.toLowerCase()))
          setLlojetShpenzimeve(filtered)
        }
      },[emertimiSearch])

    const handleShtoDataChange = (e) => {
        const {name,value} = e.target
        setShtoLlojinData({
          ...shtoLlojinData,
          [name]:value
        })
    }

    const shtoLlojinShpenzimit = async () => {
        setLoading(true)
        setButtonLoading(true)
       
        try {
          const data = {
            ...shtoLlojinData,
            perdoruesiID:authData.perdoruesiID,
            nderrimiID:authData.nderrimiID,
          }
          await window.api.insertLlojiShpenzimit(data);
          showToast(t("Lloji i Shpenzimit u Regjistrua me Sukses!"), "success");
          setShtoLlojinData({emertimi:'',shumaStandarde:0})
        } catch (e) {
          showToast(t("Gabim gjate regjistrimit!"), "error"); 
 
        }finally{
          setLoading(false)
          setButtonLoading(false)
          fetchData()
        }
      };

      const handleEditLlojiShpenzimitClick = (item) =>{
       setDataPerNdryshim(item)
       setShowModalPerNdryshim(true)
      }

      const thirreModalPerPyetje = (item) =>{
        setDataPerDelete(item)
        setShowModalPerPyetje(true)
      }

      const handleConfirmModal = () =>{
        handleDelete()
      }

      const handleDelete= async () =>{
              setButtonLoading(true)
              try{
                const data = {
                  ...dataPerDelete,
                  perdoruesiID:authData.perdoruesiID,
                  nderrimiID:authData.nderrimiID,
                }
                  await window.api.deleteLlojiShpenzimit(data)
                  showToast(t("Lloji i Shpenzimit eshte fshirë me sukses !"), "success");
          
              }catch(e){
                showToast(t("Gabim gjate fshirjes!"), "error"); 
 
              }finally{
                  setButtonLoading(false)
                  fetchData()

              }
            }

  return (
    <Container>
         <Row className='d-flex flex-row justify-content-start m-5 '>
            <Col lg={4} className='d-flex flex-column justify-content-start bg-light border p-3'>
            <h3>{t('Shto nje Lloj Shpenzimi')}</h3>
            <Form.Group>
                <Form.Label>{t('Emertimi:')}</Form.Label>
                <Form.Control
                type='text'
                name = 'emertimi'
                placeholder={t('P.sh Mbeturina , Rryme, etj...')}
                value={shtoLlojinData?.emertimi || ''}
                onChange={(e) => handleShtoDataChange(e)}
                />
            </Form.Group>
            <Form.Group>
                <Form.Label>{t('Shuma Standarde:')}</Form.Label>
                <InputGroup>
                    <Form.Control
                    type='number'
                    name = 'shumaStandarde'
                    value={shtoLlojinData?.shumaStandarde || ''}
                    placeholder={t('P.sh 20€ , 50€, etj...')}
                    onChange={(e) => handleShtoDataChange(e)}
                    />
                    <InputGroup.Text>€</InputGroup.Text>
                </InputGroup>
            </Form.Group>

            <Button variant='success' className='my-4' onClick={() => shtoLlojinShpenzimit()} disabled={buttonLoading || !shtoLlojinData.emertimi || !shtoLlojinData.shumaStandarde }>{buttonLoading ? <>
                <Spinner as="span" animation='border' size='sm' role='status' aria-hidden={true}/>{''}{t('Duke Ruajtur...')}
                </>:t('Regjistro Llojin e Shpenzimit')}
            </Button>
            </Col>

            <Col lg = {8} className='tabelaLlojeveShpenzimeve col-xs-12 col-sm-12 col-md-6 col-lg-6 px-5'>
              <Col className='d-flex justify-content-between mb-3'>
                  <h2>{t('Llojet e Shpenzimeve:')}</h2>
                  <Form.Control placeholder={t('Kerko permes Emertimit...')}  value={emertimiSearch} onChange={(e) => setEmertimiSearch(e.target.value)} className='w-50 my-2'/>
              </Col>
              <Col className="table-responsive tabeleMeMaxHeight">
                  <table className="table table-sm table-striped text-center">
                  <thead className="table-light">
                      <tr className='fs-5'>
                      <th scope="col">{t('Nr')}</th>
                      <th scope="col">{t('Emertimi')}</th>
                      <th scope="col">{t('Shuma Standarde')}</th>
                      <th scope="col">{t('Opsionet')}</th>
                      </tr>
                  </thead>
                  <tbody>
                      {loading ? <AnimatedSpinner/>:
                      <>
                      {llojetShpenzimeve.slice().reverse().map((item, index) => (
                      <tr key={index}>
                          <th scope="row">{llojetShpenzimeve.length - index}</th>
                          <td>{item.emertimi}</td>
                          <td>{item.shumaStandarde.toFixed(2)} €</td>
                          <td>
                          <Button onClick={() => handleEditLlojiShpenzimitClick(item)} variant='btn btn-outline-primary'><FontAwesomeIcon icon={faEdit}/></Button>
                          <Button variant='btn btn-outline-danger' disabled = {item.total_shpenzime > 1 } className='mx-1' onClick={() => thirreModalPerPyetje(item)}>
                              <FontAwesomeIcon icon={faTrashCan}/>
                          </Button>
                          </td>
                      </tr>
                      ))}
                      </>}
                  </tbody>
                  </table>
              </Col>
            </Col>
      </Row>

      <ModalPerPyetje show={showModalPerPyetje} handleClose={() => setShowModalPerPyetje(false)} handleConfirm={handleConfirmModal} />
      <NdryshoLlojin show={showModalPerNdryshim} handleClose={() => setShowModalPerNdryshim(false)} dataPerNdryshim={dataPerNdryshim}/>
                      <ToastContainer/>
    </Container>
  )
}
