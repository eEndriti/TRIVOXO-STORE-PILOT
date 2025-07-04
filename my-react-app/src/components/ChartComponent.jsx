import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Container,Row } from 'react-bootstrap';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ChartComponent = ({ diferencat = {} }) => {
  console.log('chart df',diferencat)
  // Data for Bar Chart
  const barChartData = {
    labels: ['Shitje', 'Blerje', 'Shpenzime', 'Servisime', 'Hyrje'],
    datasets: [
      {
        label: 'Nga Periudha Aktuale',
        data: [diferencat.totaliPagesesShitje, diferencat.totaliPagesesBlerje, diferencat.totaliPagesesShpenzim, diferencat.totaliPagesesServisim, diferencat.totalHyrje],
        backgroundColor:['#3e95cd', '#ffcc00', '#ff5733', '#8e5ea2', '#3cba9f']        ,
        borderColor: '#fff',
        borderWidth: 1,
      },
      {
        label: 'Nga Periudha Paraprake',
        data: [diferencat.totaliPagesesShitjeDiff, diferencat.totaliPagesesBlerjeDiff, diferencat.totaliPagesesShpenzimDiff, diferencat.totaliPagesesServisimDiff, diferencat.totalHyrjeDiff],
        backgroundColor: ['#d9e8fb', '#fff4b3', '#ffcdc2', '#e6c9e6', '#c1f2e6'],
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  // Data for Pie Chart
  const pieChartData = {
    labels: ['Shitje', 'Blerje', 'Shpenzime', 'Servisime', 'Hyrje'],
    datasets: [
      {
        data: [diferencat.totaliPagesesShitje, diferencat.totaliPagesesBlerje, diferencat.totaliPagesesShpenzim, diferencat.totaliPagesesServisim, diferencat.totalHyrje],
        backgroundColor: ['#3e95cd', '#8e5ea2', '#3cba9f', '#ffcc00', '#ff5733'],
      },
    ],
  };

  return (
    <Container>
      <Row className='d-flex flex-row justify-content-center align-items-center'>
        <div style={{ width: '50%', margin: '0 auto' }}>
            <Bar data={barChartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Totali i Të Dhënave ' } } }} />
        </div>
        <div style={{ width: '35%', margin: '0 auto', marginTop: '50px' }}>
            <Pie data={pieChartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Totali i Të Dhënave ' } } }} />
        </div>
      </Row>
    </Container>
  );
};

export default ChartComponent;
