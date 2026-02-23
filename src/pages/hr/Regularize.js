import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Table } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";

export default function Regularize() {
  const {
    currentUser,
    users,
    regularizationRequests,
    regularizeAttendance
  } = useAuth();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [adminComment, setAdminComment] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.id] = user;
    });
    return map;
  }, [users]);

  const employeeList = useMemo(() => users.filter((user) => user.role !== "admin"), [users]);

  const pendingRequests = useMemo(
    () => regularizationRequests.filter((request) => request.status === "Pending"),
    [regularizationRequests]
  );

  const canRegularize = currentUser.role === "admin" || /hr/i.test(currentUser.designation || "");

  const approveRequest = (request) => {
    const result = regularizeAttendance({
      userId: request.userId,
      date: request.date,
      requestId: request.id,
      comment: adminComment || "Regularized as full day"
    });
    setAdminMessage(result.success ? "Attendance regularized as full day." : result.message);
    if (result.success) setAdminComment("");
  };

  const manualRegularize = (event) => {
    event.preventDefault();
    const result = regularizeAttendance({
      userId: selectedEmployeeId,
      date: selectedDate,
      comment: adminComment || "Manual regularization by HR"
    });
    setAdminMessage(result.success ? "Manual regularization completed." : result.message);
    if (result.success) {
      setSelectedEmployeeId("");
      setSelectedDate("");
      setAdminComment("");
    }
  };

  return (
    <>
      {canRegularize ? (
        <Row>
          <Col xs={12} className="mb-4">
            <Card border="light" className="shadow-sm mb-4">
              <Card.Header>
                <h5 className="mb-0">HR/Admin: Pending Requests</h5>
              </Card.Header>
              <Card.Body>
                {pendingRequests.length === 0 ? (
                  <p className="mb-0">No pending regularization requests.</p>
                ) : (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Reason</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map((request) => (
                        <tr key={request.id}>
                          <td>{userMap[request.userId]?.name || "Employee"}</td>
                          <td>{request.date}</td>
                          <td>{request.reason}</td>
                          <td>
                            <Button size="sm" onClick={() => approveRequest(request)}>Regularize Full Day</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>

            <Card border="light" className="shadow-sm">
              <Card.Header>
                <h5 className="mb-0">HR/Admin: Manual Regularization</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={manualRegularize}>
                  <Row>
                    <Col md={4} className="mb-3">
                      <Form.Label>Employee</Form.Label>
                      <Form.Select required value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                        <option value="">Select employee</option>
                        {employeeList.map((employee) => (
                          <option key={employee.id} value={employee.id}>{employee.name} ({employee.department})</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Label>Date</Form.Label>
                      <Form.Control required type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Label>Comment</Form.Label>
                      <Form.Control value={adminComment} onChange={(e) => setAdminComment(e.target.value)} />
                    </Col>
                  </Row>
                  <Button type="submit">Regularize as Full Day</Button>
                </Form>
                {adminMessage ? <Alert className="mt-3 mb-0" variant="info">{adminMessage}</Alert> : null}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Alert variant="warning" className="mb-0">
          Only HR/Admin can regularize attendance as full day.
        </Alert>
      )}
    </>
  );
}
