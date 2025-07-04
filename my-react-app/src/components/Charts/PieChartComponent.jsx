import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Container, Row } from 'react-bootstrap';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function PieChartComponent({ teDhenat = [], labels = [] , lloji = ''}) {

  // Group data by type ('online' or 'dyqan')
  const groupBySales = () => {
    const result = { 'Shitje ne Dyqan': 0, 'Shitje Online': 0 };
    teDhenat.forEach((item) => {
      if (item.lloji === 'dyqan') {
        result['Shitje ne Dyqan']++;
      } else if (item.lloji === 'online') {
        result['Shitje Online']++;
      }
    });
    return result;
  };

  const groupedSales = groupBySales();

  const groupBoughts = () => {
    const result = { 'Me Fature': 0, 'Pa Fature': 0 };
    teDhenat.forEach((item) => {
      if (item.fatureERregullt) {
        result['Me Fature']++;
      } else if (!item.fatureERregullt) {
        result['Pa Fature']++;
      }
    });
    return result;
  };

  const groupedBoughts = groupBoughts();

  // Map grouped data to chart labels
  let nrLLojit 
  if(lloji.startsWith('Sh')){
    nrLLojit = labels.map((label) => groupedSales[label] || 0);
  }else{
    nrLLojit = labels.map((label) => groupedBoughts[label] || 0);
  }

  // Chart data
  const pieChartData = {
    labels, // ['Shitje ne Dyqan', 'Shitje Online']
    datasets: [
      {
        label: `Nr i ${lloji}`, // Label for each segment
        data: nrLLojit, // Corresponding data for each label
        backgroundColor: ['#3e95cd', '#8e5ea2'], // Colors for each segment
      },
    ],
  };

  return (
    <Container>
      <Row className="d-flex flex-row justify-content-center align-items-center " style={{ height: '30vh' }}>
          <Pie
            data={pieChartData}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: 'Totali i Të Dhënave',
                },
              },
            }}
          />
      </Row>
    </Container>
  );
}
