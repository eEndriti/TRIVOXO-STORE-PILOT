import { useState, useEffect, useContext, useRef } from 'react';
import { Container, Form, Button, Row, Modal, Spinner,Col } from 'react-bootstrap';
import {  useNavigate } from 'react-router-dom';
import {ToastContainer } from 'react-toastify';
import { useToast } from './ToastProvider';
import AnimatedSpinner from './AnimatedSpinner';
import Cookies from 'js-cookie';
import  AuthContext, { localTodayDate }  from './AuthContext';
import KonektoDatabazen from './KonektoDatabazenModal';
import './Login.css'
export default function Login() {
  const [perdoruesit, setPerdoruesit] = useState([]);
  const [perdoruesiID, setPerdoruesiID] = useState('');
  const [fjalekalimi, setFjalekalimi] = useState('');
  const [currentShift, setCurrentShift] = useState(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [avansAmount, setAvansAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const showToast = useToast();
  const navigate = useNavigate()
  const {  updateAuthData,authData } = useContext(AuthContext);
  const [konektoDatabazen, setKonektoDatabazen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
const isElectron = !!(window && window.electronAPI);
  const passwordRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [receivedData, receivedShift] = await Promise.all([
          window.api.fetchTablePerdoruesi(),
          window.api.kontrolloNderriminAktual(),
        ]);
        setPerdoruesit(receivedData);
        setCurrentShift(receivedShift);
        console.log('receivedShift:', receivedShift);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
        localStorage.clear();
      }
    };

    if(isElectron){
      fetchData();
    }else{
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const day = String(now.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      setSessionCookie('aKaUser','admin')
      setSessionCookie('perdoruesiID', 1);
      setSessionCookie('emriPerdoruesit', 'admin');
      setSessionCookie('nderrimiID', 1);
      setSessionCookie('avansi', 250);
      setSessionCookie('numriPercjelles', 1);
      setSessionCookie('dataFillimit', formattedDate);

      updateAuthData({ nderrimiID: 1, avansi: 250, numriPercjelles: 1, dataFillimit: formattedDate,pdfFolder:'/' ,isElectron:true});
      updateAuthData({ aKaUser: 'admin',emriPerdoruesit: 'admin',perdoruesiID: 1 }); 
      setTimeout(() => {
              console.log('marrim auth data:', 'admin')
              navigate('/faqjakryesore', { replace: true });
            }, 100);
    }
  }, []);

  useEffect(() => {
    setFjalekalimi('');
    if (selectedUser && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [selectedUser]);

  const handleAvatarClick = (u) => {
    setPerdoruesiID(u.perdoruesiID);
    setSelectedUser(u);
  };
  
  const setSessionCookie = (name, value) => {
    Cookies.set(name, value);
  };



  const handleLogin = async (e) => {
    const data = { perdoruesiID, fjalekalimi }; 
    e.preventDefault(); 
    try {

      const result = await window.api.login(data);
      if (result.success) {
        return result; 
      } else {
        showToast('Login failed ' + result.message , 'error'); 
        return null; 
      }
    } catch (error) {
      console.error('Error during login:', error);
      showToast('Ndodhi nje Gabim!' , 'error');
    }
  };

  const kontrolloKredinencialet = async (e) => {
    try {
      const perdoruesi = await handleLogin(e);
      if (perdoruesi) {
        // Store user data in cookies
        setSessionCookie('perdoruesiID', perdoruesi.perdoruesiID);
        setSessionCookie('emriPerdoruesit', perdoruesi.emertimi);
        setSessionCookie('aKaUser', perdoruesi.roli);
        updateAuthData({ aKaUser: perdoruesi.roli,emriPerdoruesit: perdoruesi.emertimi,perdoruesiID: perdoruesi.perdoruesiID }); 

        const currentDate = new Date().toLocaleDateString();
        
        console.log('currentShift:', currentShift);
        if (currentShift) {
         
          const shiftDate = new Date(currentShift.dataFillimit).toLocaleDateString();

          setSessionCookie('nderrimiID', currentShift.nderrimiID);
          setSessionCookie('avansi', currentShift.avansi);
          setSessionCookie('numriPercjelles', currentShift.numriPercjelles);
          setSessionCookie('dataFillimit', currentShift.dataFillimit);
          const config = await window.api.loadDbConfig();
          updateAuthData({ nderrimiID: currentShift.nderrimiID, avansi: currentShift.avansi, numriPercjelles: currentShift.numriPercjelles, dataFillimit: currentShift.dataFillimit,pdfFolder:config.pdfFolder });
          
          if (currentDate !== shiftDate) {
            const data = {
              perdoruesiID:perdoruesi.perdoruesiID,
              nderrimiID: currentShift.nderrimiID,
            }
            await window.api.mbyllNderriminAktual(data);
            setShowAdvanceModal(true);
          } else {
            setTimeout(() => {
              console.log('marrim auth data:', authData.aKaUser)
              navigate('/faqjakryesore', { replace: true });
            }, 100);
          }
        } else {
          setShowAdvanceModal(true);
        }
      } else {
        showToast('Keni Gabuar Perdoruesin ose Fjalekalimin','error');
      }
    } catch (error) {
      showToast("Gabim gjate Procesit se Kyqjes:"+ error,'error');
    }
  };

  const filloNderriminERi = async () => {
    setButtonLoading(true);
    try {
      await window.api.filloNderriminERi(perdoruesiID, avansAmount);
      await dataForCookies(); 
      setShowAdvanceModal(false);
      setAvansAmount('');
    } catch (error) {
      console.error("Gabim gjate fillimit te nderrimit te ri:", error);
    } finally {
      setButtonLoading(false);
    }
  };

  const dataForCookies = async () => {
    try {
      const receivedShift = await window.api.kontrolloNderriminAktual();
      setSessionCookie('nderrimiID', receivedShift.nderrimiID);
      setSessionCookie('avansi', receivedShift.avansi);
      setSessionCookie('numriPercjelles', receivedShift.numriPercjelles);
      setSessionCookie('dataFillimit', receivedShift.dataFillimit);
      updateAuthData({ nderrimiID: receivedShift.nderrimiID, avansi: receivedShift.avansi, numriPercjelles: receivedShift.numriPercjelles, dataFillimit: receivedShift.dataFillimit });
    } catch (error) {
      showToast('Gabim gjate marrjes se te dhenave per Cookies:', error,'error');
    } finally {
      setTimeout(() => {
        navigate('/faqjakryesore', { replace: true });
      }, 100);
    }
  };

  
  return (
    <>
      {loading ? (
        <AnimatedSpinner />
      ) : (
        <Container>
          <Row className='mt-5 pt-5 d-flex justify-content-center '>
            <Form className="col-md-6 shadow-lg p-4 rounded bg-light">
              <h3 className="text-center text-primary mb-4">Kyqu</h3>

              <Row className="avatar-list mt-4 justify-content-center">
                {perdoruesit.map(u => {
                  const isSel = selectedUser?.perdoruesiID === u.perdoruesiID;
                  return (
                    <Col
                      key={u.perdoruesiID}
                      xs="auto"
                      className="avatar-col"
                      onClick={() => handleAvatarClick(u)}
                    >
                      <div className={`avatar ${isSel ? 'selected' : ''}`} >
                        {u.emri.charAt(0).toUpperCase()}
                      </div>
                      <div className="avatar-label">{u.emri}</div>
                    </Col>
                  );
                })}
              </Row>


              {selectedUser && (
                <Form  className="password-panel">
                  <Form.Group controlId="loginPassword" className="mb-3">
                    <Form.Label>Fjalëkalimi për {selectedUser.emri}</Form.Label>
                    <Form.Control
                      ref={passwordRef}
                      type="password"
                      value={fjalekalimi}
                      onChange={e => setFjalekalimi(e.target.value)}
                      placeholder="Shkruaj fjalekalimin..."
                      required
                    />
                  </Form.Group>
                  <div className="d-grid">
                    <Button
                      type="submit"
                      variant="primary"
                      className="login-button"
                      disabled={buttonLoading}
                      onClick={(e) => kontrolloKredinencialet(e)}
                    >
                      {buttonLoading ? 'Duke kyçur...' : 'Kyçu'}
                    </Button>
                  </div>
                </Form>
              )}         
             <Col className='float-end mt-2'>
              <Button
                  variant="transparent"
                  className="w-25"
                  onClick={() => setKonektoDatabazen(true)} 
                >
                  
                </Button>
             </Col>
            </Form>
          </Row>

          {/* Modal per me shenu avansin */}
          <Modal show={showAdvanceModal} onHide={buttonLoading ? null : () => setShowAdvanceModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Sheno Avansin:</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Control
                type="number"
                placeholder="Sheno Shumen e Avansit..."
                value={avansAmount}
                onChange={e => setAvansAmount(e.target.value)}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAdvanceModal(false)}>
                Anulo
              </Button>
              <Button variant="primary" disabled={buttonLoading} onClick={(e)=> {
                e.preventDefault();
                
                  filloNderriminERi();
                
              }}>
                {buttonLoading ? <><Spinner size="sm" /> {'Duke Startuar...'}</> : 'Vazhdo'}
              </Button>
            </Modal.Footer>
          </Modal>

          <ToastContainer />
          <KonektoDatabazen isOpen={konektoDatabazen} onClose={() => setKonektoDatabazen(false)} />
          </Container>
      )}
    </>
  );
}
