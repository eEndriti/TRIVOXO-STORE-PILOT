import { useState,useEffect } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import FaqjaKryesore from './components/faqjaKryesore/FaqjaKryesore';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './components/NotFound'; 
import Shitje from './components/Shitje';
import Shpenzim from './components/shpenzimi/Shpenzim';
import Blerje from './components/Blerje';
import Produktet from './components/stoku/Produktet';
import Kategorite from './components/stoku/Kategorite';
import Furnitor from './components/subjekti/Furnitor';
import Klient from './components/subjekti/Klient';
import Blerjet from './components/Blerjet';
import Shitjet from './components/Shitjet';
import DetajePerKlient from './components/subjekti/DetajePerKlient';
import Evidenca from './components/Evidenca';
import Transaksionet from './components/Transaksionet';
import Serviset from './components/Serviset';
import DetajePerProdukt from './components/stoku/DetajePerProdukt';
import NdryshoShitjen from './components/NdryshoShitjen';
import Cookies from 'js-cookie';
import Administrimi from './components/Administrimi';
import PrintoLabell from './components/PrintoLabell';
import NdryshoBlerjen from './components/NdryshoBlerjen';
import Parametrat from './components/parametrat/Parametrat';
import AuthContext from "./components/AuthContext";
import { useContext } from 'react';
import Logs from './components/Logs';


const isAuthenticated = () => {
  
  return !!Cookies.get('aKaUser'); 
};

const LayoutWrapper = () => {

  const { authData, authReady } = useContext(AuthContext);

  let user = ''
  if(authData.aKaUser ) {
    user = authData.aKaUser
  }else if(Cookies.get('aKaUser')){
    user = Cookies.get('aKaUser')
  }

  return user ? <Layout /> : <Navigate to="/login" replace />;

};


const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <LayoutWrapper />, 
    children: [
      {
        path: '/faqjakryesore',
        element: <FaqjaKryesore />,
      },
      {
        path: '/shitje',
        element: <Shitje />,
      },
      {
        path: '/ndryshoShitjen/:shitjeID',
        element: <NdryshoShitjen />,
      },
      {
        path: '/ndryshoBlerjen/:blerjeID',
        element: <NdryshoBlerjen />,
      },
      {
        path: '/shpenzim',
        element: <Shpenzim />,
      },
      {
        path: '/blerje',
        element: <ProtectedRoute element={<Blerje />} requiredRole="admin" />,
      },
      {
        path: '/serviset',
        element: <Serviset />,
      },
      {
        path: '/stoku',
        element: <Produktet />,
      },
      {
        path: '/detajePerProdukt/:produktiID',
        element: <ProtectedRoute element={<DetajePerProdukt />} requiredRole="admin" />,
      },
      {
        path: '/kategorite',
        element: <Kategorite />,
      },
      {
        path: '/klient',
        element: <Klient />,
      },
      {
        path: '/furnitor',
        element: <ProtectedRoute element={<Furnitor />} requiredRole="admin" />,
      },
      {
        path: '/blerjet',
        element: <Blerjet />,
      },
      {
        path: '/shitjet',
        element: <Shitjet />,
      },
      {
        path: '/detajePerSubjekt/:lloji/:subjektiID',
        element: <ProtectedRoute element={<DetajePerKlient />} requiredRole="admin" />,
      },
      {
        path: '/evidenca',
        element: <ProtectedRoute element={<Evidenca />} requiredRole="admin" />,
      },
      {
        path: '/transaksionet',
        element: <ProtectedRoute element={<Transaksionet />} requiredRole="admin" />,
      },
      {
        path: '/transaksionet/logs',
        element: <ProtectedRoute element={<Logs />} requiredRole="admin" />,
      },
      {
        path: '/printoLabell',
        element: <PrintoLabell />,
      },
      // Protect the 'administrimi' route (only for admins)
      {
        path: '/administrimi',
        element: <ProtectedRoute element={<Administrimi />} requiredRole="admin" />,
      },
      {
        path: '/parametrat',
        element: <ProtectedRoute element={<Parametrat />} requiredRole="admin" />,
      },
      {
        path: '/',
        element: <Navigate to='/faqjakryesore' replace />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
