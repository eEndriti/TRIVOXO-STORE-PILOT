import React from 'react'
import { Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faEdit,faPlus,faEuro,faCheckCircle,faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../AuthContext';

export default function SubjectTotalsData({ totals }) {

    const cards = [
        {
          label: 'Totali Për Pagesë',
          value: totals?.totaliPerPagese,
          icon: (
              <FontAwesomeIcon
                icon={faEuro}
                size="2x"
                className="text-primary mb-2"
              />
            ),
          border: 'primary'
        },
        {
          label: 'Totali i Paguar',
          value: totals?.totaliIPageses,
          icon: (
              <FontAwesomeIcon
                icon={faCheckCircle}
                size="2x"
                className="text-success mb-2"
              />
            ),
          border: 'success'
        },
        {
          label: 'Mbetja për Pagesë',
          value: totals?.mbetjaPerPagese,
          icon: (
              <FontAwesomeIcon
                icon={faExclamationCircle}
                size="2x"
                className="text-danger mb-2"
              />
            ),
          border: 'danger'
        }
      ]

      
  return (
    <Row className="g-4 justify-content-center my-5">
      {cards.map(({ label, value, icon, border }) => (
        <Col key={label} xs={12} md={4}>
          <Card className={`h-100 border-${border}`}>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-center">
              {icon}
              <Card.Title className="fs-5 mb-1">{label}</Card.Title>
              <Card.Text className="fs-3 fw-bold">
                {formatCurrency(value)}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
