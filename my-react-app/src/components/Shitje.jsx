import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Row, Col, Table, Form, Spinner,InputGroup } from "react-bootstrap";
import KerkoSubjektin from "./subjekti/KerkoSubjektin";
import KerkoProduktin from "./stoku/KerkoProduktin";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';
import AnimatedSpinner from "./AnimatedSpinner";
import {PrintoGarancion} from './PrintoGarancion' 
import AuthContext ,{ formatCurrency } from "../components/AuthContext";
import Cookies from 'js-cookie'

export default function Shitje() {
  const navigate = useNavigate();  
  const [llojiShitjes, setLlojiShitjes] = useState("dyqan");
  const [menyraPagesesID, setMenyraPagesesID] = useState(0);
  const [selectedSubjekti, setSelectedSubjekti] = useState({ emertimi: "", kontakti: "", subjektiID: null });
  const [products, setProducts] = useState([{}]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [totaliPerPagese, setTotaliPerPagese] = useState(0);
  const [totaliPageses, setTotaliPageses] = useState(0);
  const [komentiShitjes, setKomentiShitjes] = useState('');
  const [nrPorosise, setNrPorosise] = useState(0);
  const [menyratPageses, setMenyratPageses] = useState([]);
  const [showShtoProduktinModal, setShowShtoProduktinModal] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [aKaGarancion,setAKaGarancion] = useState(false)
  const [kohaGarancionit,setKohaGarancionit] = useState('6')
  const {authData, updateAuthData} = useContext(AuthContext)
  const showToast = useToast()
  const [triggerReload,setTriggerReload] = useState(false)
  const [parametratGarancionit,setParametratGarancionit] = useState()

  useEffect(() => {
    fetchData()
  }, [triggerReload]);

  const fetchData = async () => {
    try {
      await window.api.fetchTableMenyratPageses().then(receivedData => {
        setMenyratPageses(receivedData);
      })
       await window.api.fetchTableParametrat().then(receivedData => {
        setParametratGarancionit(receivedData)
      })
    } catch (error) {
      showToast('Gabim gjat komunikimit me databaze' + error,'error')
    }finally{
      setLoading(false);

    }
   

  }

  useEffect(() => {
    const total = products.reduce((acc, product) => {
      const cmimiPerCope = parseFloat(product.cmimiPerCope) || 0;
      const sasiaShitjes = parseFloat(product.sasiaShitjes) || 0;
      const cmimiBlerjes = parseFloat(product.cmimiBlerjes) || 0;

      const totali = cmimiPerCope * sasiaShitjes;
      const profit = totali - (cmimiBlerjes * sasiaShitjes);

      product.profiti = profit;

      return acc + totali;
    }, 0);
    if(llojiShitjes == 'dyqan'){
      setTotaliPerPagese(total);
      setTotaliPageses(total)
    }else{
      setTotaliPerPagese(total);
      setTotaliPageses(0)
    }
  }, [products]);

  const handleProductSelect = (product) => {
    const updatedProducts = [...products];
    updatedProducts[selectedRow] = product;
    console.log('prd',product)
    if (selectedRow === products.length - 1) {
      updatedProducts.push({});
    }

    setProducts(updatedProducts);
    setShowModal(false);
  };

  const openModalForRow = (index) => {
    setSelectedRow(index);
    setShowModal(true);
  };

  const handleLlojiShitjesClick = (lloji) => {
    setLlojiShitjes(lloji);
    setTotaliPageses(0);
  };
  
  const handleMenyraPagesesID = (menyraPagesesID) => {
    setMenyraPagesesID(menyraPagesesID);
  };

  const handleSelectSubjekti = (result) => {
    setSelectedSubjekti({
      emertimi: result.emertimi,
      kontakti: result.kontakti,
      subjektiID: result.subjektiID,
    });
  };

  const handleTotaliPagesesChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    if (value <= totaliPerPagese) {
      setTotaliPageses(value);
    } else {
      showToast('Shuma e paguar nuk mund të jetë më e madhe se totali!','error');
    }
  };

  const mbetjaPerPagese = (totaliPerPagese - totaliPageses).toFixed(2);

  const handleAnulo = () => {
    navigate('/faqjaKryesore');
  };

  const handleRegjistro = async () => {
    let returnedShitjeID;

    if (!authData.perdoruesiID || !menyraPagesesID || !selectedSubjekti?.subjektiID || !products?.length) {
      showToast('Të gjitha fushat e nevojshme duhet të plotësohen!','warning');
      return;
    }
  
    setLoading(true);  
    let statusiShitjes
    let message
    const data = {
      lloji: llojiShitjes,
      komenti: komentiShitjes,
      totaliPerPagese: totaliPerPagese,
      totaliPageses: totaliPageses,
      mbetjaPerPagese: mbetjaPerPagese,
      nrPorosise: nrPorosise, 
      menyraPagesesID: menyraPagesesID,
      perdoruesiID: authData.perdoruesiID,
      subjektiID: selectedSubjekti.subjektiID,
      emertimiSubjektit:selectedSubjekti.emertimi,
      kontaktiSubjektit:selectedSubjekti.kontakti,
      nderrimiID:authData.nderrimiID,
      kohaGarancionit:aKaGarancion ? kohaGarancionit:0,
      produktet:products.slice(0, products.length - 1).map((product,index) => ({
        nr:index+1,
        shifraProduktit: product.shifra,
        emertimiProduktit: product.emertimi,
        pershkrimiProduktit: product.pershkrimi,
        produktiID: product.produktiID,
        sasiaShitjes: product.sasiaShitjes,
        cmimiPerCope: formatCurrency(product.cmimiShitjes,true),
        profiti: product.profiti,
        vleraTotaleProduktit: formatCurrency(product.cmimiShitjes * product.sasiaShitjes,true),
        komentiProduktit:product.komenti,
        meFatureTeRregullt:product.meFatureTeRregullt,
        tvsh:product.tvsh,
        cmimiBlerjes:product.cmimiBlerjes,
        sasiStatike:product.sasiStatike
      }))      
    };
  
    try {
      const result = await window.api.insertShitje(data);
      if (result.success) {
        returnedShitjeID = result.shitjeID
        statusiShitjes = 'success'
        message = 'Shitja u regjistrua me sukses!'
        navigate('/faqjaKryesore/' , {state:{showToast:true , message:message , type:statusiShitjes}})

        if(aKaGarancion){
          const shifra = result.shifra
          const dataPerGaranacion ={
            ...parametratGarancionit,
            pdfFolder:authData.pdfFolder
          }
           PrintoGarancion(data,dataPerGaranacion,shifra)
        
      } else {
        statusiShitjes = 'error'
        message = 'Gabim gjate regjistrimit: ' + result.error
      }}
    } catch (error) {
      showToast('Gabim gjate komunikimit me server: ' + error.message , 'error');
    } finally {
      setLoading(false);
      Cookies.set('shitjaFunditID', returnedShitjeID);
      updateAuthData({reloadLayout:!authData.reloadLayout})
    }
  };
  

  const handleDeleteRow = (index) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
  };

  const handleKomentiShitjesChange = (event) => {
    setKomentiShitjes(event.target.value);
  };

  const handleNrPorosiseChange = (event) => {
    setNrPorosise(event.target.value);
  };

 
