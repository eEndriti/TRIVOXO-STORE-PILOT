import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Container,Row } from 'react-bootstrap';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ChartComponent = ({ totalShitje, totalBlerje, totalShpenzime, totalServisime, totalHyrje }) => {

  // Data for Bar Chart
  const barChartData = {
    labels: ['Shitje', 'Blerje', 'Shpenzime', 'Servisime', 'Hyrje'],
    datasets: [
      {
        label: 'Totali (€)',
        data: [totalShitje, totalBlerje, totalShpenzime, totalServisime, totalHyrje],
        backgroundColor: ['#3e95cd', '#8e5ea2', '#3cba9f', '#ffcc00', '#ff5733'],
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
        data: [totalShitje, totalBlerje, totalShpenzime, totalServisime, totalHyrje],
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
