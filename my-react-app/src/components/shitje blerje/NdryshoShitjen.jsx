import {useState,useEffect, useContext} from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AnimatedSpinner from '../AnimatedSpinner'
import { Container,Row,Form,Button,Col, InputGroup,Table, Spinner } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faUndo,faTrashCan } from '@fortawesome/free-solid-svg-icons';
import KerkoSubjektin from '../subjekti/KerkoSubjektin'
import KerkoProduktin from '../stoku/KerkoProduktin'
import {ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import ModalPerPyetje from '../ModalPerPyetje'
import AuthContext, { formatCurrency } from "../AuthContext";
import { PrintoGarancion } from '../PrintoGarancion'
import { useTranslation } from 'react-i18next'
export default function NdryshoShitjen() {
    const {t} = useTranslation('shitjeblerje')
    const { shitjeID } = useParams()
    const navigate = useNavigate()
    const [shitje,setShitje] = useState([])
    const [loading , setLoading] = useState(true)
    const [llojiShitjes,setLlojiShitjes] = useState('')
    const [selectedSubjekti, setSelectedSubjekti] = useState({ emertimi: "", kontakti: "", subjektiID: null });
    const [products, setProducts] = useState([{}]);
    const [showModal, setShowModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [dataShitjes,setDataShitjes] = useState()
    const [ndryshoSubjektinModul,setNdryshoSubjektinModul] = useState(false)
    const [produktetFillestare,setProduktetFillestare] = useState([])
    const [aKaGarancion,setAKaGarancion] = useState(false)
    const [kohaGarancionit,setKohaGarancionit] = useState(6)
    const [komentiShitjes,setKomentiShitjes] = useState()
    const [menyraPagesesID,setMenyraPagesesID] = useState()
    const [menyratPageses,setMenyratPageses] = useState([])
    const [totaliPerPagese,setTotaliPerPagese] = useState()
    const [totaliPageses,setTotaliPageses] = useState()
    const [totaliPagesesFillestare,setTotaliPagesesFillestare] = useState()
    const [totaliPerPageseFillestare,setTotaliPerPageseFillestare] = useState()
    const [mbetjaPerPagese,setMbetjaPerPagese] = useState()
    const [nrPorosise,setNrPorosise] = useState()
    const [modalPerPyetje,setModalPerPyetje] = useState(false)
    const [inputDisabled,setInputDisabled] = useState(false)
    const {authData,updateAuthData} = useContext(AuthContext)
    const [shitjeProdukti,setShitjeProdukti] = useState()
    const [llojiFillestarIShitjes,setLlojiFillestarIShitjes] = useState()
    const showToast = useToast()
    const [kostoPostes,setKostoPostes] = useState()
    const [totaliPranuar,setTotaliPranuar] = useState()
    const [oldKostoPostes,setOldKostoPostes] = useState()
    const [parametratGarancionit,setParametratGarancionit] = useState()
    useEffect(() => {
       
        fetchData();
    }, [shitjeID]);


    const fetchData = async () => {
        try {
            const receivedData = await window.api.fetchTableQuery( ` SELECT sh.shitjeID, sh.shifra, sh.lloji, sh.komenti, sh.totaliPerPagese, sh.totaliPageses,
                        sh.mbetjaPerPagese, sh.dataShitjes, sh.menyraPagesesID, sh.perdoruesiID,
                        sh.transaksioniID, sh.kohaGarancionit, sho.nrPorosise, sho.statusi, pr.profitiID,
                        s.emertimi AS 'subjekti', sh.subjektiID, m.emertimi AS 'menyraPageses',
                        p.emri AS 'perdoruesi', n.numriPercjelles, n.dataFillimit
                    FROM shitje sh
                    JOIN subjekti s ON s.subjektiID = sh.subjektiID
                    JOIN menyraPageses m ON m.menyraPagesesID = sh.menyraPagesesID
                    JOIN Perdoruesi p ON p.perdoruesiID = sh.perdoruesiID
                    JOIN nderrimi n ON n.nderrimiID = sh.nderrimiID
                    join profiti pr on pr.transaksioniID = sh.transaksioniID
                    LEFT JOIN shitjeOnline sho ON sho.shitjeID = sh.shitjeID
                    WHERE sh.shitjeID = ${shitjeID}
                `);
            setShitje(receivedData);

            const shitjeProdukti = await window.api.fetchTableQuery( ` select * from shitjeProdukti
                where shitjeID = ${shitjeID}
                `);
            setShitjeProdukti(shitjeProdukti);

            await window.api.fetchTableParametrat().then(receivedData => {
                setParametratGarancionit(receivedData)
              })
        } catch (error) {
            showToast(t('Gabim gjate marrjes se te dhenave!') + error , 'error');
        }finally{
            setLoading(false)
        }

    };

    useEffect(() => {
        const fetchData = async () => {
            if (shitje && shitje.length > 0) {
                try {
                    const subjectData = await window.api.fetchTableQuery(
                        `select * from subjekti where subjektiID = ${shitje[0].subjektiID}`
                    );
                    handleSelectSubjekti(subjectData[0]);
    
                    const productData = await window.api.fetchTableQuery(
                        `select p.produktiID, p.shifra,p.meFatureTeRregullt, p.cmimiBlerjes,p.emertimi, p.pershkrimi, shp.cmimiShitjesPerCope as 'cmimiPerCope', p.sasia, shp.sasia as 'sasiaShitjes', shp.totaliProduktit, shp.komenti , p.sasiStatike,k.tvsh
                        from produkti p
                        join shitjeProdukti shp on shp.produktiID = p.produktiID
						join kategoria k on k.kategoriaID = p.kategoriaID
                        where shp.shitjeID = ${shitjeID}`
                    );
                    setProduktetFillestare(productData);
    
                    const menyratPagesesData = await window.api.fetchTableMenyratPageses();
                    setMenyratPageses(menyratPagesesData)

                    setLlojiShitjes(shitje[0].lloji);
                    
                    setDataShitjes(shitje[0].dataShitjes.toISOString().slice(0, 10));
                    setKomentiShitjes(shitje[0].komenti)
                    if(shitje[0].kohaGarancionit > 0) {
                        setAKaGarancion(true)
                        setKohaGarancionit(shitje[0].kohaGarancionit)
                    }
                    setTotaliPerPagese(shitje[0].totaliPerPagese)
                    setTotaliPageses(shitje[0].totaliPageses)
                    setTotaliPagesesFillestare(shitje[0].totaliPageses)
                    setTotaliPerPageseFillestare(shitje[0].totaliPerPagese)
                    setMbetjaPerPagese(shitje[0].mbetjaPerPagese)
                    setMenyraPagesesID(shitje[0].menyraPagesesID)
                    setNrPorosise(shitje[0].nrPorosise)
                    setLlojiFillestarIShitjes(shitje[0].lloji)
                    setKostoPostes(shitje[0].totaliPerPagese-shitje[0].totaliPageses)
                    setOldKostoPostes(shitje[0].totaliPerPagese-shitje[0].totaliPageses)
                    
                } catch (error) {
                    showToast(t('Gabim gjate marrjes se te dhenave!') + error , 'error');
                }
            }
        };
    
        fetchData();
    }, [shitje])

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
        const profitii = 0

        const total = products.reduce((acc, product) => {
          const cmimiPerCope = parseFloat(product.cmimiPerCope) || 0;
          const sasiaShitjes = parseFloat(product.sasiaShitjes) || 0;
          const cmimiBlerjes = parseFloat(product.cmimiBlerjes) || 0;
          const totali = cmimiPerCope * sasiaShitjes;
          const profit = totali - cmimiBlerjes * sasiaShitjes;
          /*const profit = totali - (cmimiBlerjes * sasiaShitjes);*/
    
          product.profiti = profit;
    
          return acc + totali;
        }, 0);
        setTotaliPerPagese(total);
        setTotaliPageses(totaliPagesesFillestare)
      }, [products]);

      useEffect(() => {
        setTotaliPranuar(totaliPerPagese - kostoPostes)
        setTotaliPageses(totaliPerPagese - kostoPostes)
        setMbetjaPerPagese(0)
      },[kostoPostes])


      const handleSelectSubjekti = (result) => {
        setSelectedSubjekti({
          emertimi: result.emertimi,
          kontakti: result.kontakti,
          subjektiID: result.subjektiID,
        });
        setNdryshoSubjektinModul(false)
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
      

      const openModalForRow = (index) => {
        setSelectedRow(index);
        setShowModal(true);
      };

      const handleDeleteRow = (index) => {
        const updatedProducts = products.filter((_, i) => i !== index);
        setProducts(updatedProducts);
      };

      const handleTotaliPagesesChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        if (value <= totaliPerPagese) {
          setTotaliPageses(value);
        } else {
            showToast(t('Shuma e paguar nuk mund të jetë më e madhe se totali!'),'warning');
        }
      };

      useEffect(() => {
        setMbetjaPerPagese(totaliPerPagese - totaliPageses)
      },[totaliPageses])
      

      const handleMenyraPagesesID = (menyraPagesesID) => {
        setMenyraPagesesID(menyraPagesesID);
      };
      
      const handleConfirmModal = () => {
        handleRuajNdryshimet()
      }

      const handleRuajNdryshimet = async () => {
        setInputDisabled(true)


        if (!authData.perdoruesiID || !menyraPagesesID || !selectedSubjekti?.subjektiID || !products?.length) {
            showToast(t('Të gjitha fushat e nevojshme duhet të plotësohen!'),'warning');
          return;
        }
      
        setLoading(true);
        products.pop()  
        const data = {
          shitjeID,
          shifra:shitje[0].shifra,
          transaksioniIDFillestar:shitje[0].transaksioniID,
          menyraPagesesIDFillestare:shitje[0].menyraPagesesID,
          lloji: llojiShitjes,
          komenti: komentiShitjes,
          totaliPerPagese,
          totaliPerPageseFillestare,
          totaliPageses,
          totaliPagesesFillestare,
          mbetjaPerPagese :totaliPerPagese - totaliPageses,
          nrPorosise,
          menyraPagesesID,
          perdoruesiID:authData.perdoruesiID,
          subjektiID: selectedSubjekti.subjektiID,
          emertimiSubjektit:selectedSubjekti.emertimi,
          kontaktiSubjektit:selectedSubjekti.kontakti,
          nderrimiID:authData.nderrimiID,
          dataShitjes,
          llojiFillestarIShitjes,
          kostoPostes,
          oldKostoPostes,
          totaliPranuar,
          profitiID:shitje[0].profitiID,
          kohaGarancionit:aKaGarancion ? kohaGarancionit:0,
          produktet:products.map((product,index) => ({
            nr:index+1,
            produktiID: product.produktiID,
            sasiaShitjes: product.sasiaShitjes,
            cmimiPerCope: product.cmimiPerCope,
            komenti: product.komenti,
            vleraTotaleProduktit:product.sasiaShitjes*product.cmimiPerCope,
            profiti:product.profiti,
            sasiStatike:product.sasiStatike,
            cmimiBlerjes:product.cmimiBlerjes,
            meFatureTeRregullt:product.meFatureTeRregullt,
            tvsh:product.tvsh,
            shifraProduktit:product.shifra,
            emertimiProduktit:product.emertimi,
            pershkrimiProduktit:product.pershkrimi,
            komentiProduktit: product.komenti
          }))
       };
  
    try {
        if(llojiShitjes == 'dyqan'){
            const result = await window.api.ndryshoShitje(data);
            if (result.success) {
                    if(aKaGarancion){
                      const shifra = result.shifra
                      const dataPerGaranacion ={
                        ...parametratGarancionit,
                        pdfFolder:authData.pdfFolder
                      }
                      PrintoGarancion(data,dataPerGaranacion,shifra)
                    
                  }
        }}else if(llojiShitjes == 'online'){
            await window.api.ndryshoShitjenAprovuarOnline(data);
        }
        navigate('/faqjaKryesore/' , {state:{showToast:true , message:t('Shitja u Ndryshua me Sukses!') , type:'success'}})

    } catch (error) {
        showToast(t('Gabim gjate ndryshimit!') +error , 'error');
    } finally {
      setLoading(false);
      updateAuthData({reloadLayout:!authData.reloadLayout})

    }
}

      const handleAnulo =  () => {

      }
  return (
    <>
    {products.length == 1 ? <AnimatedSpinner /> 
    
    :
   
        <Container fluid className='mt-4 '>
            <Row><h4 className='text-center text-secondary fw-bold'>{t('Ndryshimi i Shitjes')} : {shitje[0].shitjeID}</h4></Row>
            <hr/>

            <Row>
                <Col>
                    {ndryshoSubjektinModul ? 
                    <Col className='d-flex'>
                        <InputGroup >
                                <KerkoSubjektin filter='klient' value={selectedSubjekti.emertimi} onSelect={handleSelectSubjekti} />
                                <InputGroup.Text className='bg-transparent  border-0 mx-2' onClick={() => setNdryshoSubjektinModul(false)} style={{cursor:'pointer'}}><FontAwesomeIcon icon={faUndo} className='text-danger fs-4 fw-bold' /></InputGroup.Text>
                        </InputGroup>
                    </Col>
                    :
                    <Form className='d-flex justify-content-between'>
                        <Form.Group>
                            <Form.Label>{t('Subjekti')}:</Form.Label>
                            <InputGroup >
                                <Form.Control disabled = {true} value={selectedSubjekti.emertimi} />
                                <InputGroup.Text disabled={inputDisabled} onClick={() => setNdryshoSubjektinModul(true)} style={{cursor:'pointer'}}><FontAwesomeIcon icon={faEdit} className='text-primary' /></InputGroup.Text>
                            </InputGroup>
                            
                        </Form.Group>
                        <Form.Group className='mx-2'>
                            <Form.Label>{t('Kontakti')}:</Form.Label>
                            <Form.Control disabled = {true} value={selectedSubjekti.kontakti} />
                        </Form.Group>
                    </Form>}
                </Col>
                <Col className="d-flex flex-row justify-content-center">
                    <Button disabled={true}
                        variant={llojiShitjes === "dyqan" ? "primary" : "outline-primary"}
                        size="md"
                        className="mx-1 w-25"
                        onClick={() => setLlojiShitjes('dyqan')}
                    >
                        {t('Shitje ne Dyqan')}
                    </Button>
                    <Button disabled={true}
                        variant={llojiShitjes === "online" ? "primary" : "outline-primary"}
                        size="md"
                        className="mx-1 w-25"
                        onClick={() => setLlojiShitjes('online')}
                    >
                        {t('Shitje Online')}
                    </Button>
                </Col>
                <Col>
                    <Form>
                        <Form.Label>{t('Data')}</Form.Label>
                        <Form.Control disabled={inputDisabled} type='date' onChange={(e) => setDataShitjes(e.target.value)} value={dataShitjes}/>
                    </Form>
                </Col>
            </Row>

            <Row className="mt-5">
                <Col xs={12}>
                <div className="table-responsive tabeleMeMaxHeight">
                    <Table striped bordered hover size="sm">
                    <thead>
                        <tr className="fs-5">
                            <th scope="col">{t("Nr")}</th>
                            <th scope="col">{t("Shifra")}</th>
                            <th scope="col">{t("Emertimi")}</th>
                            <th scope="col">{t("Pershkrimi")}</th>
                            <th scope="col">{t("Cmimi Per Cope")}</th>
                            <th scope="col">{t("Sasia e Disponueshme")}</th>
                            <th scope="col">{t("Sasia e Shitjes")}</th>
                            <th scope="col">{t("Totali")}</th>
                            <th scope="col">{t("Komenti")}</th>
                            <th scope="col">{t("Opsionet")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => {
                        const cmimiPerCope = parseFloat(product.cmimiPerCope) || 0;
                        const sasiaShitjes = parseFloat(product.sasiaShitjes) || 0;
                        const totali = (cmimiPerCope * sasiaShitjes);

                        return (
                            <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                                {product.shifra || (
                                <Button disabled={inputDisabled} onClick={() => openModalForRow(index)}>{t('Kerko')}</Button>
                                )}
                            </td>
                            <td>{product.emertimi}</td>
                            <td>{product.pershkrimi}</td>
                            <td>
                                <Form.Control className="bg-light border-0" disabled={inputDisabled}
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
                                <Form.Control className="bg-light border-0" disabled={inputDisabled}
                                type="number"
                                min={1}
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
                            <td>{formatCurrency(totali)}</td>
                            <td>
                                <Form.Control className="bg-light border-0" disabled={inputDisabled}
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
                            <Button variant='transparent' className="text-danger  text-center" disabled={inputDisabled} onClick={() => handleDeleteRow(index)} style={{ cursor: 'pointer' }}>
                                {product.shifra && <FontAwesomeIcon className="fs-4 mt-1" icon={faTrashCan} disabled={inputDisabled} />}
                                </Button>                      
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

            <Row className="mt-5 section2 d-flex justify-content-around bg-light py-4">
                <Col xs={12} md={6} className="d-flex flex-column align-items-center mb-3 mb-md-0">
                <h5 className="text-center mb-3">
                    {t('Shtype Garancionin')}
                    <Form.Check  disabled={inputDisabled}
                    className="px-3 ms-2" 
                    inline 
                    onClick={() => setAKaGarancion(!aKaGarancion)} 
                    checked = {aKaGarancion}
                    />
                </h5>
                {aKaGarancion && (
                    <div className="d-flex align-items-center justify-content-center">
                    <Form.Control  disabled={inputDisabled}
                        type="number" 
                        className="me-2 w-50 w-md-25" 
                        placeholder={t('"Muaj" ')}
                        min={1}
                        value={kohaGarancionit}
                        onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 1) {
                            setKohaGarancionit(value);
                        }
                        }}
                    />

                    <p className="mb-0">{t('Muaj')}</p>
                    </div>
                )}
                </Col>
                
                <Col xs={12} md={6} className="d-flex justify-content-center">
                <Form.Control  disabled={inputDisabled}
                    as="textarea" 
                    onChange={(e) => setKomentiShitjes(e.target.value)} 
                    rows={3} 
                    className="p-3 w-100 w-md-75" 
                    placeholder={t("Shkruaj komentin...")}
                    value = {komentiShitjes}
                />
                </Col>
            </Row>

            <Row className="section3 my-5 d-flex justify-content-end">
                <Col xs={12} md={6} className="d-flex justify-content-center align-items-end">
                    <Button variant="danger" size="lg" className="mx-2 fs-1" onClick={handleAnulo} disabled={inputDisabled}>{t('Anulo')}</Button>
                    <Button variant="success" size="lg" className="mx-2 fs-1" 
                        disabled={!(selectedSubjekti.subjektiID) || !(products.length>1) || !(menyraPagesesID) || inputDisabled} 
                        onClick={() => setModalPerPyetje(true)} >{inputDisabled ? (
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
                    ) : (
                    t('Ruaj Ndryshimet...')
                    )}</Button>
                </Col>
                <Col xs={12} md={6} className="d-flex flex-column align-items-end">
                    <div className="d-flex flex-column w-100 justify-content-end">
                    <div className="d-flex flex-column w-100">
                        
                        <Form.Group as={Row} controlId="totaliPerPageseShuma" className="mb-2">
                        <Form.Label column xs={6} className="text-end">{t('Totali Per Pagese')}</Form.Label>
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

                        

                        {llojiShitjes == 'dyqan'? <>
                        <Form.Group as={Row} controlId="totaliPageses" className="mb-2">
                        <Form.Label column xs={6} className="text-end">{t('Totali Pageses')}:</Form.Label>
                        <Col xs={6}>
                            <InputGroup>
                                <Form.Control disabled={true}
                                type="number"
                                value={totaliPageses}
                                onChange={handleTotaliPagesesChange}
                                min={0}
                                />
                                <InputGroup.Text style={{cursor:'pointer'}}  onClick={() => {totaliPageses > 0 ? setTotaliPageses(0)  : setTotaliPageses(totaliPerPagese)}}>€</InputGroup.Text>

                            </InputGroup>
                        </Col>
                        </Form.Group>
                        <Form.Group as={Row} controlId="mbetjaPerPagese" className="mb-2">
                        <Form.Label column xs={6} className="text-end">{t('Mbetja Per Pagese')}:</Form.Label>
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
                        </>
                        :<>
                        <Form.Group as={Row} controlId="kostoPostes" className="mb-2">
                        <Form.Label column xs={6} className="text-end">{t('Kosto e Postes')}:</Form.Label>
                        <Col xs={6}>
                            <InputGroup>
                            <Form.Control
                                type="text"
                                value={kostoPostes}
                                placeholder='0'
                                onChange={(e) => setKostoPostes(e.target.value)}
                                
                            />
                            <InputGroup.Text>€</InputGroup.Text>
                            </InputGroup>
                        </Col>
                        </Form.Group>

                        <Form.Group as={Row} controlId="totaliIPranuar" className="mb-2">
                        <Form.Label column xs={6} className="text-end">{t('Totali I Pranuar')}:</Form.Label>
                        <Col xs={6}>
                            <InputGroup>
                            <Form.Control
                                type="text"
                                value={totaliPranuar}
                                readOnly

                            />
                            <InputGroup.Text>€</InputGroup.Text>
                            </InputGroup>
                        </Col>
                        </Form.Group>
                        <Form.Group as={Row} controlId="nrPorosiseShuma" className="mb-2">
                        <Form.Label column xs={6} className="text-end">{t('Nr. Porosise')}:</Form.Label>
                        <Col xs={6}>
                        <Form.Control disabled={inputDisabled}
                            type="text"  // Use "text" instead of "number"
                            maxLength={8}  // Set maxLength to 8
                            defaultValue={nrPorosise}
                            onChange={(e) => setNrPorosise(e.target.value)}
                        />
                        </Col>
                    </Form.Group>
                    </>}
                    </div>
                    <div className="d-flex flex-row justify-content-end">
                        {menyratPageses.map((menyraPageses) => (
                        
                        <Button disabled={inputDisabled}
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

            <ModalPerPyetje
                show={modalPerPyetje}
                handleClose={() => setModalPerPyetje(false)}
                handleConfirm={handleConfirmModal}
            />
        </Container>
        }
    </>
  )
}
