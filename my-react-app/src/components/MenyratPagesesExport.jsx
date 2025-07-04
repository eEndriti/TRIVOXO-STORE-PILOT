import { useState, useEffect } from 'react';
import AnimatedSpinner from './AnimatedSpinner';
import { Button } from 'react-bootstrap';

export default function MenyratPagesesExport({ updateMenyraPageses }) {
  const [menyratPageses, setMenyratPageses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menyraPagesesID,setMenyraPagesesID] = useState()

  useEffect(() => {
    const fetchData = async () => {
      await window.api.fetchTableMenyratPageses().then(receivedData => {
        setMenyratPageses(receivedData);
        setLoading(false);
      });
    }
    fetchData()
  }, []);

  return (
    <>
      {loading ? (
        <AnimatedSpinner />
      ) : (
        <div className="d-flex flex-row justify-content-end">
          {menyratPageses.map((menyra) => (
            <Button
              key={menyra.menyraPagesesID}
              onClick={() => {setMenyraPagesesID(menyra.menyraPagesesID);updateMenyraPageses(menyra)}}  
              className={`mx-2 ${menyraPagesesID === menyra.menyraPagesesID ? 'bg-primary' : 'bg-transparent text-primary'}`}
            >
              {menyra.emertimi}
            </Button>
          ))}
        </div>
      )}
    </>
  );
}
