import React from "react";
import { Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

const StatusToggle = ({ label, status, onToggle }) => {
  return (
    <Form.Group className="d-flex flex-column ">
      <Form.Label>{label}</Form.Label>
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          backgroundColor: status ? "#24AD5D" : "#d9534f",
          color: "#fff",
          padding: "8px 20px",
          borderRadius: "25px",
          fontWeight: "500",
          fontSize: "0.9rem",
          transition: "background-color 0.3s",
          gap: "10px",
        }}
      >
        <FontAwesomeIcon icon={status ? faCheckCircle : faTimesCircle} />
        <span>{status ? "Aktiv" : "Jo Aktiv"}</span>
      </div>
    </Form.Group>
  );
};

export default StatusToggle;
