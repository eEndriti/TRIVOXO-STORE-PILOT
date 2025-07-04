import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTie, faUser, faUsers } from "@fortawesome/free-solid-svg-icons";

const FilterPerdorues = ({filter, onSelect}) => {
 
   const handleSelect = (e) => {
        onSelect(e)
   }

  return (
    <Card className="p-3  border-0" >
      
      <ButtonGroup className="w-100 d-flex justify-content-between">
        <Button
          variant={filter === "all" ? "success" : "transparent"}
          className="fw-bold w-100 filter-btn"
          onClick={() => handleSelect('all')}
        >
          <FontAwesomeIcon icon={faUsers} className="me-2" />
          Të gjithë
        </Button>
        
        <Button
          variant={filter === "admin" ? "success" : "transparent"}
          className="fw-bold w-100 filter-btn"
          onClick={() => handleSelect('admin')}
        >
          <FontAwesomeIcon icon={faUserTie} className="me-2" />
          Admin
        </Button>
        
        <Button
          variant={filter === "perdorues" ? "success" : "transparent"}
          className="fw-bold w-100 filter-btn"
          onClick={() => handleSelect('perdorues')}
        >
          <FontAwesomeIcon icon={faUser} className="me-2" />
          Përdorues
        </Button>
      </ButtonGroup>

      <style >{`
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

export default FilterPerdorues;