const kontrolloValidetin = () => {
  let vlera = true

  !(selectedSubjekti.subjektiID) || !(products.length>1) 
  || !(menyraPagesesID) || loading || 
  (llojiShitjes == 'online' && nrPorosise.length < 3) || products.some(product => product.sasiaShitjes == 0) ? vlera = true : vlera = false

  return vlera
}

  return (
    <>
    {menyratPageses.length < 1 ? <AnimatedSpinner /> : 

    <Container fluid className="mt-5 d-flex flex-column" style={{ minHeight: "95vh" }}>
      <Row className="d-flex flex-row justify-content-between">
            <Col className="w-100">
              <Form.Group as={Row} controlId="subjekti" className="mb-2  ">
                <Form.Label column xs={6} className="text-start w-auto">Subjekti:</Form.Label>
                <Col xs={6} className="w-75 ">
                  <KerkoSubjektin filter='klient'  value={selectedSubjekti.emertimi} onSelect={handleSelectSubjekti} />
                </Col>
              </Form.Group>
              <Form.Group as={Row} controlId="kontakti" className="mb-2">
                <Form.Label column xs={6} className="text-start w-auto">Kontakti:</Form.Label>
                <Col xs={6} className="w-75">
                  <Form.Control disabled type="text" value={selectedSubjekti.kontakti} />
                </Col>
              </Form.Group>
            </Col>
            <Col className="d-flex flex-row justify-content-end">
              <Button
                variant={llojiShitjes === "dyqan" ? "primary" : "outline-primary"}
                size="lg"
                className="mx-1 w-25"
                onClick={() => handleLlojiShitjesClick("dyqan")}
              >
                Shitje ne Dyqan
              </Button>
              <Button
                variant={llojiShitjes === "online" ? "primary" : "outline-primary"}
                size="lg"
                className="mx-1 w-25"
                onClick={() => handleLlojiShitjesClick("online")}
              >
                Shitje Online
              </Button>
            </Col>
        <Col className=" d-flex flex-row justify-content-end">
          <Button variant="info" className="text-dark border fs-5 p-4 m-2" onClick={() => navigate('/shitjet')}>Te Gjitha Shitjet</Button>
        </Col>
      </Row>

      <Row className="mt-5">
        <Col xs={12}>
          <div className="table-responsive tabeleMeMaxHeight">
            <Table striped bordered hover size="sm">
              <thead>
                <tr className="fs-5">
                  <th scope="col">Nr</th>
                  <th scope="col">Shifra</th>
                  <th scope="col">Emertimi</th>
                  <th scope="col">Pershkrimi</th>
                  <th scope="col">Cmimi Per Cope</th>
                  <th scope="col">Sasia e Disponueshme</th>
                  <th scope="col">Sasia e Shitjes</th>
                  <th scope="col">Totali</th>
                  <th scope="col">Komenti</th>
                  <th scope="col">Opsionet</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => {
                  const cmimiPerCope = parseFloat(product.cmimiPerCope) || 0;
                  const sasiaShitjes = parseFloat(product.sasiaShitjes) || 0;
                  const totali = (cmimiPerCope * sasiaShitjes).toFixed(2);

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
                      <td>
                        <Form.Control className="bg-light border-0"
                          type="number"
                          value={product.cmimiPerCope || ''}
                          onChange={(e) => {
                            const updatedProducts = [...products];
                            updatedProducts[index].cmimiPerCope = e.target.value;
                            setProducts(updatedProducts);
                          }}
                        />
                      </td>
                      <td>{product.sasia}</td>
                      <td>
                        <Form.Control className="bg-light border-0"
                          type="number"
                          min={0}
                          max={product.sasia}
                          value={product.sasiaShitjes || ''}
                          onChange={(e) => {
                            const newValue = Math.min(Number(e.target.value), product.sasia);
                            const updatedProducts = [...products];
                            updatedProducts[index] = {
                              ...updatedProducts[index],
                              sasiaShitjes: newValue
                            };
                            setProducts(updatedProducts);
                          }}
                        />
                      </td>
                      <td>{totali}</td>
                      <td>
                        <Form.Control className="bg-light border-0"
                          type="text"
                          value={product.komenti || ''}
                          onChange={(e) => {
                            const updatedProducts = [...products];
                            updatedProducts[index].komenti = e.target.value;
                            setProducts(updatedProducts);
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
                meFatureProp={null}
                onSelect={handleProductSelect}
              />
            )}
          </div>
        </Col>
      </Row>


      <Row className="mt-auto section2 d-flex justify-content-around bg-light py-4">
        <Col xs={12} md={6} className="d-flex flex-column align-items-center mb-3 mb-md-0">
          <h5 className="text-center mb-3">
            Shtype Garancionin
            <Form.Check 
              className="px-3 ms-2 fs-4 "
              
              inline 
              onClick={() => setAKaGarancion(!aKaGarancion)} 

            />
          </h5>
          {aKaGarancion && (
            <div className="d-flex align-items-center justify-content-center">
              <Form.Control 
                type="number" 
                className="me-2 w-50 w-md-25" 
                placeholder="Muaj" 
                min={1}
                max = {99}
                value={kohaGarancionit}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value >= 1) {
                    setKohaGarancionit(value);
                  }
                }}
              />

              <p className="mb-0">Muaj</p>
            </div>
          )}
        </Col>
        
        <Col xs={12} md={6} className="d-flex justify-content-center">
          <Form.Control 
            as="textarea" 
            onChange={handleKomentiShitjesChange} 
            rows={3} 
            className="p-3 w-100 w-md-75" 
            placeholder="Shkruaj komentin..." 
          />
        </Col>
      </Row>

      <Row className="section3 my-5 d-flex justify-content-end">
      <Col xs={12} md={6} className="d-flex justify-content-center align-items-end">
        <Button variant="danger" size="lg" className="mx-2 fs-1" onClick={handleAnulo}>Anulo</Button>
        <Button variant="success" size="lg" className="mx-2 fs-1" 
        disabled={kontrolloValidetin()} 
        onClick={handleRegjistro} >{loading ? (
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
          'Regjistro...'
        )}</Button>
      </Col>
      <Col xs={12} md={6} className="d-flex flex-column align-items-end">
        <div className="d-flex flex-column w-100 justify-content-end">
          <div className="d-flex flex-column w-100">
            
            <Form.Group as={Row} controlId="totaliPerPageseShuma" className="mb-2">
              <Form.Label column xs={6} className="text-end">Totali Per Pagese:</Form.Label>
              <Col xs={6}>
                <InputGroup>
                  <Form.Control
                    type="number"
                    value={totaliPerPagese.toFixed(2)}
                    readOnly
                  />
                  <InputGroup.Text>€</InputGroup.Text>
                </InputGroup>
              </Col>
            </Form.Group>
            {llojiShitjes == 'dyqan'? <>
              <Form.Group as={Row} controlId="totaliPageses" className="mb-2">
              <Form.Label column xs={6} className="text-end">Totali Pageses:</Form.Label>
              <Col xs={6}>
                <InputGroup>
                    <Form.Control
                      type="number"
                      value={totaliPageses}
                      onChange={handleTotaliPagesesChange}
                      min={0}
                    />
                    <InputGroup.Text style={{cursor:'pointer'}} onClick={() => {totaliPageses > 0 ? setTotaliPageses(0) : setTotaliPageses(totaliPerPagese)}}>€</InputGroup.Text>

                 </InputGroup>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="mbetjaPerPagese" className="mb-2">
              <Form.Label column xs={6} className="text-end">Mbetja Per Pagese:</Form.Label>
              <Col xs={6}>
                <InputGroup >
                  <Form.Control
                    type="number"
                    value={mbetjaPerPagese}
                    readOnly
                  />
                  <InputGroup.Text>€</InputGroup.Text>
                </InputGroup>
              </Col>
            </Form.Group>
            </>:
            <Form.Group as={Row} controlId="nrPorosiseShuma" className="mb-2">
            <Form.Label column xs={6} className="text-end">Nr. Porosise:</Form.Label>
            <Col xs={6}>
            <Form.Control
              type="text"  // Use "text" instead of "number"
              value={nrPorosise}
              maxLength={15}  // Set maxLength to 8
              onChange={(e) => {
                const value = e.target.value;
                if (/^\d*$/.test(value)) {
                  handleNrPorosiseChange(e);
                }
              }}
            />
            </Col>
          </Form.Group>
          }
          </div>
          <div className="d-flex flex-row justify-content-end">
              {menyratPageses.map((menyraPageses) => (
              
              <Button
                key={menyraPageses.menyraPagesesID}
                onClick={() => handleMenyraPagesesID(menyraPageses.menyraPagesesID)}
                className={menyraPagesesID === menyraPageses.menyraPagesesID ? 'bg-primary mx-2' : 'mx-2 bg-transparent text-primary'}
              >
                {menyraPageses.emertimi}
              </Button>
            ))}
          </div>
        </div>
      </Col>
    </Row>
    

      

      <ToastContainer/>
    </Container> }
    </>
  );
}
