import React from "react";
import moment from "moment-timezone";
import { Col, Row } from "@themesberg/react-bootstrap";

export default function Footer() {
  const currentYear = moment().get("year");

  return (
    <footer className="footer section py-4 mt-4">
      <Row>
        <Col xs={12}>
          <p className="mb-0 text-center text-gray">
            Ingenious Portal Dashboard | Copyright {currentYear}
          </p>
        </Col>
      </Row>
    </footer>
  );
}
