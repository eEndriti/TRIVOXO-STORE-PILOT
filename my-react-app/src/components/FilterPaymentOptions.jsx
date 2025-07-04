import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";

const FilterPaymentOptions = ({ filter, onSelect }) => {
  const [paymentOptions, setPaymentOptions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await window.api.fetchTableMenyratPageses();
      setPaymentOptions(response);

    } catch (error) {
      console.error("Error fetching payment options:", error);
    }
  };

  const handleSelect = (value) => {
    onSelect(value);
  };

  return (
    <Card className="p-3 border-0">
     <ButtonGroup className="w-100 d-flex justify-content-between">
        <Button
          variant={filter === "" ? "success" : "transparent"}
          className="fw-bold w-100 filter-btn"
          onClick={() => handleSelect("")}
        >
          
            {filter === "" ? "Të gjitha" : <>
                <FontAwesomeIcon icon={faX} className="me-2" />
                Anulo Filtrimin
                </>}
        </Button>

        {paymentOptions.map((opt) => (
            
          <Button
            key={opt.menyraPagesesID}
            variant={filter == opt.emertimi ? "success" : "transparent"}
            className="fw-bold w-100 filter-btn"
            onClick={() => handleSelect(opt.emertimi)}>
                {opt.emertimi}        
          </Button>
        ))}
      </ButtonGroup>

      <style>{`
        .filter-btn {
          transition: transform 0.3s ease, background-color 0.3s ease;
        }
        .filter-btn:hover {
          transform: translateY(-3px);
        }
        .filter-btn:focus {
          box-shadow: 0 0 0 2px rgba(38, 143, 255, 0.5);
        }
        .filter-btn:active {
          transform: translateY(0);
        }
        .filter-btn.dark:hover {
          background-color: #343a40;
        }
        .filter-btn.light:hover {
          background-color: #f1f1f1;
        }
      `}</style>
    </Card>
  );
};

export default FilterPaymentOptions;
