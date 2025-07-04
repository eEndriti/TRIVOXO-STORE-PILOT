import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router.jsx'
import './assets/bootstrap.min.css'
import './assets/css/main.css'
import { AuthProvider } from './components/AuthContext.jsx'
import { toast,ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastProvider } from "./components/ToastProvider";




ReactDOM.createRoot(document.getElementById('root')).render(
    <AuthProvider>
        <ToastProvider>
            <RouterProvider router={router} />
        </ToastProvider>   
    </AuthProvider>
)