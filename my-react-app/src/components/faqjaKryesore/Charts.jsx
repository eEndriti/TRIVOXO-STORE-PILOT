import React, { useEffect, useState } from 'react';
import { CardBody, CardTitle, Container,Card } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,LineChart,Line,PieChart,Pie,Area,AreaChart,ScatterChart,Scatter,Radar,RadarChart,PolarGrid,PolarAngleAxis } from 'recharts';

export default function Charts({ transaksionet = [], nderrimiAktual, nderrimiSelektuar, nrPercjelles,dataNderrimitSelektuar }) {
    const [chartData, setChartData] = useState([]);
    const [dataAktual1,setDataAktual] = useState()
    const [dataSelektuar1,setDataSelektuar] = useState()
    useEffect(() => {
        const transaksionetFiltered = transaksionet.filter(tr => tr.lloji === 'Shitje' || tr.lloji === 'Servisim');

        const trNderrimitAktual = transaksionetFiltered.filter(tr => tr.nderrimiID == nderrimiAktual);
        const trNderrimitSelektuar = transaksionetFiltered.filter(tr => tr.nderrimiID == nderrimiSelektuar);


        const groupByHour = (data) => {
            return data.reduce((acc, tr) => {
                const date = new Date(tr.dataTransaksionit);
                const hour = date.getHours(); 
                    const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
                    acc[hourLabel] = (acc[hourLabel] || 0) + (parseFloat(tr.totaliperPagese) || 0);
                return acc;
            }, {});
        };

        const dataAktual = groupByHour(trNderrimitAktual);
        const dataSelektuar = groupByHour(trNderrimitSelektuar);
        setDataAktual(dataAktual)
        setDataSelektuar(dataSelektuar)
        const allHours = [
          ...Object.keys(dataAktual),
          ...Object.keys(dataSelektuar)
        ]
        const uniqueHours = [...new Set(allHours)].sort((a, b) => {
          const hourA = parseInt(a.split(':')[0], 10);
          const hourB = parseInt(b.split(':')[0], 10);
          return hourA - hourB;
      });

        const hasDataAktual = Object.keys(dataAktual).length > 0;
        const hasDataSelektuar = Object.keys(dataSelektuar).length > 0;

        const mergedData = uniqueHours.map(hour => ({
            hour,
            nderrimiAktual: hasDataAktual ? dataAktual[hour] || 0 : (hasDataSelektuar ? 0 : undefined),
            nderrimiSelektuar: hasDataSelektuar ? dataSelektuar[hour] || 0 : (hasDataAktual ? 0 : undefined)
        })).filter(item => item.nderrimiAktual !== undefined || item.nderrimiSelektuar !== undefined);

        setChartData(mergedData);
    }, [transaksionet, nderrimiAktual, nderrimiSelektuar]);

    return (
        <Container>
            <Card>
              <CardTitle className='text-center'>{`Krahasimi i Nderrimit Aktual me Nderrimin : ${nrPercjelles} / ${dataNderrimitSelektuar}`}</CardTitle>
              <CardBody className='d-flex'>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="nderrimiAktual" fill="#8884d8" name="Nderrimi Aktual" />
                      <Bar dataKey="nderrimiSelektuar" fill="#82ca9d" name="Nderrimi Selektuar" />
                  </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="nderrimiAktual" stroke="#8884d8" name="Nderrimi Aktual" />
                  <Line type="monotone" dataKey="nderrimiSelektuar" stroke="#82ca9d" name="Nderrimi Selektuar" />
                </LineChart>
              </ResponsiveContainer>
              </CardBody>
            </Card>

        </Container>
    );
}
