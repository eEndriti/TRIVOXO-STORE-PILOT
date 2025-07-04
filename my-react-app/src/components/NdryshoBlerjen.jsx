import {useState,useEffect, useContext} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AnimatedSpinner from './AnimatedSpinner'
import { Container,Row,Form,Button,Col, InputGroup,Table, Spinner, Toast, Alert, Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faUndo,faTrashCan,faWarning, faL } from '@fortawesome/free-solid-svg-icons';
import KerkoSubjektin from './subjekti/KerkoSubjektin'
import KerkoProduktin from './stoku/KerkoProduktin'
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';
import ModalPerPyetje from './ModalPerPyetje'
import AuthContext, { formatCurrency } from "../components/AuthContext";

export default function NdryshoBlerjen() {
    const { blerjeID } = useParams()
    const navigate = useNavigate()
    const [loading,setLoading] = useState(true)
    const [blerje,setBlerje] = useState({})
    const [ndryshoSubjektinModul,setNdryshoSubjektinModul] = useState()
    const [selectedSubjekti, setSelectedSubjekti] = useState({ emertimi: "", kontakti: "", subjektiID: null });
    const [inputDisabled,setInputDisabled] = useState(false)
    const [data,setData] = useState({})
    const [produktetFillestare,setProduktetFillestare] = useState([])
    const [products, setProducts] = useState([{}]);
    const [selectedRow, setSelectedRow] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalPerPyetje,setModalPerPyetje] = useState(false)
    const [totaliPerPagese,setTotaliPerPagese] = useState()
    const [totaliPageses,setTotaliPageses] = useState()
    const [totaliTvsh,setTotaliTvsh] = useState()
    const { authData,updateAuthData } = useContext(AuthContext)
    const showToast = useToast()
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const receivedBlerjeData = await window.api.fetchTableQuery( `
						 SELECT b.blerjeID, b.shifra, b.komenti, b.totaliPerPagese,ISNULL(SUM(pg.shumaPageses), 0) AS totaliPagesave,
                            b.mbetjaPerPagese, b.dataBlerjes, b.dataFatures, b.menyraPagesesID, b.perdoruesiID,
                            b.transaksioniID, b.fatureERregullt,b.nrFatures,
                            s.emertimi AS 'subjekti' , s.kontakti, b.subjektiID, m.emertimi AS 'menyraPageses',
                            p.emri AS 'perdoruesi', n.numriPercjelles, n.dataFillimit
                        FROM blerje b
                        JOIN subjekti s ON s.subjektiID = b.subjektiID
                        JOIN menyraPageses m ON m.menyraPagesesID = b.menyraPagesesID
                        JOIN Perdoruesi p ON p.perdoruesiID = b.perdoruesiID
                        JOIN nderrimi n ON n.nderrimiID = b.nderrimiID
						LEFT JOIN pagesa pg ON pg.shifra = b.shifra
                        WHERE b.blerjeID = ${blerjeID}
						GROUP BY 
                        b.blerjeID, b.shifra, b.komenti, b.totaliPerPagese, b.totaliPageses,
                        b.mbetjaPerPagese, b.dataBlerjes, b.dataFatures, b.menyraPagesesID, b.perdoruesiID,
                        b.transaksioniID, b.fatureERregullt, b.nrFatures,
                        s.emertimi, s.kontakti, b.subjektiID, m.emertimi, p.emri, n.numriPercjelles, n.dataFillimit;
                    `);
                setBlerje(receivedBlerjeData);
                setData((prevData) => ({
                    ...prevData,
                    nrFatures: receivedBlerjeData[0].nrFatures,
                    dataBlerjes: formatDate(receivedBlerjeData[0].dataBlerjes),
                    dataFatures: formatDate(receivedBlerjeData[0].dataFatures),
                    fatureERregullt:receivedBlerjeData[0].fatureERregullt,
                    komentiBlerjes:receivedBlerjeData[0].komenti,
                    totaliPerPageseFillestare:receivedBlerjeData[0].totaliPerPagese,
                    totaliPagesesFillestare:receivedBlerjeData[0].totaliPagesave,
                    shifra:receivedBlerjeData[0].shifra,
                  }));
                setTotaliPageses(formatCurrency(receivedBlerjeData[0].totaliPagesave,true))
                setSelectedSubjekti({emertimi:receivedBlerjeData[0].subjekti,subjektiID:receivedBlerjeData[0].subjektiID,kontakti:receivedBlerjeData[0].kontakti})
            } catch (error) {
                showToast('Gabim gjate marrjes se te dhenave', error);
            }finally{
                setLoading(false)
            }

        };
        fetchData();
    }, [blerjeID]);

    useEffect(() => {
        const fetchData = async () => {
          setLoading(true)
            if (blerje && blerje.length > 0) {
                try {
    
                    const productData = await window.api.fetchTableQuery(
                        `select p.produktiID, p.shifra, p.emertimi, p.pershkrimi,p.kategoriaID, b.cmimiPerCope as 'cmimiBlerjes', p.sasia, b.sasia as 'sasiaBlerese' , b.totaliProduktit, b.komenti,b.totaliTvsh,k.tvsh 
                        from produkti p
                        join blerjeProdukt b on b.produktiID = p.produktiID
						            join kategoria k on k.kategoriaID = p.kategoriaID
                        where b.blerjeID = ${blerjeID}`
                    );
                    setProduktetFillestare(productData);
                } catch (error) {
                    showToast('Gabim gjate marrjes se te dhenave!', error);
                }finally{
                  setLoading(false)
                }
            }
        };
    
        fetchData();
    }, [blerje])

    useEffect(() => {
        const shfaqi = async () => {
            if (produktetFillestare && produktetFillestare.length > 0) {
                const updatedProducts = [...products];
    
                produktetFillestare.forEach((product, index) => {
                    updatedProducts[index] = product;
                });
    
                if (updatedProducts.length < produktetFillestare.length + 1) {
                    updatedProducts.push({});
                }
    
                setProducts(updatedProducts);
            }
            setLoading(false);
        };
        shfaqi();
    }, [produktetFillestare]);

    useEffect(() => {
        let totalPerPagese = 0;
        let llogaritjaETvsh = 0;

        products.forEach((product) => {
          const cmimiBlerjes = parseFloat(product.cmimiBlerjes) || 0;
          const sasiaBlerjes = parseFloat(product.sasiaBlerese) || 0;
          const tvsh = parseFloat(product.tvsh) || 0; 
          const totali = cmimiBlerjes * sasiaBlerjes;
      
          const tvshEProduktit = (totali * tvsh) / 100;
          
          llogaritjaETvsh += tvshEProduktit || 0; 
          totalPerPagese += totali;
        });
      
        setTotaliPerPagese(totalPerPagese);
        setTotaliTvsh(llogaritjaETvsh);
        
      }, [products]);
      
  const handleSelectSubjekti = (result) => {
        setSelectedSubjekti({
          emertimi: result.emertimi,
          kontakti: result.kontakti,
          subjektiID: result.subjektiID,
        });
        setNdryshoSubjektinModul(false)
      };

  const handleDataChange = (e) => {
        const { name, value } = e.target;
      
        setData((prevData) => ({
          ...prevData,
          [name]: value, 
        }));
    };

  const openModalForRow = (index) => {
    setSelectedRow(index);
    setShowModal(true);
  };
  const handleDeleteRow = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };
  const handleProductSelect = (product) => {
    const updatedProducts = [...products];
    updatedProducts[selectedRow] = product;

    if (selectedRow === products.length - 1) {
      updatedProducts.push({});
    }

    setProducts(updatedProducts);
    setShowModal(false);
  };

  const formatDate = (dateTime) => {
    const date = new Date(dateTime);
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const NdryshoBlerjen = async () => {
   setInputDisabled(true)
    const dataPerNdryshim = ({
      ...data,
      blerjeID,
      subjektiID:selectedSubjekti.subjektiID,
      products,
      totaliPerPagese,
      totaliPageses,
      mbetjaPerPagese:totaliPerPagese - totaliPageses,
      nderrimiID:authData.nderrimiID,
      perdoruesiID:authData.perdoruesiID
    })
      
    try{
      await window.api.ndryshoBlerje(dataPerNdryshim)
        navigate('/faqjaKryesore/' , {state:{showToast:true , message:'Blerja u ndryshua me sukses!' , type:'success'}})
    }catch(e){
      showToast('Gabim gjate ndryshimit te blerjes!', 'error');
    }finally{
      setInputDisabled(false)
      updateAuthData({reloadLayout:!authData.reloadLayout})

    }
  }
  return (
    <>
        {loading ? <AnimatedSpinner /> : 
    <Container fluid className='mt-4'>
      
         <Row>
            <h4 className='text-center text-secondary fw-bold'>Ndryshimi i Blerjes : {blerjeID}</h4>
        </Row>
        <hr/>
        
        <Row>
            <Col>
                {ndryshoSubjektinModul ? 
                <Col className='d-flex'>
                    <InputGroup >
                            <KerkoSubjektin filter='furnitor' value={selectedSubjekti.emertimi} onSelect={handleSelectSubjekti} />
                            <InputGroup.Text className='bg-transparent  border-0 mx-2' onClick={() => setNdryshoSubjektinModul(false)} style={{cursor:'pointer'}}><FontAwesomeIcon icon={faUndo} className='text-danger fs-4 fw-bold' /></InputGroup.Text>
                    </InputGroup>
                </Col>
                :
                <Form className='d-flex justify-content-start'>
                    <Form.Group>
                        <Form.Label>Subjekti:</Form.Label>
                        <InputGroup >
                            <Form.Control disabled = {true} value={selectedSubjekti.emertimi} />
                            <InputGroup.Text disabled={inputDisabled} onClick={() => setNdryshoSubjektinModul(true)} style={{cursor:'pointer'}}><FontAwesomeIcon icon={faEdit} className='text-primary' /></InputGroup.Text>
                        </InputGroup>
                        
                    </Form.Group>
                    <Form.Group className='mx-2'>
                        <Form.Label>Kontakti:</Form.Label>
                        <Form.Control disabled = {true} value={selectedSubjekti.kontakti} />
                    </Form.Group>
                </Form>}
            </Col>
            
            <Col className='d-flex flex-row justify-content-around'>
                <Form>
                    <Form.Label>Nr. i Fatures</Form.Label>
                    <Form.Control disabled={inputDisabled} type='text' name='nrFatures' onChange={handleDataChange} value={data.nrFatures || ''}/>
                </Form>
                <Form>
                    <Form.Label>Data e Blerjes</Form.Label>
                    <Form.Control disabled={inputDisabled} type='date' name='dataBlerjes' onChange={handleDataChange} value={data.dataBlerjes || ''}/>
                </Form>
                <Form>
                    <Form.Label>Data e Fatures</Form.Label>
                    <Form.Control disabled={inputDisabled} type='date' name='dataFatures' onChange={handleDataChange} value={data.dataFatures || ''}/>
                </Form>                          
            </Col>
        </Row>

        <Row className="mt-5">
                <Col xs={12}>
                  <div className="table-responsive tabeleMeMaxHeight">
                    <Table striped bordered hover size="sm" className="text-center">
                      <thead>
                        <tr className="fs-5">
                          <th scope="col">Nr</th>
                          <th scope="col">Shifra e Produktit</th>
                          <th scope="col">Emertimi</th>
                          <th scope="col">Pershkrimi</th>
                          <th scope="col">Cmimi Blerjes Per Cope</th>
                          <th scope="col">Sasia Aktuale</th>
                          <th scope="col">Sasia e Blerjes</th>
                          <th scope="col">Totali</th>
                          {data.fatureERregullt?
                            <>
                              <th scope="col">TVSH %</th>
                              <th scope="col">TVSH €</th>
                            </>:''}
                          <th scope="col">Komenti</th>
                          <th scope="col">Opsionet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, index) => {
                          const sasiaBlerjes = parseFloat(product.sasiaBlerese) || 0;
                          const totali = (product.cmimiBlerjes * sasiaBlerjes);
                          const tvsh = parseFloat(product.tvsh) || 0; 
                          const tvshEProduktit = ((totali * tvsh) / 100);
                      
                          return (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>
                                {product.shifra || (
                                  <Button onClick={() => openModalForRow(index)}>Kerko</Button>
                                )}
                              </td>
                              <td>{product.emertimi}</td>
                              <td>{product.pershkrimi}</td>
                              {product.cmimiBlerjes == null ? <td></td> : <td>{formatCurrency(product.cmimiBlerjes)}</td>}
                              <td>{product.sasia}</td>
                              <td>
                                <Form.Control className="bg-light border-0" type="number" min={1} value={product.sasiaBlerese || 1}
                                  onChange={(e) => { const updatedProducts = [...products]; updatedProducts[index].sasiaBlerese = e.target.value;setProducts(updatedProducts);
                                  }}
                                />
                              </td>
                              {isNaN(totali) ? <td></td> : <td>{formatCurrency(totali)}</td>}
                              {data.fatureERregullt ? (
                                <>
                                  {tvsh == 0 ? <td></td> : <td>{tvsh} %</td>}
                                  {isNaN(tvshEProduktit) ? <td></td> : <td>{formatCurrency(tvshEProduktit)}</td>} 
                                </>
                              ) : null}
                              <td>
                                <Form.Control className="bg-light border-0" type="text" value={product.komenti}
                                  onChange={(e) => { const updatedProducts = [...products]; updatedProducts[index].komenti = e.target.value;setProducts(updatedProducts);
                                  }}
                                />
                              </td>
                              <td >
                              <span className="text-danger  text-center" onClick={() => handleDeleteRow(index)} style={{ cursor: 'pointer' }}>
                                  {product.shifra && <FontAwesomeIcon className="fs-4 mt-1" icon={faTrashCan} />}
                                </span>                      
                                </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                    {showModal && (
                      <KerkoProduktin
                        show={showModal}
                        onHide={() => setShowModal(false)}
                        meFatureProp = {data.fatureERregullt}
                        onSelect={handleProductSelect}
                      />
                    )}
                  </div>
                </Col>
              </Row>
<br/><br/>

        <Row>
        <Col className="d-flex flex-row justify-content-center align-items-center">
            <Form.Group>
              <Alert variant='danger'>
                <FontAwesomeIcon icon={faWarning} className='mx-2'/>{data.fatureERregullt ? 'Blerja eshte me Fature te Rregullt! ' : 'Blerja nuk eshte me Fature te Rregullt!'}
            </Alert>
            </Form.Group>
        </Col>
        <Col xs={12} md={6} className="d-flex justify-content-center">
          <Form.Control as="textarea" onChange={handleDataChange} name='komentiBlerjes' rows={3} className="p-3" placeholder="Shkruaj komentin..." value={data.komentiBlerjes}/>
        </Col>
      </Row>

      <Row className="section3 my-5 d-flex justify-content-end">
        <Col xs={12} md={6} className="d-flex justify-content-center align-items-end">
            <Button variant="danger" size="lg" className="mx-2 fs-1" onClick={() => navigate('/faqjaKryesore/')} disabled={inputDisabled}>Anulo</Button>
            <Button variant="success" size="lg" className="mx-2 fs-1" 
                disabled={!(selectedSubjekti.subjektiID) || !(products.length>1)  || inputDisabled} 
                onClick={() => setModalPerPyetje(true)} >{inputDisabled ? (
            <>
                <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                />{' '}
                Duke ruajtur...
            </>
            ) : (
            'Ruaj Ndryshimet...'
            )}</Button>
        </Col>

        <Col xs={12} md={6} className="d-flex flex-column align-items-end">
            <div className="d-flex flex-column w-100 justify-content-end">
            <div className="d-flex flex-column w-100">
                {data.fatureERregullt?<>
              <Form.Group as={Row} controlId="totaliTvsh" className="mb-2">
                <Form.Label column xs={6} className="text-end">Totali i TVSH:</Form.Label>
                <Col xs={6}>
                  <InputGroup >
                    <Form.Control
                      type="text"
                      value={formatCurrency(totaliTvsh,true)}
                      readOnly
                    />
                    <InputGroup.Text>€</InputGroup.Text>
                  </InputGroup>
                </Col>
              </Form.Group>
            </>:''}
                <Form.Group as={Row} controlId="totaliPerPageseShuma" className="mb-2">
                <Form.Label column xs={6} className="text-end">Totali Per Pagese:</Form.Label>
                <Col xs={6}>
                    <InputGroup>
                    <Form.Control
                        type="text"
                        value={formatCurrency(totaliPerPagese,true)}
                        readOnly
                    />
                    <InputGroup.Text>€</InputGroup.Text>
                    </InputGroup>
                </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="totaliPageses" className="mb-2">
                <Form.Label column xs={6} className="text-end">Totali Pageses:</Form.Label>
                <Col xs={6}>
                    <InputGroup>
                        <Form.Control disabled={true}
                        type="text"
                        value={totaliPageses}
                        readOnly
                        min={0}
                        />
                        <InputGroup.Text style={{cursor:'pointer'}}  onClick={() => {totaliPageses > 0 ? setTotaliPageses(0)  : setTotaliPageses(totaliPerPagese)}}>€</InputGroup.Text>

                    </InputGroup>
                </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="mbetjaPerPagese" className="mb-2">
                <Form.Label column xs={6} className="text-end">Mbetja Per Pagese:</Form.Label>
                <Col xs={6}>
                    <InputGroup >
                    <Form.Control
                        type="text"
                        value={formatCurrency(totaliPerPagese - totaliPageses,true)}
                        readOnly
                    />
                    <InputGroup.Text>€</InputGroup.Text>
                    </InputGroup>
                </Col>
                </Form.Group>
                
            </div>
            </div>
        </Col>
        </Row>
        <ModalPerPyetje show={modalPerPyetje} handleClose={() => setModalPerPyetje(false)} handleConfirm={NdryshoBlerjen}/>
        <ToastContainer/>
    </Container>}
    </>
  )
}
