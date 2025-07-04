import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Row, Col } from 'react-bootstrap';
import {formatLongDateToAlbanian, formatTime, normalizoDaten} from './AuthContext'
const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await window.api.fetchTableLogs();
                setLogs(data);
                setFilteredLogs(data);
            } catch (error) {
                console.error('Gabim gjatë marrjes së log-eve:', error);
            }
        };

        fetchLogs();
    }, []);

    useEffect(() => {
        
        let filtered = logs;
        
        if (searchTerm.trim()) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filtered = filtered.filter(log =>
                (log.komponenta && log.komponenta.toLowerCase().includes(lowercasedFilter)) ||
                (log.pershkrimi && log.pershkrimi.toLowerCase().includes(lowercasedFilter)) ||
                (log.nderrimi && log.nderrimi.toLowerCase().includes(lowercasedFilter)) ||
                (log.perdoruesi && log.perdoruesi.toLowerCase().includes(lowercasedFilter))
            );
        }
        
        if (startDate) {
            filtered = filtered.filter(log => {
                const logDate = normalizoDaten(log.dataDheOra);
             
                
                return logDate >= normalizoDaten(new Date(startDate));
            });
        }
        if (endDate) {
            filtered = filtered.filter(log => {
                const logDate =  normalizoDaten(log.dataDheOra);
                return logDate <= normalizoDaten(new Date(endDate));
            });
        }
        
        setFilteredLogs(filtered);
    }, [searchTerm, startDate, endDate, logs]);

    return (
        <Container className="mt-4">
            <Row className="mb-3">
                <Col>
                    <h2>Logs</h2>
                </Col>
                <Col md="3">
                    <Form.Control
                        type="text"
                        placeholder="Kërko në log-e..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </Col>
                <Col md="3">
                    <Form.Control
                        type="date"
                        placeholder="Data fillestare"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                </Col>
                <Col md="3">
                    <Form.Control
                        type="date"
                        placeholder="Data mbarimit"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                </Col>
            </Row>
            <Row>
                <div className='tableHeight80'>
                    <Table striped bordered hover responsive >
                        <thead>
                            <tr>
                                <th>Komponenta</th>
                                <th>Pershkrimi</th>
                                <th>Nderrimi, Data dhe Ora</th>
                                <th>Perdoruesi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs && filteredLogs.length > 0 ? (
                                filteredLogs.map((log, index) => (
                                    <tr key={index}>
                                        <td>{log.komponenta}</td>
                                        <td>{log.pershkrimi}</td>
                                        <td>{log.numriPercjelles} - {formatLongDateToAlbanian(log.dataDheOra)} / {formatTime(log.dataDheOra)}</td>
                                        <td>{log.perdoruesi}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">Nuk u gjet asnjë log</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </Row>
        </Container>
    );
};

export default Logs;