import React from "react";
import { Card, Row, Col,Tooltip, OverlayTrigger } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowCircleUp, faArrowDown, faQuestion } from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";

export default function StatisticCard ({ title, value, diff,periudhaKohore }){

  const isPositive = diff > 0;
  const diffColor = isPositive ? "text-success" : "text-danger";
  const diffIcon = isPositive ? faArrowCircleUp : faArrowDown;
  const bgColor = "bg-light text-dark border-secondary"; 
  const {t} = useTranslation('others')
  return (
    <Row >
        <Col >
            <Card className={`p-3 shadow border-0 ${bgColor}`} style={{ borderRadius: "10px" }}>
            <Card.Body>
                <Card.Title className="text-secondary fw-bold">
                    {title}
                </Card.Title>

                <Row className="align-items-center">
                <Col>
                    <h4 className="fs-4 fw-bold text-dark">{value}</h4>
                </Col>
                </Row>
                <Row>
                        
                        <OverlayTrigger placement="right" 
                    overlay={
                        <Tooltip id="tooltip-right">
                            {t('Periudha e kaluar nenkupton ')}{periudhaKohore} {t(' ditet para dates se caktuar aktualisht!')}
                        </Tooltip>
                    }
                >
                    <Col className="d-flex" name={'test2'}>
                        {!diff &&  (value == '0.00 €' || value == 0) ? 
                            <>
                                <span className={`fw-bold text-neutral`}>{diff ? diff : 0}%</span>
                                <span className="text-muted small ms-2" >
                                    {t('Nuk ka Transaksione!')}
                                </span> 
                            </>
                        :
                            <>
                                <span className={`fw-bold ${diffColor}`}>{diff ? diff : 0}%</span>
                                <FontAwesomeIcon icon={diffIcon} className={`ms-2 ${diffColor}`} />
                                <span className="text-muted small ms-2" >
                                    {isPositive ? t("Rritje") : t("Ulje")} {t('krahasur me periudhen e kaluar!')}
                                </span>
                            </>
                        }
                    </Col>
                </OverlayTrigger>
                    
                </Row>

            </Card.Body>
            </Card>
        </Col>
    </Row>
  );
};


