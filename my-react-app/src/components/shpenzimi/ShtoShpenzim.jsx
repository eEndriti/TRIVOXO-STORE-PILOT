import  { useState, useEffect, useContext } from 'react';
import { Row, Col, Button, Form,Spinner, Container, InputGroup} from 'react-bootstrap';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import MenyratPagesesExport from '../MenyratPagesesExport';
import AuthContext from '../AuthContext';
import { useTranslation } from 'react-i18next';
export default function ShtoShpenzim() {
    const {t} = useTranslation('shpenzimi')
    const [llojetShpenzimeve, setLlojetShpenzimeve] = useState([]);
    const [llojiShpenzimeveSelektuarID, setLlojiShpenzimeveSelektuarID] = useState();
    const [selectedShumaStandarde, setSelectedShumaStandarde] = useState();
    const [komenti, setKomenti] = useState('');
    const [loading,setLoading] = useState(false)
    const {authData,updateAuthData} = useContext(AuthContext)
    const [buttonLoading,setButtonLoading] = useState(false)
    const showToast = useToast()
    const [triggerReload,setTriggerReload] = useState(false)
    const [menyraPagesesID,setMenyraPagesesID] = useState()

    useEffect(() => {
      fetchData()
    }, [triggerReload]);
  
    const fetchData = async () => {    
      await window.api.fetchTableLlojetShpenzimeve().then(receivedData => {
        setLlojetShpenzimeve(receivedData);
      });
    }
    
    const handleSelectChange = (event) => {
      const selectedValue = event.target.value;
      setLlojiShpenzimeveSelektuarID(selectedValue);
      const selectedItem = llojetShpenzimeve.find(item => item.llojetShpenzimeveID == selectedValue);
      if (selectedItem) {
        setSelectedShumaStandarde(selectedItem.shumaStandarde);
      }
    };
  
    const shtoShpenzimin = async () => {
      setButtonLoading(true)
      const data = {
        shumaShpenzimit: selectedShumaStandarde,
        komenti: komenti,
        llojetShpenzimeveID: llojiShpenzimeveSelektuarID,
        perdoruesiID: authData.perdoruesiID,
        nderrimiID:authData.nderrimiID,
        menyraPagesesID
      };
      try {
        console.log(data)
        await window.api.insertShpenzimi(data);
        showToast(t("Shpenzimi u Regjistrua me Sukses!"), 'success');            

      } catch (e) {
        showToast(t('Gabim gjate regjistrimit!') ,'error');

      }finally{
        setLoading(false)
        setButtonLoading(false)
        setTriggerReload(true)
        updateAuthData({reloadLayout:!authData.reloadLayout,reloadShpenzimi:!authData.reloadShpenzimi})

      }
    }
  
  return (
    <Container>
        <Row >
                <Col className='d-flex flex-column justify-content-start bg-light border rounded p-4 shadow-sm '>
                  <h3 className='text-center mb-4'>{t('Shto nje Shpenzim')}</h3>
        
                  <Form className='d-flex flex-column align-items-center justify-content-center'>
                    
                   <Col className='d-flex flex-row align-items-center justify-content-around'>
                    <Form.Group className='mb-4 w-100'>
                        <Form.Label className='mb-2'>{t('Lloji i Shpenzimit')}</Form.Label>
                        <Form.Select
                          onChange={handleSelectChange}
                          aria-label={t("Selekto nje Lloj Shpenzimi")}
                          value={llojiShpenzimeveSelektuarID}
                        >
                          <option value="" >{t('Selekto nje Lloj Shpenzimi')}</option>
                          {llojetShpenzimeve.map((item, index) => (
                            <option key={index} value={item.llojetShpenzimeveID}>
                              {item.emertimi}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
          
                      <Form.Group className='mb-4 w-75 mx-2'>
                        <Form.Label className='mb-2'>{t('Shuma per Shpenzim')}</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type='number'
                            placeholder={t('P.sh 20,50,etj...')}
                            value={selectedShumaStandarde}
                            onChange={(e) => setSelectedShumaStandarde(e.target.value)}
                            min="1"
                          />
                          <InputGroup.Text>€</InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                     </Col>
        
                    <Form.Group className='mb-4 w-100'>
                      <Form.Label className='mb-2'>{t('Komenti i Shpenzimit')}</Form.Label>
                      <Form.Control
                        as='textarea'
                        rows={3}
                        placeholder={t('Opsionale nese deshironi te tregoni arsyen...')}
                        onChange={(e) => setKomenti(e.target.value)}
                      />
                    </Form.Group>

                    <div className="d-flex flex-row justify-content-end">
                       <MenyratPagesesExport updateMenyraPageses={(menyra) => setMenyraPagesesID(menyra.menyraPagesesID)} />
                    </div>
        
                    {/* Submit Button */}
                    <Button
                      variant='success'
                      className='w-100 mt-3'
                      onClick={() => shtoShpenzimin()}
                      disabled={loading || selectedShumaStandarde < 1 || !llojiShpenzimeveSelektuarID || buttonLoading || !menyraPagesesID}
                    >
                      {loading ? (
                        <>
                          <Spinner as="span" animation='border' size='sm' role='status' aria-hidden={true} /> 
                          {t(`Duke Ruajtur...`)}
                        </>
                      ) : (
                        t('Regjistro')
                      )}
                    </Button>
                  </Form>
                </Col>
              </Row>
    </Container>
  )
}
