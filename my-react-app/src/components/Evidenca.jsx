import { useState, useEffect } from 'react';
import { Container, Spinner, Col, Row,Form,Button,Card } from 'react-bootstrap';
import AnimatedSpinner from './AnimatedSpinner';
import ChartComponent from './ChartComponent';
import { formatCurrency, normalizoDaten } from "../components/AuthContext";
import DashboardStats from './DashboardStats';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';

export default function Evidenca() {
  const [loading, setLoading] = useState(true);
  const [menyratEPageses, setMenyratEPageses] = useState([]);
  const [vleraShitjevePaPaguar, setVleraShitjevePaPaguar] = useState([]);
  const [vleraBlerjevePaPaguar, setVleraBlerjevePaPaguar] = useState([]);
  const [produktiData, setProduktiData] = useState([]);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [loading2,setLoading2] = useState(false)
  const [tregoGrafikun,setTregoGrafikun] = useState(false)
  const [diferencaDitore,setDiferencaDitore] = useState()
  const [startDate2,setStartDate2] = useState()
  const [diferencat,setDiferencat] = useState('') 
  const [triggerReload, setTriggerReload] = useState(false);
  const showToast = useToast();
  const [vleraServisevePaPaguar, setVleraServisevePaPaguar] = useState([])
  useEffect(() => {
  

    fetchData();
  }, [triggerReload]);

  const fetchData = async () => {
    setLoading(true)
    try {
      const [menyratResponse, shitjeResponse,serviseResponse, blerjeResponse, produktiResponse] = await Promise.all([
        window.api.fetchTableMenyratPageses(),
        window.api.fetchTableQuery('SELECT SUM(mbetjaPerPagese) as vleraShitjevePaPaguar FROM shitje'),
        window.api.fetchTableQuery('SELECT SUM(mbetjaPageses) as vleraServisevePaPaguar FROM servisimi'),
        window.api.fetchTableQuery('SELECT SUM(mbetjaPerPagese) as vleraBlerjevePaPaguar FROM blerje'),
        window.api.fetchTableQuery(`
          SELECT 
            SUM(p.sasia * p.cmimiBlerjes) AS vleraEBlerjeve, 
            SUM(p.sasia * p.cmimiShitjes) AS VleraShitjeve,
            SUM(p.sasia) AS sasiaTotale,
            COUNT(*) AS nrProdukteve,
            SUM(CASE WHEN p.meFatureTeRregullt = 'po' THEN 1 ELSE 0 END) AS meFatureTeRregulltCount
          FROM produkti p
        `)
      ]);
      
      setMenyratEPageses(menyratResponse);
      setVleraShitjevePaPaguar(shitjeResponse);
      setVleraServisevePaPaguar(serviseResponse);
      setVleraBlerjevePaPaguar(blerjeResponse);
      setProduktiData(produktiResponse);
      setStartDate(() => {
        const today = new Date();
        today.setDate(2); 
        return today.toISOString().split('T')[0]; 
      })
      setEndDate(() => new Date().toISOString().split('T')[0])
      setLoading(false);
    } catch (err) {
      showToast('Gabim gjate marrjes se te dhenave', 'error');
    }finally{
      setLoading(false)
    }
  };

  useEffect(() => {
    if (!startDate || !endDate) return;  
    const startDateNormale = `${startDate} 00:00:00`
    const endDateNormale = `${endDate} 23:59:59`

    const fetchData = async () => {
      setLoading2(true);

      const startDate2Normale = `${startDate2} 00:00:00`

      const queries = [
        `SELECT SUM(b.totaliPerPagese) as totaliPagesesBlerje FROM blerje b WHERE b.dataBlerjes BETWEEN '${startDateNormale}' AND '${endDateNormale}'`,
        `SELECT SUM(s.totaliPerPagese) as totaliPagesesShitje FROM shitje s WHERE s.dataShitjes BETWEEN '${startDateNormale}' AND '${endDateNormale}'`,
        `SELECT SUM(sh.shumaShpenzimit) as totaliPagesesShpenzim FROM shpenzimi sh WHERE sh.dataShpenzimit BETWEEN '${startDateNormale}' AND '${endDateNormale}'`,
        `SELECT ISNULL(SUM(s.totaliPageses), 0) as totaliPagesesServisim FROM servisimi s WHERE statusi = 'perfunduar' AND s.dataPerfundimit BETWEEN '${startDateNormale}' AND '${endDateNormale}'`,
        `SELECT SUM(p.shuma) as totalHyrje FROM profiti p WHERE p.statusi = 0 AND p.dataProfitit BETWEEN '${startDateNormale}' AND '${endDateNormale}'`,
        `SELECT COUNT(*) as klientTeRinje FROM subjekti s WHERE s.dataKrijimit BETWEEN '${startDateNormale}' AND '${endDateNormale}'`,


        `SELECT SUM(b.totaliPerPagese) as totaliPagesesBlerjeDiff FROM blerje b WHERE b.dataBlerjes BETWEEN '${startDate2Normale}' AND '${startDateNormale}'`,
        `SELECT SUM(s.totaliPerPagese) as totaliPagesesShitjeDiff FROM shitje s WHERE s.dataShitjes BETWEEN '${startDate2Normale}' AND '${startDateNormale}'`,
        `SELECT SUM(sh.shumaShpenzimit) as totaliPagesesShpenzimDiff FROM shpenzimi sh WHERE sh.dataShpenzimit BETWEEN '${startDate2Normale}' AND '${startDateNormale}'`,
        `SELECT ISNULL(SUM(s.totaliPageses), 0) as totaliPagesesServisimDiff FROM servisimi s WHERE statusi = 'perfunduar' AND s.dataPerfundimit BETWEEN '${startDate2Normale}' AND '${startDateNormale}'`,
        `SELECT SUM(p.shuma) as totalHyrjeDiff FROM profiti p WHERE p.statusi = 0 AND p.dataProfitit BETWEEN '${startDate2Normale}' AND '${startDateNormale}'`,
        `SELECT COUNT(*) as klientTeRinje FROM subjekti s WHERE s.dataKrijimit BETWEEN '${startDate2Normale}' AND '${startDateNormale}'`,

    ];

         try {
        const responses = await Promise.all(queries.map(query => window.api.fetchTableQuery(query)));

        const resultData = {
            totaliPagesesBlerje: responses[0][0]?.totaliPagesesBlerje || 0,
            totaliPagesesShitje: responses[1][0]?.totaliPagesesShitje || 0,
            totaliPagesesShpenzim: responses[2][0]?.totaliPagesesShpenzim || 0,
            totaliPagesesServisim: responses[3][0]?.totaliPagesesServisim || 0,
            totalHyrje: responses[4][0]?.totalHyrje || 0,
            klientTeRinje:responses[5][0]?.klientTeRinje || 0,

            totaliPagesesBlerjeDiff: responses[6][0]?.totaliPagesesBlerjeDiff || 0,
            totaliPagesesShitjeDiff: responses[7][0]?.totaliPagesesShitjeDiff || 0,
            totaliPagesesShpenzimDiff: responses[8][0]?.totaliPagesesShpenzimDiff || 0,
            totaliPagesesServisimDiff: responses[9][0]?.totaliPagesesServisimDiff || 0,
            totalHyrjeDiff: responses[10][0]?.totalHyrjeDiff || 0,
            klientTeRinjeDiff:responses[11][0]?.klientTeRinje || 0,


        };

        const totalQarkullimi = resultData.totaliPagesesBlerje + resultData.totaliPagesesShitje + resultData.totaliPagesesShpenzim + resultData.totaliPagesesServisim;
        const totalQarkullimiDiff = resultData.totaliPagesesBlerjeDiff + resultData.totaliPagesesShitjeDiff + resultData.totaliPagesesShpenzimDiff + resultData.totaliPagesesServisimDiff;
        
        const resultDataWithQarkullimi = ({
          ...resultData,
          totalQarkullimi,
          totalQarkullimiDiff
        })

        const calculatePercentageDifference = (newValue, oldValue) => {
          if (oldValue === 0) return newValue === 0 ? 0 : (newValue > 0 ? 100 : -100); 
          return Math.round(((newValue - oldValue) / oldValue) * 100);
        };
        
        const calculatedDifferences = Object.keys(resultDataWithQarkullimi)
          .filter(key => key.endsWith('Diff'))
          .reduce((acc, diffKey) => {
            const valueKey = diffKey.replace('Diff', '');
            const percentageDiff = calculatePercentageDifference(resultDataWithQarkullimi[valueKey], resultDataWithQarkullimi[diffKey]);
            acc[`${valueKey}PercentageDiff`] = percentageDiff;
            return acc;
          }, {});
        
        const resultDataWithPercentage = {
          ...resultDataWithQarkullimi,
          ...calculatedDifferences, // Merge calculated differences into the resultData
        };
        
        // Update state with the new data including percentage differences
        setDiferencat({ ...diferencat, ...resultDataWithPercentage});
        
        // If you want to log the results

      } catch (error) {
        console.error(error);
      } finally {
        setLoading2(false);
      }
    };
  
    fetchData();
  }, [startDate2]);  

  useEffect(() => {
    const fetchData = async () => {
      const dd = await kalkuloDiferencenDitore(startDate,endDate)
      setDiferencaDitore(dd)
    }

    fetchData()
  },[startDate, endDate])
  
  const kalkuloDiferencenDitore = async (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const diffInMs = start - end;
    
    let diffInDays = diffInMs / (24 * 60 * 60 * 1000);
    diffInDays -=1
    const newStartDate = await kalkuloPeriudhenEKaluar(startDate, diffInDays);
    
    setStartDate2(newStartDate);
  
    return Math.abs(diffInDays);  
  };

  const kalkuloPeriudhenEKaluar = async (startDate, daysBack) => {

    const end = new Date(startDate);
  
    if (isNaN(end)) {
      throw new Error("Invalid end date provided.");
    }
  
    end.setDate(end.getDate() + daysBack);
  
    const year = end.getFullYear();
    const month = (end.getMonth() + 1).toString().padStart(2, '0');  
    const day = end.getDate().toString().padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }

  if (loading) {
    return (
      <Col className='d-flex justify-content-center'>
        <Spinner className='text-success fw-bold fs-5'
          as="span"
          animation="border"
          size="lg"
          role="status"
          aria-hidden="true"
        />
      </Col>
    );
  }

  if (loading) {
    return <div className='text-center'><AnimatedSpinner/></div>;
  }

  const bgColors = [
    // core contextals
    'bg-success',
    
    'bg-secondary',
    'bg-primary',
    'bg-danger',
    'bg-warning',
    'bg-info',
  
    // light & dark neutrals
    'bg-light',
    'bg-dark',
    'bg-white',
  
    // pastel/subtle variants (Bootstrap 5.2+)
    'bg-primary-subtle',
    'bg-secondary-subtle',
    'bg-success-subtle',
    'bg-danger-subtle',
    'bg-warning-subtle',
    'bg-info-subtle',
  
    // gradients (add "bg-gradient")
    'bg-primary bg-gradient',
    'bg-secondary bg-gradient',
    'bg-success bg-gradient',
    'bg-danger bg-gradient',
    'bg-warning bg-gradient',
    'bg-info bg-gradient',
  ];
  
  return (
    <Container fluid className='mt-5'>
    <Row>
    </Row>
      <Row>
        <Col className='d-flex flex-row'>
          {menyratEPageses.map((menyra, index) => (
            <Col key={menyra.menyraPagesesID} className={`m-2 p-3 text-center rounded ${bgColors[index % bgColors.length]}`}>
              <h3>{menyra.emertimi}</h3>
              <h1>{formatCurrency(menyra.shuma)}</h1>
            </Col>
          ))}
        </Col>
       
      </Row>
      <hr />

      <Row className='d-flex flex-column'>
          <Col className='d-flex flex-row justify-content-center '>
            <h4 className='px-3 '>Evidenca brenda Periudhes :</h4>
              <Col className='d-flex'>
                <Form.Group className='mx-1'>
                  <Form.Control
                    type='date'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className='mx-1'>
                  <Form.Control
                    type='date'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Button variant='outline-primary' onClick={() => setTregoGrafikun(!tregoGrafikun)}>{tregoGrafikun ? 'Mbylle Grafikun' : 'Trego Grafikun'}</Button>
          </Col>
         {loading2 ? <AnimatedSpinner/> : 
            <Col>
              {tregoGrafikun ?   
              <ChartComponent diferencat = {diferencat}/>     
              :
              
              <Col className="d-flex flex-wrap justify-content-start align-items-center gap-3 p-3">
                {[
                  { label: 'Totali i Qarkullimit', value: diferencat.totalQarkullimi,diff: diferencat.totalQarkullimiPercentageDiff },
                  { label: 'Totali i Shitjeve', value: diferencat.totaliPagesesShitje ,diff: diferencat.totaliPagesesShitjePercentageDiff || ''},
                  { label: 'Totali i Hyrjeve', value: diferencat.totalHyrje,diff: diferencat.totalHyrjePercentageDiff || ''},
                  { label: 'Totali i Blerjeve', value: diferencat.totaliPagesesBlerje,diff: diferencat.totaliPagesesBlerjePercentageDiff || ''},
                  { label: 'Totali i Servisimeve', value: diferencat.totaliPagesesServisim,diff: diferencat.totaliPagesesServisimPercentageDiff|| '' },
                  { label: 'Totali i Shpenzimeve', value: diferencat.totaliPagesesShpenzim,diff: diferencat.totaliPagesesShpenzimPercentageDiff|| '' },
                  { label: 'Klient te Rinje', value: diferencat.klientTeRinje,diff: diferencat.klientTeRinjePercentageDiff || ''},
                ].map((item, index) => (
                  <>
                    <DashboardStats title = {item.label} value = {item.label == 'Klient te Rinje' ? item.value :formatCurrency(item.value)}  diff = {item.diff} periudhaKohore={diferencaDitore} />
                  </>
                ))}
              </Col>}
            </Col>     

        }
      </Row>
          <hr/><br/>

          <Row>
            <h4 className="text-center mb-4">Evidenca e Pergjithshme:</h4>
            <Col className="d-flex flex-wrap justify-content-start align-items-center gap-3 p-3">
              {[
                { label: 'Vlera e Stokit Aktual ne Blerje', value: produktiData[0]?.vleraEBlerjeve, isCurrency: true },
                { label: 'Vlera e Stokit Aktual ne Shitje', value: produktiData[0]?.VleraShitjeve, isCurrency: true },
                { label: 'Nr. i Produkteve', value: produktiData[0]?.nrProdukteve, isCurrency: false },
                { label: 'Vlera e Shitjeve te Pa Paguara', value: vleraShitjevePaPaguar[0]?.vleraShitjevePaPaguar, isCurrency: true },
                { label: 'Vlera e Serviseve te Pa Paguara', value: vleraServisevePaPaguar[0]?.vleraServisevePaPaguar, isCurrency: true },
                { label: 'Vlera e Blerjeve te Pa Paguara', value: vleraBlerjevePaPaguar[0]?.vleraBlerjevePaPaguar, isCurrency: true },
                { label: 'Nr. i Produkteve me Fature', value: produktiData[0]?.meFatureTeRregulltCount, isCurrency: false },
                { label: 'Totali i Sasise', value: produktiData[0]?.sasiaTotale, isCurrency: false },
                { label: 'Kalkulimi Perfundimtar', value: '', isCurrency: false },
              ].map((item, index) => (
                <Card
                  key={index}
                  className="shadow-sm p-3 d-flex flex-column align-items-center text-center bg-light border-0 rounded"
                  style={{ minWidth: '200px', flex: '1 1 calc(33.333% - 1rem)' }}
                >
                  <Card.Body>
                    <h5 className="text-secondary">{item.label}</h5>
                    <span className="fs-4 fw-bold text-dark">
                      {item.isCurrency ? formatCurrency(item.value) : item.value || 'N/A'}
                    </span>
                  </Card.Body>
                </Card>
              ))}
            </Col>
          </Row>

      <hr />
    </Container>
  );
}
