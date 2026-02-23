import React, { useEffect, useState } from "react";
import { Redirect, useParams } from "react-router-dom";
import { Alert, Card, Col, Container, Row } from "@themesberg/react-bootstrap";
import { Routes } from "../../routes";
import { useAuth } from "../../context/AuthContext";

export default function InviteSignin() {
  const { token } = useParams();
  const { loginWithInvite, currentUser } = useAuth();
  const [error, setError] = useState("");
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (!token || currentUser) {
      setProcessed(true);
      return;
    }

    const result = loginWithInvite(token);
    if (!result.success) {
      setError(result.message || "Unable to process invite link.");
    }
    setProcessed(true);
  }, [token, loginWithInvite, currentUser]);

  if (currentUser) {
    return <Redirect to={Routes.HRDashboard.path} />;
  }

  return (
    <main>
      <section className="d-flex align-items-center my-5 mt-lg-6 mb-lg-5">
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} md={8} lg={6}>
              <Card className="shadow border-light p-4">
                <Card.Body>
                  <h3 className="mb-3">Portal Invite Sign-In</h3>
                  {!processed ? <p>Validating invite link...</p> : null}
                  {error ? <Alert variant="danger" className="mb-0">{error}</Alert> : null}
                  {processed && !error ? <p className="mb-0">Signing you in...</p> : null}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </main>
  );
}
