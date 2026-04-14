import React, { useState } from "react";
import { Redirect } from "react-router-dom";
import { Alert, Button, Card, Col, Container, Form, Row } from "@themesberg/react-bootstrap";
import { Routes } from "../../routes";
import { useAuth } from "../../context/AuthContext";

export default function ChangePassword() {
  const { currentUser, requiresPasswordChange, changePassword, isReady } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isReady) {
    return null;
  }

  if (!currentUser) {
    return <Redirect to={Routes.Login.path} />;
  }

  if (!requiresPasswordChange) {
    return <Redirect to={Routes.HRDashboard.path} />;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    if (!result.success) {
      setError(result.message || "Unable to update password.");
      return;
    }

    setSuccess("Password updated successfully. Redirecting to dashboard...");
  };

  return (
    <main>
      <section className="d-flex align-items-center my-5 mt-lg-6 mb-lg-5">
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} md={8} lg={6}>
              <Card className="shadow border-light p-4">
                <Card.Body>
                  <h3 className="mb-3">Set Your New Password</h3>
                  <p className="text-gray mb-4">
                    Your account was created with a temporary password. Change it now to continue.
                  </p>

                  {error ? <Alert variant="danger">{error}</Alert> : null}
                  {success ? <Alert variant="success">{success}</Alert> : null}

                  <Form onSubmit={onSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Temporary Password</Form.Label>
                      <Form.Control
                        required
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        required
                        type="password"
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        required
                        type="password"
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </Form.Group>

                    <Button type="submit" variant="primary" className="w-100">
                      Update Password
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </main>
  );
}
