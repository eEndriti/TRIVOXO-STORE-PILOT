import React from 'react';
import { Navigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import AuthContext from "./AuthContext";
import { useContext } from 'react';

const ProtectedRoute = ({ element, requiredRole }) => {
  const { authData } = useContext(AuthContext)
  const userRole = authData.aKaUser
  console.log('perd',userRole)

  if (!userRole || (requiredRole && userRole !== requiredRole)) {
    return <Navigate to='/faqjaKryesore' replace />;
  }

  return element;
};

export default ProtectedRoute;
