import React, { useState,useEffect } from 'react'
import { useToast } from './ToastProvider';
import { Container,Row, Table } from 'react-bootstrap'
import AnimatedSpinner from './AnimatedSpinner';
import { formatCurrency, formatLongDateToAlbanian, formatTime } from './AuthContext';

export default function TransferetBankare() {
    const [loading,setLoading] = useState(false)
    const [transferetBankare, setTransferetBankare] = useState([])
    const [triggerReload, setTriggerReload] = useState(false)
    const showToast = useToast()
    useEffect(() => {
       
        fetchData();

    }, [triggerReload]);

    const fetchData = async () => {
        try {
            setLoading(true)
            const response = await window.api.getTransferetBankare()
            setTransferetBankare(response)
        } catch (error) {
            showToast('Gabim '+error.message, 'error')
        }finally{
            setLoading(false)
        }
    }

  return (
    <Container>
        <Row className='tableMaxHeight50'>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Nr</th>
                        <th>Shifra</th>
                        <th>Nga Opsioni</th>
                        <th>Ne Opsionin</th>
                        <th>Shuma</th>
                        <th>Nderrimi, Data dhe Ora Transferit</th>
                        <th>Perdoruesi</th>
                    </tr>
                </thead>
                {loading ? <td colSpan={7}><AnimatedSpinner/></td> :
                    transferetBankare?.length > 0 ? <tbody>
                    {transferetBankare && transferetBankare.map((item,index) => (
                        <tr key={index}>
                            <td>{index+1}</td>
                            <td>{item.shifra}</td>
                            <td>{item.ngaMenyraPageses}</td>
                            <td>{item.neMenyraPageses}</td>
                            <td>{formatCurrency(item.balanci)}</td>
                            <td>{item.numriPercjelles} / {formatLongDateToAlbanian(item.dataTransferit)} / {formatTime(item.dataTransferit)}</td>
                            <td>{item.perdoruesi}</td>
                        </tr>
                    ))}
                </tbody> : <tbody><tr><td colSpan={7} className='text-center'>Nuk ka te dhena</td></tr></tbody>
                }
                
            </Table>
        </Row>
    </Container>
  )
}
