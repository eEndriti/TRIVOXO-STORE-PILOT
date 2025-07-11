import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Container, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

// Albanian month names
const albanianMonths = [
  'Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor',
  'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor',
];

// Generate date labels between start and end date
const generateDateLabels = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const labels = [];
  while (start <= end) {
    const day = start.getDate().toString().padStart(2, '0'); // Ensure 2-digit day
    const month = albanianMonths[start.getMonth()]; // Get Albanian month name
    const year = start.getFullYear();
    labels.push(`${day} ${month} ${year}`);
    start.setDate(start.getDate() + 1); // Increment by one day
  }
  return labels;
};
const LineChartComponent = ({ dataFillimit, dataMbarimit, teDhenat = [], lloji }) => {
    const { t } = useTranslation('charts');
  
  const labels = [];
  const start = new Date(dataFillimit);
  const end = new Date(dataMbarimit);

  while (start <= end) {
    labels.push(start.toLocaleDateString('sq-AL', { day: '2-digit', month: 'long', year: 'numeric' }));
    start.setDate(start.getDate() + 1);
  }

  const filteredSales = teDhenat.filter((sale) => {
    const saleDate = new Date(sale.dataTransaksionit);
    return saleDate >= new Date(dataFillimit) && saleDate <= new Date(dataMbarimit);
  });

  const groupByDay = (sales) => {
    const result = {};
    sales.forEach((sale) => {
      const saleDate = new Date(sale.dataTransaksionit).toLocaleDateString('sq-AL', { day: '2-digit', month: 'long', year: 'numeric' });
      if (!result[saleDate]) {
        result[saleDate] = 0;
      }
      result[saleDate]++;
    });
    return result;
  };

  const groupedSales = groupByDay(filteredSales);
  const nrLLojit = labels.map((label) => groupedSales[label] || 0);
  const chartData = {
    labels,
    datasets: [
      {
        label: t('Numri i')+`${lloji == 'Shitjeve' ? t('Shitjeve'):t('Blerjeve')}`,
        data: nrLLojit,
        backgroundColor: 'white',
        borderColor: '#24AD5D',
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    
    plugins: {
      title: {
        display: false,
        text: t('Numri i') + `${lloji == 'Shitjeve' ? t('Shitjeve'):t('Blerjeve')} `+t('per Ditë'),
      }, 
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          pinch: {
            enabled: true,
          },
          wheel: {
            enabled: true,
          },
          mode: 'x',
        },
      },
    },
   
    scales: {
      x: {
        title: { display: true, text: t('Dita Muaji dhe Viti') }
      },
      y: {
        title: { display: true, text: t('Numri i')+`${lloji == 'Shitjeve' ? t('Shitjeve'):t('Blerjeve')} `},
        ticks: {
          stepSize: 1, // Ensure only integers are shown
          beginAtZero: true, // Start the scale at 0
          callback: (value) => Number(value).toFixed(0), // Ensure labels are integers
        }
      },
    },
  };

  return <Line data={chartData} options={chartOptions} />;
};

export default LineChartComponent;
