import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Col, Form, Row, Table } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";

const drawerStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    zIndex: 1040
  },
  panel: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "min(560px, 100vw)",
    height: "100vh",
    background: "#fff",
    zIndex: 1050,
    overflowY: "auto",
    boxShadow: "-6px 0 24px rgba(0,0,0,0.15)",
    padding: "1rem 1.25rem 2rem"
  }
};

const LEAVE_TYPES = ["Paid Leave", "PH Leave", "Casual Leave", "Sick Leave", "Unpaid Leave"];
const DAY_TYPES = ["Full Day", "Half Day"];

const getStatusVariant = (status = "") => {
  if (status === "Approved") return "success";
  if (status === "Denied") return "danger";
  if (status.startsWith("Pending")) return "warning";
  return "secondary";
};

const approvalFlowText = (flow = [], users = []) => {
  if (!Array.isArray(flow) || flow.length === 0) return "No approval chain";
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
  return flow
    .map((step) => `${userMap[step.approverId]?.name || "Approver"} (${step.approverRole}) - ${step.status}`)
    .join(" -> ");
};

export default function Leave() {
  const {
    currentUser,
    users,
    leaves,
    applyLeave,
    takeLeaveAction,
    getPaidLeaveSummary
  } = useAuth();

  const [showApplyDrawer, setShowApplyDrawer] = useState(false);
  const [type, setType] = useState("Paid Leave");
  const [dayType, setDayType] = useState("Full Day");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedApproverIds, setSelectedApproverIds] = useState([]);
  const [formError, setFormError] = useState("");

  const [approvalComments, setApprovalComments] = useState({});

  const paidSummary = getPaidLeaveSummary(currentUser.id);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.id] = user;
    });
    return map;
  }, [users]);

  const myLeaves = useMemo(
    () => leaves.filter((leave) => leave.userId === currentUser.id),
    [leaves, currentUser.id]
  );

  const availableApprovers = useMemo(() => {
    const manager = currentUser.managerId
      ? users.find((user) => user.id === currentUser.managerId)
      : null;
    const hrAndSenior = users.filter(
      (user) =>
        user.id !== currentUser.id &&
        (user.role === "admin" ||
          (/senior/i.test(user.designation || "") && user.department === currentUser.department))
    );
    const unique = [];
    const seen = new Set();
    [manager, ...hrAndSenior].filter(Boolean).forEach((approver) => {
      if (seen.has(approver.id)) return;
      seen.add(approver.id);
      unique.push(approver);
    });
    return unique;
  }, [users, currentUser]);

  useEffect(() => {
    setSelectedApproverIds(availableApprovers.map((approver) => approver.id));
  }, [availableApprovers]);

  const pendingForMe = useMemo(
    () => leaves.filter((leave) => leave.currentApproverId === currentUser.id && leave.status.startsWith("Pending")),
    [leaves, currentUser.id]
  );

  const onSubmitLeave = (event) => {
    event.preventDefault();
    if (selectedApproverIds.length === 0) {
      setFormError("Please select at least one approver email.");
      return;
    }

    applyLeave({ type, dayType, fromDate, toDate, reason, selectedApproverIds });
    setShowApplyDrawer(false);
    setFormError("");
    setType("Paid Leave");
    setDayType("Full Day");
    setFromDate("");
    setToDate("");
    setReason("");
    setSelectedApproverIds(availableApprovers.map((approver) => approver.id));
  };

  const onApproval = (leaveId, action) => {
    const comment = approvalComments[leaveId] || "";
    takeLeaveAction(leaveId, action, comment);
    setApprovalComments((prev) => ({ ...prev, [leaveId]: "" }));
  };

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
        <div>
          <h4>Leave Management</h4>
          <p className="mb-0">Apply leave through drawer and track approval status.</p>
        </div>
        <Button onClick={() => setShowApplyDrawer(true)}>Apply Leave</Button>
      </div>

      <Row>
        <Col xs={12} sm={4} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Body>
              <h6>Paid Leave Accrued</h6>
              <h3>{paidSummary.accrued}</h3>
              <small className="text-gray">1.5 leave/month (carry-forward enabled)</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={4} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Body>
              <h6>Paid Leave Used</h6>
              <h3>{paidSummary.used}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={4} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Body>
              <h6>Paid Leave Balance</h6>
              <h3>{paidSummary.remaining}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {pendingForMe.length > 0 ? (
        <Card border="light" className="shadow-sm mb-4">
          <Card.Header>
            <h5 className="mb-0">Approval Inbox (Manager / HR / Senior)</h5>
          </Card.Header>
          <Card.Body>
            <Table responsive>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Comment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingForMe.map((leave) => (
                  <tr key={leave.id}>
                    <td>{userMap[leave.userId]?.name || "Employee"}</td>
                    <td>{leave.type}</td>
                    <td>{leave.fromDate} to {leave.toDate}</td>
                    <td>{leave.leaveDays}</td>
                    <td>{leave.reason}</td>
                    <td>
                      <Form.Control
                        placeholder="Add review comment"
                        value={approvalComments[leave.id] || ""}
                        onChange={(e) =>
                          setApprovalComments((prev) => ({ ...prev, [leave.id]: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button size="sm" variant="success" onClick={() => onApproval(leave.id, "Approved")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => onApproval(leave.id, "Denied")}>
                          Deny
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      ) : null}

      <Card border="light" className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">My Leave Requests</h5>
        </Card.Header>
        <Card.Body>
          {myLeaves.length === 0 ? (
            <p className="mb-0">No leave requests submitted yet.</p>
          ) : (
            <Table responsive>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Day Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Approval Chain</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {myLeaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>{leave.type}</td>
                    <td>{leave.dayType || "Full Day"}</td>
                    <td>{leave.fromDate}</td>
                    <td>{leave.toDate}</td>
                    <td>{leave.leaveDays || "-"}</td>
                    <td>
                      <Badge bg={getStatusVariant(leave.status)}>{leave.status}</Badge>
                    </td>
                    <td style={{ minWidth: 260 }}>{approvalFlowText(leave.approvalFlow, users)}</td>
                    <td>{leave.adminComment || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {showApplyDrawer ? (
        <>
          <div style={drawerStyles.overlay} onClick={() => setShowApplyDrawer(false)} />
          <aside style={drawerStyles.panel}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Apply Leave</h4>
              <Button variant="outline-secondary" size="sm" onClick={() => setShowApplyDrawer(false)}>
                Close
              </Button>
            </div>

            <Card border="light" className="shadow-sm">
              <Card.Body>
                <Form onSubmit={onSubmitLeave}>
                  <Form.Group className="mb-3">
                    <Form.Label>Leave Type</Form.Label>
                    <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
                      {LEAVE_TYPES.map((leaveType) => (
                        <option key={leaveType} value={leaveType}>{leaveType}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Day Type</Form.Label>
                    <Form.Select value={dayType} onChange={(e) => setDayType(e.target.value)}>
                      {DAY_TYPES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label>From Date</Form.Label>
                      <Form.Control required type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label>To Date</Form.Label>
                      <Form.Control required type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Send Approval Request To (Email)</Form.Label>
                    <Form.Select
                      multiple
                      size={Math.min(Math.max(availableApprovers.length, 3), 8)}
                      value={selectedApproverIds}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, (option) => option.value);
                        setSelectedApproverIds(values);
                        setFormError("");
                      }}
                    >
                      {availableApprovers.map((approver) => (
                        <option key={approver.id} value={approver.id}>
                          {approver.email}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Hold Ctrl/Cmd to select multiple approvers.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Reason</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </Form.Group>
                  {formError ? <p className="text-danger small mb-3">{formError}</p> : null}

                  <p className="small text-gray mb-4">
                    Request will be sent to your department manager and then HR/Senior approvers.
                  </p>

                  <div className="d-flex gap-2 justify-content-end">
                    <Button variant="outline-secondary" onClick={() => setShowApplyDrawer(false)}>Cancel</Button>
                    <Button type="submit">Submit Leave</Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </aside>
        </>
      ) : null}
    </>
  );
}
