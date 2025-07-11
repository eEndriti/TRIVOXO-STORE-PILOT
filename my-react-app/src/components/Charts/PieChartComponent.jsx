import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Container, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function PieChartComponent({ teDhenat = [], labels = [] , lloji = ''}) {
      const { t } = useTranslation('charts');
  

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
console.log(labels)
  // Chart data
  const pieChartData = {
    labels : [t(labels[0]),t(labels[1])],
    datasets: [
      {
        label: t('Numri i')+` ${lloji == ' Shitjeve' ? t('Shitjeve') : t('Blerjeve')}`, // Label for each segment
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
                  text: t('Totali i Të Dhënave'),
                },
              },
            }}
          />
      </Row>
    </Container>
  );
}
