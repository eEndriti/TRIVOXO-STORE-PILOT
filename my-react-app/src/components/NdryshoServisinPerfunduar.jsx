import { useState, useEffect, useContext } from 'react';
import { Modal, Button, Form,Spinner, Toast,InputGroup,Row,Col,Table } from 'react-bootstrap';
import AuthContext, { formatCurrency } from "../components/AuthContext";
import KerkoProduktin from './stoku/KerkoProduktin'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import AnimatedSpinner from './AnimatedSpinner';
import { useToast } from './ToastProvider';

function NdryshoServisinPerfunduar({ show, handleClose,data = {}, handleConfirm}) {

    const [loading, setLoading] = useState(false);
    const [komenti, setKomenti] = useState();
    const [totaliPerPagese, setTotaliPerPagese] = useState(0);
    const [totaliIPageses, setTotaliIPageses] = useState(0);
    const [mbetjaPerPagese, setMbetjaPerPagese] = useState(0);
    const {authData,updateAuthData} = useContext(AuthContext)
    const [menyraPagesesID,setMenyraPagesesID] = useState()
    const [products, setProducts] = useState([{}]);
    const [showModalKerkoProduktin,setShowModalKerkoProduktin] = useState(false)
    const [selectedRow, setSelectedRow] = useState(null);
    const [dataFillestare,setDataFillestare] = useState([])
    const [menyratPageses, setMenyratPageses] = useState([]);
    const [totaliPerPageseFillestare,setTotaliPerPageseFillestare] = useState()
    const [totaliPagesesFillestare,setTotaliPagesesFillestare] = useState()
    const [menyraPagesesIDFillestare,setMenyraPagesesIDFillestare] = useState()
    const [transaksioniIDFillestare,setTransaksioniIDFillestare] = useState()
    const showToast = useToast()

   useEffect(() => {  
    if (data && Object.keys(data).length > 0) {  
        setProducts([{}]);   
         fetchDataFillestare();
        console.log('data', data);
    }
}, [data]);

    const fetchDataFillestare = async () => {
        try {
            setLoading(true);
            const queryResponse = await window.api.fetchTableQuery(`
                SELECT * FROM Servisimi WHERE servisimiID = ${data?.servisimiID}
            `);

             await  window.api.fetchTableMenyratPageses().then(receivedData => {
                setMenyratPageses(receivedData);
              });

            const queryProduktetResponse = await window.api.fetchTableQuery(`
                 select  p.shifra,p.emertimi,p.pershkrimi,p.sasia,p.cmimiBlerjes,p.cmimiShitjes,p.dataKrijimit,p.sasiStatike,p.komenti,p.meFatureTeRregullt,p.cpu,p.ram,p.gpu,p.disku,k.emertimi as 'emertimiKategorise',k.tvsh,k.kategoriaID,
                sp.produktiID,sp.sasia as 'sasiaShitjes',sp.cmimiShitjesPerCope as 'cmimiPerCope',sp.profitiProduktit from produkti p
                join servisProdukti sp on sp.produktiID = p.produktiID
                join kategoria k on k.kategoriaID = p.kategoriaID
                where servisimiID = ${data?.servisimiID}
            `);
          
            setDataFillestare(prevData => ({
                ...prevData,
                ...queryResponse[0],
                produktet: queryProduktetResponse 
            }));
    
            setProducts(prevProducts => [...queryProduktetResponse, ...prevProducts]);
            console.log('a',queryResponse[0])
            updateMenyraPageses(queryResponse[0]?.menyraPagesesID);
            setTotaliPerPageseFillestare(queryResponse[0]?.totaliPerPagese)
            setTotaliPagesesFillestare(queryResponse[0]?.totaliPageses)
            setMenyraPagesesIDFillestare(queryResponse[0]?.menyraPagesesID)
            setMenyraPagesesID(queryResponse[0]?.menyraPagesesID)
            setTransaksioniIDFillestare(queryResponse[0]?.transaksioniID)
            setTotaliPerPagese(queryResponse[0]?.totaliPerPagese);
            setTotaliIPageses(queryResponse[0]?.totaliPageses);
            setMbetjaPerPagese(queryResponse[0]?.mbetjaPerPagese);
            setKomenti(data?.komenti);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            console.log(dataFillestare)
        }
    };

 
    const updateMenyraPageses = (menyraPageses) => {
        setMenyraPagesesID(menyraPageses);
      };

    const handleConfirmClick = async () => {
        setLoading(true);     

        const dataPerNdryshim = {
            servisimiID:data.servisimiID,
            shifra:data.shifra,
            komenti,
            totaliPerPageseFillestare,
            totaliPagesesFillestare,
            menyraPagesesIDFillestare,
            totaliPerPagese,
            totaliIPageses,
            mbetjaPerPagese,
            perdoruesiID:authData.perdoruesiID,
            nderrimiID:authData.nderrimiID,
            dataPageses:new Date().getDate(),
            subjektiID: data.subjektiID ,
            menyraPagesesID:menyraPagesesID,
            produktet:products.slice(0, products.length - 1)
        }
        try {

            const result = await window.api.ndryshoServisinPerfunduar(dataPerNdryshim);
            if (result.success) {
              showToast(`Servisi u Ndryshua me Sukses!`, 'success'); 
            } else {
                showToast('Gabim gjate Ndryshimit: ' + result.error , 'error');
            }
          } catch (error) {
            showToast('Gabim gjate komunikimit me server: ' + error.message, 'error');
          } finally {
            setLoading(false);
            handleConfirm(true)
            handleClose()
            updateAuthData({reloadLayout:!authData.reloadLayout})

          }

    };

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
       
          setTotaliPerPagese(total);

      }, [products]);

    const openModalForRow = (index) => {
        setSelectedRow(index);
        setShowModalKerkoProduktin(true);
      };

      const handleProductSelect = (product) => {
        const updatedProducts = [...products];
        updatedProducts[selectedRow] = product;
    
        if (selectedRow === products.length - 1) {
          updatedProducts.push({});
        }
    
        setProducts(updatedProducts);
        setShowModalKerkoProduktin(false);
      };

      const handleDeleteRow = (index) => {
        const updatedProducts = products.filter((_, i) => i !== index);
        setProducts(updatedProducts);
      };

      const handleTotaliPagesesChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        if (value <= totaliPerPagese) {
            setTotaliIPageses(value);
        } else {
          showToast('Shuma e paguar nuk mund të jetë më e madhe se totali!' ,'warn');
        }
        setMbetjaPerPagese(totaliPerPagese - totaliIPageses)

      };

      useEffect(()=>{
            setMbetjaPerPagese(totaliPerPagese - totaliIPageses)
      },[totaliIPageses,mbetjaPerPagese,totaliPerPagese])
      

    return (
        <Modal show={show} onHide={handleClose} size='xl'>
            <Modal.Header closeButton>
                <Modal.Title>Ndrysho Servisin</Modal.Title>
            </Modal.Header> {loading ? <AnimatedSpinner /> : 
            <Modal.Body>
                
               <Form className='d-flex d-row justify-content-start'>
                    <Form.Group>
                        <Form.Label>Shifra:</Form.Label>
                        <Form.Control type="text" value={data?.shifra || ''} disabled />
                    </Form.Group>
                    <Form.Group className='mx-3'>
                        <Form.Label >Klienti:</Form.Label>
                        <Form.Control type="text" value={data?.subjekti || ''} disabled />
                    </Form.Group>
               </Form>
                        {loading ? <AnimatedSpinner /> :
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
                                    <td>{(product.sasia + product.sasiaShitjes) || ''}</td>
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
                            {showModalKerkoProduktin && (
                                <KerkoProduktin
                                    show={showModalKerkoProduktin}
                                    onHide={() => setShowModalKerkoProduktin(false)}
                                    meFatureProp={null}
                                    onSelect={handleProductSelect}
                                />
                            )}
                        </div>
                        </Col>
                    </Row>}
                            <hr/>  
                       <Row className='d-flex flex-row flex-wrap justify-content-between mt-5'>
                            <Col className='d-flex flex-column flex-wrap'>
                                <Col>
                                    <Form.Group className='w-50'>
                                        <Form.Label className="fw-bold">Komenti:</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={2}
                                            className="form-control-lg"
                                            
                                            defaultValue={data?.komenti}
                                            onChange={(e) => setKomenti(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col xs={12} md={6} className="d-flex justify-content-center align-items-end ">
                                    <Button variant="danger" size="lg" className="mx-2 fs-1" onClick={handleClose}>Anulo</Button>
                                    <Button variant="success" size="lg" className="mx-2 fs-1" onClick={handleConfirmClick} disabled={loading || products.some(product => product.sasiaShitjes < 1)}>{loading ? (
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
                            </Col>
                        <Form className='w-25 '>
                                <Form.Group>
                                    <Form.Label>Totali per Pagese:</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type="text"
                                                value={formatCurrency(totaliPerPagese,true)}
                                                readOnly
                                            />
                                            <InputGroup.Text>€</InputGroup.Text>
                                        </InputGroup>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Totali i Pageses:</Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                        type="number"
                                        value={totaliIPageses}
                                        disabled
                                        onChange={handleTotaliPagesesChange}
                                        min={0}
                                        />
                                        <InputGroup.Text style={{cursor:'pointer'}} onClick={() => {totaliIPageses > 0 ? setTotaliIPageses(0) : setTotaliIPageses(totaliPerPagese)}}>€</InputGroup.Text>

                                    </InputGroup>
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Mbetja Per Pagese:</Form.Label>
                                    <InputGroup>
                                        <Form.Control type="number" value={mbetjaPerPagese} disabled />
                                        <InputGroup.Text>€</InputGroup.Text>
                                    </InputGroup>
                                </Form.Group>
                                <Form.Group className='mt-4'>
                                    <div className="d-flex flex-row justify-content-end">
                                        {menyratPageses.map((menyraPageses) => (
                                        <Button
                                            key={menyraPageses.menyraPagesesID}
                                            onClick={() => setMenyraPagesesID(menyraPageses.menyraPagesesID)}
                                            className={menyraPagesesID === menyraPageses.menyraPagesesID ? 'bg-primary mx-2' : 'mx-2 bg-transparent text-primary'}
                                            >
                                            {menyraPageses.emertimi}
                                        </Button>
                                        ))}
                                    </div>
                                </Form.Group>
                            </Form>
                       </Row>
            </Modal.Body>}
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Anulo
                </Button>
                <Button variant="primary" onClick={handleConfirmClick} disabled={loading}>
                    {loading ? (
                        <>
                            <Spinner
                                variant="success"
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
                    )}
                </Button>
            </Modal.Footer> 
        </Modal>
    );
}

export default NdryshoServisinPerfunduar;
