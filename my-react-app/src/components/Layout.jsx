import { useState, useEffect,useContext } from 'react';
import { Container, Row, Col,ProgressBar,Badge } from 'react-bootstrap';
import logo from '../assets/logo.png';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import '../assets/css/Layout.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faExchangeAlt, faCoins, faGift, faGears } from '@fortawesome/free-solid-svg-icons';
import AuthContext, { formatCurrency } from './AuthContext';

import Cookies from 'js-cookie';


function Layout() {
  const location = useLocation(); 
  const navigate = useNavigate()
  const {authData} = useContext(AuthContext)
  const [perBonuse, setPerBonuse] = useState(0);
  const [profiti, setProfiti] = useState([]);
  const [totalShumaPerBonuse,setTotalShumaPerBonuse] = useState()
  const [totaliIArkes,setTotaliIArkes] = useState()
  const [totaliArkesResult,setTotaliArkesResult] = useState([])
  const [visibleData,setVisibleData] = useState(false)

  useEffect(() => { // ktu jon butonat me  navigu neper faqe F1,F2,F3,F4,F5,F6
    const handleKeyPress = (event) => {
      switch (event.key) {
        case "F1":
          navigate("/faqjakryesore"); 
          event.preventDefault(); 
          break;
        case "F2":
          navigate("/shitje"); 
          break;
        case "F3":
          navigate("/shpenzim"); 
          break;
        case "F4":
          navigate("/blerje"); 
          break;
        case "F5":
          navigate("/serviset"); 
          event.preventDefault(); 
          break;
          case "F6": {
            const shitjeID = Cookies.get('shitjaFunditID');
            if (shitjeID) {

              navigate(`/ndryshoShitjen/${shitjeID}`);
            } else {
              console.log('ee');
            }
            event.preventDefault();
            break;
          }
          case "F7":
            logOut();
            event.preventDefault(); 
            break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [navigate]);

  useEffect(() => {
    
    fetchData();
   
  }, [profiti,authData.nderrimiID,authData.reloadLayout]);
  
  const fetchData = async () => {
    try {
      const receivedData = await window.api.fetchTableProfitiDitor();
      setProfiti((prevProfiti) => {
        return JSON.stringify(receivedData) !== JSON.stringify(prevProfiti) ? receivedData : prevProfiti;
      });
      const totaliIArkesResult = await window.api.fetchTableQuery(`select totaliArkes from nderrimi t where t.nderrimiID = ${authData.nderrimiID}`);
      setTotaliArkesResult(totaliIArkesResult);
      kalkuloBonusetDitore();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
 

  useEffect(() => {

    if(totaliArkesResult.length > 0){
      const totaliArkes = totaliArkesResult[0].totaliArkes || 0; 
      const totalArkesWithAvansi = Number(totaliArkes) + Number(authData.avansi); 
      setTotaliIArkes(totalArkesWithAvansi);
    }
  }, [totaliArkesResult]);

  function kalkuloBonusetDitore() {
    const totalShuma = profiti.reduce((accumulator, current) => accumulator + current.shumaPerBonuse, 0);
    setTotalShumaPerBonuse(totalShuma)
    let bonus = 0;

    if (totalShuma > 199) {
      bonus = 10; 
      const additionalAmount = totalShuma - 200;
      bonus += Math.floor(additionalAmount / 100) * 5;
    }

    setPerBonuse(bonus);
  }

  const getPerBonuseFillBar = () => {
    const totalShuma = profiti.reduce((accumulator, current) => accumulator + current.shuma, 0);
    const percentage = (totalShuma / 200) * 100;
      return percentage  
  };

  function formatDate(dateString) {
    const date = new Date(dateString);
  
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

  const logOut = () => {
    clearAllCookies();
    localStorage.clear();
    window.location.reload()
  };
  
  const clearAllCookies = () => {
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  };
console.log(authData.dataFillimit)
 
    return (
      <div className='container-fluid p-0'>
        {/* Top Navigation Bar */}
        <Container fluid className='navTop text-light p-3 '>
          <Row className='align-items-center '>
            <Col xs={12} md={8} className='d-flex justify-content-between'>
              <div className='d-flex align-items-center'>
              <span className='me-3'>
                <FontAwesomeIcon icon={faCoins} className='me-2 text-warning fs-4' />
                Totali i Arkes: <strong>{formatCurrency(totaliIArkes)}</strong>
                 <span className='d-block text-muted text-center'>Avansi: {formatCurrency(authData.avansi,false)}</span>
              </span>
                <span className='me-4'></span>
  
                <FontAwesomeIcon icon={faExchangeAlt} className='me-2 text-success fs-5' />
                <span className='me-4'>Nderrimi: <strong>{authData.numriPercjelles}-{formatDate(authData.dataFillimit)}</strong></span>
  
                {authData.aKaUser == 'admin' && 
                    <> 
                      <Col className='mt-2'  onMouseEnter={() => {setVisibleData(true) }} onMouseLeave={() => setVisibleData(false)}>
                      {visibleData ? 
                          <>
                            <Col className='d-flex flex-row pb-2' >
                              <FontAwesomeIcon icon={faGift} className='me-2 text-info fs-5' />
                              <span>Bonuse: <strong>{formatCurrency(perBonuse)}</strong> <span className='d-inline mx-4 text-secondary'>{formatCurrency(totalShumaPerBonuse)}</span></span> 
                            </Col>
                            <Col className='w-50'><ProgressBar animated variant={getPerBonuseFillBar() > 199 ? 'success' : 'info'} now={getPerBonuseFillBar()} style={{height:'7px'}}/></Col>
                          </>
                          : <span >*****</span>}
                      </Col>
                    </>
                  }
              </div>
               
            </Col>
  
            <Col xs={12} md={4} className='d-flex justify-content-end align-items-center'>
              <span className='me-3'>
                <FontAwesomeIcon icon={faUser} className='me-2 text-success fs-4' />
                {authData.emriPerdoruesit} <span className='d-block text-muted'>Roli: {authData.aKaUser}</span>
              </span>
              <NavLink onClick={() => logOut()} className='btn btn-danger'>
                <FontAwesomeIcon icon={faSignOutAlt} className='me-1' /> Dil
              </NavLink>
            </Col>
          </Row>
        </Container>
  
        <Container fluid className='p-0 pt-5'>
          <Row className='g-0'>
            {/* Sidebar */}
            <Col xs={12} sm={3} md={2} className='bg-sidebar sidebar '>
              <div className='logo d-flex justify-content-start mt-4 mx-4 w-100 ' style={{'height': '105px'}}>
                <img className='w-50 ' src={logo} alt="logo" />
              </div>
              <div className='sidebar-content d-flex flex-column'>
              <NavLink exact to='/faqjaKryesore' className='nav-link' activeClassName='active'>
                Kryefaqja <Badge bg="secondary" className="ms-2 float-end">F 1</Badge>
              </NavLink>
              <NavLink to='/shitje' className='nav-link' activeClassName='active'>
                Shitje <Badge bg="secondary" className="ms-2 float-end">F 2</Badge>
              </NavLink>
              <NavLink to='/shpenzim' className='nav-link' activeClassName='active'>
                Shpenzim <Badge bg="secondary" className="ms-2 float-end">F3</Badge>
              </NavLink>
              {authData.aKaUser == 'admin' && <NavLink exact to='/blerje' className='nav-link' activeClassName='active'>
                Blerje <Badge bg="secondary" className="ms-2 float-end">F4</Badge>
              </NavLink>}
              <NavLink to='/serviset' className='nav-link' activeClassName='active'>
                Serviset <Badge bg="secondary" className="ms-2 float-end">F5</Badge>
              </NavLink>
                <NavLink to='/stoku' className='nav-link' activeClassName='active'>
                  Stoku
                </NavLink>
                <NavLink to='/klient' className='nav-link' activeClassName='active'>
                  Klient
                </NavLink>
                {authData.aKaUser == 'admin' && <>
                  <NavLink exact to='/furnitor' className='nav-link' activeClassName='active'>
                  Furnitor
                </NavLink>
                <NavLink to='/printoLabell' className='nav-link' activeClassName='active'>
                  Testo Labellen
                </NavLink>
                <NavLink to='/evidenca' className='nav-link' activeClassName='active'>
                  Evidenca
                </NavLink>
                <NavLink exact to='/transaksionet' className='nav-link' activeClassName='active'>
                  Transaksionet
                </NavLink>
                <NavLink to='/administrimi' className='nav-link' activeClassName='active'>
                  Administrimi
                </NavLink>
                <NavLink to='/parametrat' className='nav-link' activeClassName='active'>
                  Parametrat <FontAwesomeIcon icon={faGears} />
                </NavLink>
                </>}
                {/**<div className='current-url p-3'>
                  <p>Current URL: {location.pathname}</p> {/* Display the current URL }
                </div> */}
              </div>
            </Col>
  
            {/* Main Content Area */}
            <Col xs={12} sm={9} md={10} className='p-4'>
              <Outlet />
            </Col>
          </Row>
        </Container>
      </div>
    );
}

export default Layout;
