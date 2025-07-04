import  { useState, useEffect, useContext } from 'react';
import { Row, Button, Form,Spinner, Container, InputGroup} from 'react-bootstrap';
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import KerkoProduktin from '../stoku/KerkoProduktin';
import AuthContext from '../AuthContext';

export default function NgaStokiNeShpenzim() {
    const [loading,setLoading] = useState(false)
    const [buttonLoading,setButtonLoading] = useState(false)
    const [produktiSelektuar,setProduktiSelektuar] = useState([])
    const [productModal,setProductModal] = useState(true)
    const [llojetShpenzimeve,setLlojetShpenzimeve] = useState({})
    const [sasiaPerProdukt,setSasiaPerProdukt] = useState()
    const [kostoTotale,setKostoTotale] = useState()
    const [kategoriaID,setKategoriaID] = useState()
    const {authData} = useContext(AuthContext)
    const showToast = useToast();
    useEffect(() => {
            const fetchData = async () => {
              setLoading(true)
             try{
                await window.api.fetchTableLlojetShpenzimeve().then(receivedData => {
                    setLlojetShpenzimeve(receivedData);
                    console.log('llojet',llojetShpenzimeve)
                  });
                  
             }catch(e){
                console.log(e)
             }finally{
                setLoading(false)
             }
            }
        
            fetchData()
        
          }, []);

    const handleProductSelect = (product) =>{
        setProduktiSelektuar(product)
        setKategoriaID(handleKategoriaSelectForStokiShpenzim())
      }
      const handleKategoriaSelectForStokiShpenzim = () => {
        return llojetShpenzimeve.find((item) => item.emertimi === 'Produkt')?.llojetShpenzimeveID;
      }

      const kalkuloTotalin = (e) => {
        setSasiaPerProdukt(e.target.value)
        setKostoTotale(produktiSelektuar.cmimiBlerjes * e.target.value)
      }

      
  const handleKaloNgaStoki = async () => {
    setLoading(true)
    setButtonLoading(true)

    const data = {
      cmimiFurnizimit: produktiSelektuar.cmimiBlerjes,
      llojetShpenzimeveID: kategoriaID,
      perdoruesiID: authData.perdoruesiID,
      nderrimiID:authData.nderrimiID,
      produktiID:produktiSelektuar.produktiID,
      sasia:sasiaPerProdukt
    };
    
    try {
      console.log('data',data)
      await window.api.kaloNgaStokuNeShpenzim(data);
      showToast('Produkti u Regjistrua me Sukses si Shpenzim!', 'success');            

    } catch (error) {
      showToast('Gabim gjate regjistrimit: ' ,'error');

    }finally{
      setLoading(false)
      setButtonLoading(false)
      //window.location.reload()

    }

  };

      
    return (
    <Container>
        <Row className='d-flex justify-content-center pt-5'>
            <Form className='d-flex flex-wrap flex-row w-50 justify-content-between bg-light p-4'>
            <Form.Group>
                <Form.Label>Shifra:</Form.Label>
                <Form.Control value={produktiSelektuar.shifra} disabled/>
            </Form.Group>
            <Form.Group>
                <Form.Label>Emertimi:</Form.Label>
                <Form.Control value={produktiSelektuar.emertimi} disabled/>
            </Form.Group>
            <Form.Group>
                <Form.Label>Kosto per Cope:</Form.Label>
                <InputGroup>
                <Form.Control  value={produktiSelektuar.cmimiBlerjes} disabled/>
                <InputGroup.Text>€</InputGroup.Text>
                </InputGroup>
            </Form.Group>
            <Form.Group>
                <Form.Label>Sasia:</Form.Label>
                <Form.Control type='number' min={0} value={sasiaPerProdukt} onChange={(e) => kalkuloTotalin(e)} />
            </Form.Group>
            <Form.Group>
                <Form.Label>Kosto Totale:</Form.Label>
                <InputGroup>
                <Form.Control value={kostoTotale} disabled/>
                <InputGroup.Text>€</InputGroup.Text>
                </InputGroup>
            </Form.Group>
            <Form.Group>
                <Form.Label>Kategoria</Form.Label>
                <Form.Control type='text' disabled value={`Produkt ID:${kategoriaID}`}/>
            </Form.Group>

            <Button variant='success' className='mt-3 w-100' disabled={sasiaPerProdukt < 1 || !sasiaPerProdukt|| buttonLoading || !produktiSelektuar?.shifra} onClick={() => handleKaloNgaStoki()}>{loading ? <><Spinner as="span" animation='border' size='sm' role='status' aria-hidden={true}/>{''}Duke Ruajtur...
            </> :'Ruaj Ndryshimet'}</Button>
            </Form>

            </Row>


             <ToastContainer/>

                  {productModal && (
                          <KerkoProduktin
                            show={productModal}
                            onHide={() => setProductModal(false)}
                            meFatureProp={'ngaStoku'}
                            onSelect={handleProductSelect}
                          />
                        )}   
    </Container>
  )
}
