import { ProgressBar, Badge } from "react-bootstrap";

const klasifikoPerformancen = (percentage) => {
  if (percentage > 80) return { label: "Shume Mire", color: "success" };
  if (percentage >= 60) return { label: "Mire", color: "primary" };
  if (percentage >= 40) return { label: "Mesatare", color: "info" };
  if (percentage >= 20) return { label: "Keq", color: "warning" };
  return { label: "Shume Keq", color: "danger" };
};

export default function PerfomancaKlientit({ totaliPerPagese, totaliPageses,lloji }){
  console.log(totaliPerPagese, totaliPageses)
  const percentage = totaliPerPagese
    ? ((totaliPageses / totaliPerPagese) * 100).toFixed(2)
    : 0;
  const { label, color } = klasifikoPerformancen(percentage);

  return (
    <div className="p-3 border rounded">
      <h6>{lloji == 'klient' ? 'Performanca e Klientit' : 'Sjellja me Furnitorin'}</h6>
      <ProgressBar now={percentage} label={`${percentage}%`} variant={color} style={{ height: "20px" }} />
      {totaliPerPagese == 0 && totaliPageses == 0 ? '' : <Badge bg={color} className="mt-2">{label}</Badge>}
    </div>
  );
};

