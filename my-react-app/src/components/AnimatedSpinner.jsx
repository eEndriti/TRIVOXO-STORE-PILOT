import { Spinner } from 'react-bootstrap';
import '../assets/css/animatedSpinner.css';

const AnimatedSpinner = () => {

  return (
    <div className="spinner-container">
      
      <div className="text-animation">
      <Spinner animation="border" role="status" className="custom-spinner mx-3 mb-2">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
        {
          "BerdynaTech".split("").map((char, index) => (
            <span key={index} className="animated-char" style={{ animationDelay: `${index * 0.15}s` }}>
              {char}
            </span>
          ))
        }
      </div>
    </div>
  );
};

export default AnimatedSpinner;
