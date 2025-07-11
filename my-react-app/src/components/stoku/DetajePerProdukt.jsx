import { useState, useEffect } from "react";
import { useParams,useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import AnimatedSpinner from '../AnimatedSpinner';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserSecret } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency, formatLongDateToAlbanian } from "../AuthContext";
import { useToast } from "../ToastProvider";
import NdryshoServisinPerfunduar from "../NdryshoServisinPerfunduar";
import { useTranslation } from "react-i18next";
export default function DetajePerProdukt() {
  const {t} = useTranslation('stoku')
  const navigate = useNavigate();
  const { produktiID } = useParams();
  const [loading, setLoading] = useState(true);
  const [produkti, setProdukti] = useState(null); // Change to null to handle loading state
  const [transaksionet, setTransaksionet] = useState([]);
  const [filteredTransaksionet, setFilteredTransaksionet] = useState([]);
  const [filterShifra, setFilterShifra] = useState('');
  const [filterLloji, setFilterLloji] = useState('');
  const [filterSubjekti, setFilterSubjekti] = useState('');
  const [sasiaShitur,setSasiaShitur] = useState(0)
  const [showProfiti,setShowProfiti] = useState(false)
  const [profiti,setProfiti] = useState()
  const showToast = useToast();
  const [margjina,setMargjina] = useState()
  const [modalNdryshoServisim,setModalNdryshoServisim] = useState(false)
  const [dataNdrshoServisim,setDataNdryshoServisim] = useState()
  
  useEffect(() => {
    

    fetchData();
  }, [produktiID]);

  const fetchData = async () => {
    try {
      const produktiData = await window.api.fetchTableProdukti();
      const produkti = produktiData.filter(item => item.produktiID == produktiID);
      setProdukti(produkti);
      console.log(produkti)
      const transaksioneData = await window.api.fetchTableQuery(`
        SELECT 'Blerje' AS lloji, b.shifra ,b.blerjeID as 'llojiID', b.dataBlerjes as 'dataTransaksionit', s.emertimi AS subjekti, bp.sasia,'0' as profitiProduktit, bp.cmimiPerCope
        FROM blerje b
        JOIN blerjeProdukt bp ON b.blerjeID = bp.blerjeID
        JOIN subjekti s ON b.subjektiID = s.subjektiID
        JOIN transaksioni t ON t.transaksioniID = b.transaksioniID AND t.lloji = 'blerje'
        WHERE bp.produktiID = ${produktiID}

        UNION ALL

        SELECT 'Shitje' AS lloji, sh.shifra,sh.shitjeID as 'llojiID',sh.dataShitjes as 'dataTransaksionit', s.emertimi AS subjekti, sp.sasia,sp.profitiProduktit as 'profitiProduktit',  sp.cmimiShitjesPerCope
        FROM shitje sh
        JOIN shitjeProdukti sp ON sh.shitjeID = sp.shitjeID
        JOIN subjekti s ON sh.subjektiID = s.subjektiID
        JOIN transaksioni t ON t.transaksioniID = sh.transaksioniID AND t.lloji = 'shitje'
        WHERE sp.produktiID = ${produktiID}

        UNION ALL

        SELECT 'Shpenzim' AS lloji, sh.shifra,sh.shpenzimiID as 'llojiID',sh.dataShpenzimit as 'dataTransaksionit', 'sp' AS subjekti,'0' as profitiProduktit, shp.sasia, shp.cmimiFurnizimit
        FROM shpenzimi sh
        JOIN shpenzimProdukti shp ON sh.shpenzimiID = shp.shpenzimiID
        JOIN transaksioni t ON t.transaksioniID = sh.transaksioniID AND t.lloji = 'shpenzim'
        WHERE shp.produktiID = ${produktiID}

        UNION ALL

        SELECT 'Servisim' AS lloji, se.shifra,se.servisimiID as 'llojiID',se.dataPerfundimit as 'dataTransaksionit', s.emertimi AS subjekti, sp.sasia,sp.profitiProduktit as 'profitiProduktit',  sp.cmimiShitjesPerCope
        FROM servisimi se 
        JOIN servisProdukti sp ON se.servisimiID = sp.servisimiID
        JOIN subjekti s ON se.subjektiID = s.subjektiID
        JOIN transaksioni t ON t.transaksioniID = se.transaksioniID AND t.lloji = 'servisim'
        WHERE sp.produktiID =  ${produktiID}
      `);
      transaksioneData.sort((a, b) => new Date(a.dataTransaksionit) - new Date(b.dataTransaksionit));
      setTransaksionet(transaksioneData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    const filteredData = transaksionet.filter(item => {
      return (
        (filterShifra === '' || item.shifra.includes(filterShifra)) &&
        (filterLloji === '' || item.lloji.includes(filterLloji)) &&
        (filterSubjekti === '' || item.subjekti.includes(filterSubjekti))
      );
    });
    setFilteredTransaksionet(filteredData);
  }, [transaksionet, filterShifra, filterLloji, filterSubjekti]);

  useEffect(() => {
    const totalSasiaShitur = filteredTransaksionet.reduce((total, item) => {
      return item.lloji == 'Shitje'  || item.lloji == 'Servisim'? total + item.sasia : total;
    }, 0);
    setSasiaShitur(totalSasiaShitur)
    
  }, [filteredTransaksionet]);

  useEffect(() => {
    const totalProfitit = filteredTransaksionet.reduce((total, item) => {
      return item.lloji == 'Shitje' || item.lloji == 'Servisim' ? total + Number(item.profitiProduktit) : total;
    }, 0);
    setProfiti(totalProfitit)

    console.log('trs',filteredTransaksionet)

    const totalQarkullimi = filteredTransaksionet.reduce((total, item) => {
      return item.lloji == 'Shitje' || item.lloji == 'Servisim' ? total + Number(item.cmimiPerCope * item.sasia) : total;
    },0)

    const margjina = (totalProfitit / totalQarkullimi) * 100
    if(margjina > 0){
      setMargjina(margjina.toFixed(2))
    }
  }, [filteredTransaksionet]);

  const shifraClick = (item) => {
    const lloji = item.lloji
    console.log('item',item)
    console.log('lloji',lloji)
    switch(lloji){
      case 'Shitje'  : navigate(`/ndryshoShitjen/${item.llojiID}`)
          break;
      case 'Blerje' : navigate(`/ndryshoBlerjen/${item.llojiID}`)
          break;
      case 'Shpenzim' : showToast(t('Ky Shpenzim eshte nga stoku dhe nuk mund te ndryshohet, vetem te fshihet'), 'warning')
          break;
      case 'Servisim': showServisimModal(item.llojiID)
          break;   
    }
  }

  

  const showServisimModal = async (id) => {
    try {
        const result = await window.api.fetchTableServisi();
        const data = result.find(item => item.servisimiID == id);
        
        if (!data) {
            showToast(t('Gabim: Nuk u gjet servisi me këtë ID'), 'error');
            return; 
        }

        setDataNdryshoServisim(data);
        setModalNdryshoServisim(true); 

    } catch (error) {
        showToast(t('Gabim gjatë marrjes së të dhënave për ndryshim:') + error, 'error');
    }
};


  const handleConfirmNdryshoServisinPerfunduar =  () => {
    fetchData()
    setModalNdryshoServisim(false)
  }
 
  return (
    <>
      {loading ? (
        <AnimatedSpinner />
      ) : (
        <Container fluid className="pt-3">
          <Row>
            <Col >
                  <h5 className="w-25 float-end"><span className="w-25 float-end" onMouseEnter={()=> setShowProfiti(true)} onMouseLeave={() => setShowProfiti(false)}><FontAwesomeIcon icon={faUserSecret} className={showProfiti ? 'text-dark' : 'text-light'}/></span></h5>
            </Col>
          </Row>
          
            <Row>
              {produkti ? <Col className="border-top border-dark border px-2 py-3 d-flex flex-row flex-wrap justify-content-between">
                <h5 className="m-2">{t('Shifra')}: <span className="fs-5 fw-bold float-center">{produkti? produkti[0].shifra : ''}</span></h5>
                <h5 className="m-2">{t('Emertimi')}: <span className="fs-5 fw-bold float-center">{produkti[0].emertimi}</span></h5>
                <h5 className="m-2">{t('Cmimi i Blerjes')}: <span className="fs-5 fw-bold float-center">{formatCurrency(produkti[0].cmimiBlerjes)}</span></h5>
                <h5 className="m-2">{t('Cmimi i Shitjes')}: <span className="fs-5 fw-bold float-center">{formatCurrency(produkti[0].cmimiShitjes)}</span></h5>
                <h5 className="m-2">{t('Sasia Aktuale')}: <span className="fs-5 fw-bold float-center">{produkti[0].sasiStatike ? 'Sasi Statike' : produkti[0].sasia}</span></h5>
                <h5 className="m-2">{t('Sasia e Shitur')}: <span className="fs-5 fw-bold float-center">{sasiaShitur}</span></h5>
                {showProfiti && 
                  <>
                    <h5 className="m-2">{t('Profiti nga ky Produkt')}: <span className="fs-5 fw-bold float-center">{formatCurrency(profiti)}</span></h5>
                    <h5 className="m-2">{t('Margjina Aktuale e Profitit')}: <span className="fs-5 fw-bold float-center">{margjina}%</span></h5>
                  </>
                }
              </Col>:''}
            </Row>
        
          

          <Row className="my-3 pt-5">
            <Col>
              <Form>
                <Row>
                  <Col>
                    <Form.Control
                      type="text"
                      placeholder={t("Filtro me Shifer...")}
                      value={filterShifra}
                      onChange={(e) => setFilterShifra(e.target.value)}
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      type="text"
                      placeholder={t("Filtro me llojin...")}
                      value={filterLloji}
                      onChange={(e) => setFilterLloji(e.target.value)}
                    />
                  </Col>
                  <Col>
                    <Form.Control
                      type="text"
                      placeholder={t("Filtro me Subjektin...")}
                      value={filterSubjekti}
                      onChange={(e) => setFilterSubjekti(e.target.value)}
                    />
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>

          <Row >
            <div className=" my-3">
              <div className="table-responsive tableHeight50 container">
                <table className="table table-sm table-striped border table-hover text-center">
                  <thead className="table-secondary">
                    <tr className="fs-5">
                     <th scope="col">{t('Nr')}</th>
                    <th scope="col">{t('Shifra')}</th>
                    <th scope="col">{t('Lloji')}</th>
                    <th scope="col">{t('Subjekti')}</th>
                    <th scope="col">{t('Data e Transaksionit')}</th>
                    <th scope="col">{t('Sasia')}</th>
                    <th scope="col">{t('Cmimi per Cope')}</th>
                    <th scope="col">{t('Totali')}</th>
                    </tr>
                  </thead>
                  <tbody className="border-dark">
                    {filteredTransaksionet.length > 0 ? (
                      filteredTransaksionet.slice().reverse().map((item, index) => {
                        const totali = item.sasia * item.cmimiPerCope;
                        return (
                          <tr key={index}>
                            <th scope="row">{filteredTransaksionet.length - index}</th>
                            <td>
                              <Button variant='' className='hover ' style={{color:'#24AD5D',fontSize:'15px'}} onClick={() => shifraClick(item)}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}>
                                {item.shifra || ''}
                              </Button>
                            </td>
                            <td>{item.lloji}</td>
                            <td>{item.subjekti}</td>
                            <td>{formatLongDateToAlbanian(item.dataTransaksionit)}</td>
                            <td>{item.sasia}</td>
                            <td>{formatCurrency(item.cmimiPerCope)}</td>
                            <td>{formatCurrency(totali)|| ''} </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8">{t('Nuk ka të dhëna.')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Row>
              <NdryshoServisinPerfunduar show={modalNdryshoServisim} handleClose={() => setModalNdryshoServisim(false)} data={dataNdrshoServisim} handleConfirm={handleConfirmNdryshoServisinPerfunduar}/>
        </Container>
      )}
    </>
  );
}
