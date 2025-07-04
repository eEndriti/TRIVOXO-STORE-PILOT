import { useEffect } from 'react';
import { Container,Row,Col } from 'react-bootstrap'
import Transaksionet from './Transaksionet';
import Porosite from './Porosite';
import Serviset from './Serviset';
import { ToastContainer } from 'react-toastify';
import { useToast } from '../ToastProvider';
import { useLocation } from "react-router-dom";

function FaqjaKryesoreAdmin() {
  const location = useLocation();
  const showToast = useToast();
  
  useEffect(() => {
    if (location.state?.showToast) {
      
        showToast(location.state.message ,location.state.type );
        location.state.showToast = false;
        
    }
}, [location.state]);

  return (
    <Container fluid className="pt-3 modern-container">
     
          <Row>
            <Transaksionet />
          </Row>

          <Row>

            <Col lg={6} md={12} className="mb-4">
              <Porosite />
            </Col>

            <Col lg={6} md={12} className="mb-4">
              <Serviset />
            </Col>
           
      </Row>
     <ToastContainer/>
    </Container>

  )
}

export default FaqjaKryesoreAdmin