import React, { useState } from "react";
import { Redirect } from "react-router-dom";
import { Alert, Button, Card, Col, Container, Form, InputGroup, Row } from "@themesberg/react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faUnlockAlt } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { Routes } from "../../routes";
import SideWallImage from "../../assets/img/brand/sidewallimage.jpeg";

export default function Login() {
  const { currentUser, login } = useAuth();
  const [email, setEmail] = useState("admin@hrportal.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  if (currentUser) {
    return <Redirect to={Routes.HRDashboard.path} />;
  }

  const onSubmit = (event) => {
    event.preventDefault();
    const result = login(email, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <main className="hr-login-layout">
      <section
        className="hr-login-image-panel"
        aria-label="Office wall image"
        style={{ backgroundImage: `url(${SideWallImage})` }}
      />
      <section className="hr-login-form-panel">
        <Container fluid className="h-100 d-flex align-items-center justify-content-center px-3 px-md-4">
          <Row className="justify-content-center w-100">
            <Col xs={12} xl={9}>
              <Card className="shadow border-light p-4 p-md-5">
                <Card.Body>
                  <h3 className="mb-3">Ingenious Portal Login</h3>
                  <p className="text-gray mb-4">Sign in with your role-based account.</p>

                  {error ? <Alert variant="danger">{error}</Alert> : null}

                  <Form onSubmit={onSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FontAwesomeIcon icon={faEnvelope} />
                        </InputGroup.Text>
                        <Form.Control
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@hrportal.com"
                        />
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>
                          <FontAwesomeIcon icon={faUnlockAlt} />
                        </InputGroup.Text>
                        <Form.Control
                          required
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                        />
                      </InputGroup>
                    </Form.Group>

                    <Button type="submit" variant="primary" className="w-100">
                      Login
                    </Button>
                  </Form>

                  <hr />
                  <p className="mb-1"><strong>Demo credentials:</strong></p>
                  <p className="mb-1">Admin: <code>admin@hrportal.com</code> / <code>admin123</code></p>
                  <p className="mb-0">Employee: <code>employee@hrportal.com</code> / <code>emp123</code></p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </main>
  );
}
