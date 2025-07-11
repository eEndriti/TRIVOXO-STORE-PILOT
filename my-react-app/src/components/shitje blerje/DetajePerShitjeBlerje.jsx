import { useState, useEffect, useContext } from 'react';
import { Container, Col, Row } from 'react-bootstrap';
import PropTypes from 'prop-types';
import AnimatedSpinner from '../AnimatedSpinner';
import AuthContext,{formatCurrency} from "../AuthContext";
import { useTranslation } from 'react-i18next';
export default function DetajePerShitjeBlerje({ shifraPerDetaje, IDPerDetaje,lloji }) {
  const [loading, setLoading] = useState(true);
  const [queryResponse, setQueryResponse] = useState([]);
  const [tregoProfitinDetaje, setTregoProfitinDetaje] = useState(false);
  const {authData} = useContext(AuthContext);
  const {t} = useTranslation('shitjeblerje')
  const fetchOneQuery = async (query) => {
    await window.api.fetchTableQuery(query)
      .then((receivedData) => {
        setQueryResponse(receivedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching query:', error);
        setLoading(false); 
      });
  }

  const kontrolloValidetin = () => {
    if (lloji == 'shitje') {
      fetchOneQuery(`
        select shp.shitjeProduktiID, shitjeID, shp.sasia, shp.cmimiShitjesPerCope as 'cmimiPerCope', shp.totaliProduktit, 
        shp.komenti, shp.profitiProduktit, p.emertimi, p.shifra as 'shifraProduktit' ,p.pershkrimi
        from shitjeProdukti shp 
        join produkti p on p.produktiID = shp.produktiID 
        where shitjeID = ${IDPerDetaje}`);
    } else if (lloji == 'blerje') {
      fetchOneQuery(`
        select bp.cmimiPerCope, bp.sasia, bp.totaliProduktit, bp.blerjeID, bp.produktiID, 
        p.emertimi, p.pershkrimi, p.shifra as 'shifraProduktit',p.sasia as 'sasiaAktuale'
        from blerjeProdukt bp
        join produkti p on p.produktiID = bp.produktiID
        where blerjeID = ${IDPerDetaje}`);
    }
  };

  useEffect(() => {
    kontrolloValidetin();
  }, [shifraPerDetaje, IDPerDetaje]);

  return (
    <Container fluid>
      <Row className='d-flex flex-column my-5 pb-5'>
        {loading ? (
          <AnimatedSpinner />
        ) : (
          <>
            <Col>
              <h4 className="text-center my-3 pt-3 fw-bold">
                {t('Produktet e')} {lloji == 'shitje' ? t('Shitjes') : t('Blerjes')}: {shifraPerDetaje}
              </h4>
            </Col>
            <Col>
              <div className="Container fluid my-3 tabelaTransaksioneve">
                <div className="table-responsive tableHeight50">
                  <table className="table table-sm table-striped border table-hover text-center">
                    <thead className="table-secondary">
                      <tr className="fs-5">
                        <th scope="col">{t("Nr")}</th>
                          <th scope="col">{t("Shifra e Produktit")}</th>
                          <th scope="col">{t("Emertimi i Produktit")}</th>
                          <th scope="col">{t("Pershkrimi i Produktit")}</th>
                          <th scope="col">{t("Cmimi per Cope")}</th>
                          <th scope="col">{t(lloji === 'blerje' ? "Sasia e Blerjes" : "Sasia")}</th>
                          {shifraPerDetaje.toLowerCase().startsWith('sh') ? (
                            <>
                              <th scope="col">{t("Totali")}</th>
                              <th scope="col">{t("Komenti per Produkt")}</th>
                              {authData.aKaUser === 'admin' && (
                                <th scope="col">{t("Profiti per Produkt")}</th>
                              )}
                            </>
                          ) : (
                            <>
                              <th scope="col">{t("Sasia Aktuale")}</th>
                              <th scope="col">{t("Totali")}</th>
                            </>
                          )}
                      </tr>
                    </thead>
                    <tbody className="border-dark">
                      {queryResponse.slice().reverse().map((item, index) => (
                        <tr key={index}>
                          <th scope="row">{queryResponse.length - index}</th>
                          <td>{item.shifraProduktit}</td>
                          <td>{item.emertimi}</td>
                          <td>{item.pershkrimi}</td>
                          <td>{formatCurrency(item.cmimiPerCope)}</td>
                          <td>{item.sasia}</td>
                          {shifraPerDetaje.toLowerCase().startsWith('sh') ? (
                            <>
                                <td>{formatCurrency(item.totaliProduktit)}</td>
                                <td>{item.komenti}</td>
                                {authData.aKaUser == 'Admin' && <>
                                  <td
                                onMouseEnter={() => setTregoProfitinDetaje(true)}
                                onMouseLeave={() => setTregoProfitinDetaje(false)}
                                >
                                {tregoProfitinDetaje ? item.profitiProduktit : '****'}
                                </td>
                                </>}
                            </>
                          ) : <>
                                <td>{item.sasiaAktuale}</td>
                                <td>{formatCurrency(item.totaliProduktit)}</td>
                            </>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Col>
          </>
        )}
      </Row>
    </Container>
  );
}

DetajePerShitjeBlerje.propTypes = {
  shifraPerDetaje: PropTypes.string.isRequired,
  IDPerDetaje: PropTypes.number.isRequired,
  lloji:PropTypes.string.isRequired
};
