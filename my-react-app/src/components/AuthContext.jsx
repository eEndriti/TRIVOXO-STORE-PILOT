import { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const AuthContext = createContext();
const albanianMonths = [
  "Janar", "Shkurt", "Mars", "Prill", "Maj", "Qershor",
  "Korrik", "Gusht", "Shtator", "Tetor", "Nëntor", "Dhjetor"
];

export const formatLongDateToAlbanian = (dateString) => {
  const date = new Date(dateString);  
  const day = date.getDate()    
  const month = albanianMonths[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

export const formatTime = (dateString) => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};


export const formatCurrency = (value,kushti) => {
  if (value == null || isNaN(value)) return `0.00 ${!kushti ? '€':''}`;

  const formattedValue = new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `${formattedValue} ${!kushti ? '€':''}`;
};
export const normalizoDaten = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0); // Set time to 00:00:00
  return d;
};
export const localTodayDate = () => {
  const today = new Date();
  const localDate = today.toLocaleDateString('en-CA', { timeZone: 'Europe/Berlin' }); 
  return localDate
}

export const formatDate = (date) => {
  const data = new Date(date).toISOString().split('T')[0]
} 
export const AuthProvider = ({ children }) => {
  const [authData, setAuthData] = useState({});
  const [authReady, setAuthReady] = useState(false); 
  useEffect(() => {
    const aKaUser = Cookies.get('aKaUser');
    if (aKaUser) {
      setAuthData({ 'aKaUser': aKaUser });
    }
    setAuthReady(true); 
  }, []);

  const updateAuthData = (newData) => {
    setAuthData((prevData) => ({
      ...prevData,
      ...newData,
    }));
  };

  useEffect(() => {
    const perdoruesiID = Cookies.get('perdoruesiID');
    const emriPerdoruesit = Cookies.get('emriPerdoruesit');
    const aKaUser = Cookies.get('aKaUser');
    const nderrimiID = Cookies.get('nderrimiID');
    const avansi = Cookies.get('avansi')
    const numriPercjelles = Cookies.get('numriPercjelles');
    const dataFillimit = Cookies.get('dataFillimit');
    const folderPathGarancionet = 'C:\\Users\\BerdynaTech\\Documents\\btechPDFtest';
    const shitjeFunditID = Cookies.get('shitjeFunditID');
    const reloadLayout = (false)
    const reloadShpenzimi = (false)
    const pdfFolder = ''
    setAuthData({
      perdoruesiID,
      emriPerdoruesit,
      aKaUser,
      nderrimiID,
      avansi,
      numriPercjelles,
      dataFillimit,
      folderPathGarancionet,
      shitjeFunditID,
      reloadLayout,
      reloadShpenzimi,
      pdfFolder
    });
  }, []);

  return (
    <AuthContext.Provider value={{ authData, updateAuthData }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the context for consumption
export default AuthContext;