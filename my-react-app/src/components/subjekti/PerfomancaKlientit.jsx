import { ProgressBar, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
const klasifikoPerformancen = (percentage,t) => {
  if (percentage > 80) return { label: t("Shume Mire"), color: "success" };
  if (percentage >= 60) return { label: t("Mire"), color: "primary" };
  if (percentage >= 40) return { label: t("Mesatare"), color: "info" };
  if (percentage >= 20) return { label: t("Keq"), color: "warning" };
  return { label: t("Shume Keq"), color: "danger" };

};

export default function PerfomancaKlientit({ totaliPerPagese, totaliPageses,lloji }){
  const {t} = useTranslation('subjekti')
  console.log(totaliPerPagese, totaliPageses)
  const percentage = totaliPerPagese
    ? ((totaliPageses / totaliPerPagese) * 100).toFixed(2)
    : 0;
  const { label, color } = klasifikoPerformancen(percentage,t);

  return (
    <div className="p-3 border rounded">
      <h6>{lloji == 'klient' ? t('Performanca e Klientit') : t('Sjellja me Furnitorin')}</h6>
      <ProgressBar now={percentage} label={`${percentage}%`} variant={color} style={{ height: "20px" }} />
      {totaliPerPagese == 0 && totaliPageses == 0 ? '' : <Badge bg={color} className="mt-2">{label}</Badge>}
    </div>
  );
};

