import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, InputGroup, Row, Table } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { ROLE_PERMISSIONS } from "../../data/hrData";

const employeePermissionOptions = [
  "dashboard",
  "attendance",
  "regularize",
  "profile",
  "leave",
  "salary",
  "payroll_admin",
  "chat",
  "notifications",
  "access",
  "company_posts"
];

export default function AccessControl() {
  const { users, currentUser, updateUserAccess, createEmployeeInvite, adminUpdateAttendance } = useAuth();

  const managedUsers = useMemo(
    () => users.filter((user) => user.id !== currentUser.id),
    [users, currentUser.id]
  );

  const departments = useMemo(
    () => Array.from(new Set(users.map((user) => user.department).filter(Boolean))).sort(),
    [users]
  );

  const [drafts, setDrafts] = useState(() => {
    const initial = {};
    managedUsers.forEach((user) => {
      initial[user.id] = { role: user.role, permissions: user.permissions };
    });
    return initial;
  });

  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    department: departments[0] || "IT",
    designation: "",
    permissions: ["dashboard", "attendance", "profile", "leave", "salary", "chat", "notifications"]
  });
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [attendanceForm, setAttendanceForm] = useState({
    userId: managedUsers[0]?.id || "",
    date: new Date().toISOString().slice(0, 10),
    attendanceStatus: "Present",
    workDayType: "Full Day",
    comment: ""
  });
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [attendanceError, setAttendanceError] = useState("");

  const setRole = (userId, role) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        role,
        permissions: role === "admin" ? ROLE_PERMISSIONS.admin : ROLE_PERMISSIONS.employee
      }
    }));
  };

  const togglePermission = (userId, permission) => {
    setDrafts((prev) => {
      const item = prev[userId];
      const hasPermission = item.permissions.includes(permission);
      return {
        ...prev,
        [userId]: {
          ...item,
          permissions: hasPermission
            ? item.permissions.filter((p) => p !== permission)
            : [...item.permissions, permission]
        }
      };
    });
  };

  const toggleInvitePermission = (permission) => {
    setInviteForm((prev) => {
      const hasPermission = prev.permissions.includes(permission);
      return {
        ...prev,
        permissions: hasPermission
          ? prev.permissions.filter((p) => p !== permission)
          : [...prev.permissions, permission]
      };
    });
  };

  const onCreateInvite = (event) => {
    event.preventDefault();
    setInviteError("");
    setInviteLink("");

    const response = createEmployeeInvite(inviteForm);
    if (!response.success) {
      setInviteError(response.message || "Unable to create employee access.");
      return;
    }

    setInviteLink(response.portalLink);
    setInviteForm({
      name: "",
      email: "",
      department: departments[0] || "IT",
      designation: "",
      permissions: ["dashboard", "attendance", "profile", "leave", "salary", "chat", "notifications"]
    });
  };

  const onAttendanceOverrideSubmit = (event) => {
    event.preventDefault();
    setAttendanceMessage("");
    setAttendanceError("");

    const response = adminUpdateAttendance(attendanceForm);
    if (!response.success) {
      setAttendanceError(response.message || "Unable to update attendance.");
      return;
    }

    setAttendanceMessage("Attendance updated successfully.");
  };

  return (
    <>
      {currentUser.role === "admin" ? (
        <Card border="light" className="shadow-sm mb-4">
          <Card.Header>
            <h5 className="mb-0">Admin Setup: Create Employee Portal Access</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={onCreateInvite}>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Label>Employee Name</Form.Label>
                  <Form.Control
                    required
                    value={inviteForm.name}
                    onChange={(e) => {
                      const { value } = e.target;
                      setInviteForm((prev) => ({ ...prev, name: value }));
                    }}
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Employee Email</Form.Label>
                  <Form.Control
                    required
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => {
                      const { value } = e.target;
                      setInviteForm((prev) => ({ ...prev, email: value }));
                    }}
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Department</Form.Label>
                  <Form.Select
                    value={inviteForm.department}
                    onChange={(e) => {
                      const { value } = e.target;
                      setInviteForm((prev) => ({ ...prev, department: value }));
                    }}
                  >
                    {departments.map((department) => (
                      <option key={department} value={department}>{department}</option>
                    ))}
                    {!departments.includes("IT") ? <option value="IT">IT</option> : null}
                  </Form.Select>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Designation</Form.Label>
                  <Form.Control
                    value={inviteForm.designation}
                    onChange={(e) => {
                      const { value } = e.target;
                      setInviteForm((prev) => ({ ...prev, designation: value }));
                    }}
                    placeholder="e.g. Software Engineer"
                  />
                </Col>
                <Col xs={12} className="mb-3">
                  <Form.Label>Portal Access Permissions</Form.Label>
                  <div>
                    {employeePermissionOptions.map((permission) => (
                      <Form.Check
                        inline
                        key={`invite-permission-${permission}`}
                        type="checkbox"
                        label={permission}
                        checked={inviteForm.permissions.includes(permission)}
                        onChange={() => toggleInvitePermission(permission)}
                      />
                    ))}
                  </div>
                </Col>
              </Row>

              <Button type="submit">Create Employee Access + Generate Portal Link</Button>
            </Form>

            {inviteError ? <Alert variant="danger" className="mt-3 mb-0">{inviteError}</Alert> : null}

            {inviteLink ? (
              <div className="mt-3">
                <Form.Label>Portal Link (send to employee)</Form.Label>
                <InputGroup>
                  <Form.Control readOnly value={inviteLink} />
                  <Button
                    variant="outline-primary"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(inviteLink);
                      }
                    }}
                  >
                    Copy
                  </Button>
                </InputGroup>
                <small className="text-gray">Employee can open this link and sign in directly with assigned access.</small>
              </div>
            ) : null}
          </Card.Body>
        </Card>
      ) : null}

      {(currentUser.role === "admin" || currentUser.permissions.includes("access")) ? (
        <Card border="light" className="shadow-sm mb-4">
          <Card.Header>
            <h5 className="mb-0">Attendance Management Override</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={onAttendanceOverrideSubmit}>
              <Row>
                <Col md={6} className="mb-3">
                  <Form.Label>Employee</Form.Label>
                  <Form.Select
                    required
                    value={attendanceForm.userId}
                    onChange={(e) => {
                      const { value } = e.target;
                      setAttendanceForm((prev) => ({ ...prev, userId: value }));
                    }}
                  >
                    <option value="">Select employee</option>
                    {managedUsers.map((user) => (
                      <option key={`attendance-user-${user.id}`} value={user.id}>
                        {user.name} ({user.department})
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    required
                    type="date"
                    value={attendanceForm.date}
                    onChange={(e) => {
                      const { value } = e.target;
                      setAttendanceForm((prev) => ({ ...prev, date: value }));
                    }}
                  />
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Attendance Status</Form.Label>
                  <Form.Select
                    value={attendanceForm.attendanceStatus}
                    onChange={(e) => {
                      const { value } = e.target;
                      setAttendanceForm((prev) => ({ ...prev, attendanceStatus: value }));
                    }}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="WFH">WFH</option>
                  </Form.Select>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Workday Duration</Form.Label>
                  <Form.Select
                    value={attendanceForm.workDayType}
                    disabled={attendanceForm.attendanceStatus === "Absent"}
                    onChange={(e) => {
                      const { value } = e.target;
                      setAttendanceForm((prev) => ({ ...prev, workDayType: value }));
                    }}
                  >
                    <option value="Full Day">Full Day (9h)</option>
                    <option value="Half Day">Half Day (5h)</option>
                    <option value="No Work Session">No Work Session</option>
                  </Form.Select>
                  <small className="text-gray">
                    Use this to convert full day to half day or clear worked hours.
                  </small>
                </Col>
                <Col xs={12} className="mb-3">
                  <Form.Label>Comment</Form.Label>
                  <Form.Control
                    value={attendanceForm.comment}
                    onChange={(e) => {
                      const { value } = e.target;
                      setAttendanceForm((prev) => ({ ...prev, comment: value }));
                    }}
                    placeholder="Optional note for audit/employee"
                  />
                </Col>
              </Row>

              <Button type="submit">Update Attendance</Button>
            </Form>

            {attendanceError ? <Alert variant="danger" className="mt-3 mb-0">{attendanceError}</Alert> : null}
            {attendanceMessage ? <Alert variant="success" className="mt-3 mb-0">{attendanceMessage}</Alert> : null}
          </Card.Body>
        </Card>
      ) : null}

      <Card border="light" className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Admin Access Control</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {managedUsers.map((user) => {
                const draft = drafts[user.id] || { role: user.role, permissions: user.permissions };
                return (
                  <tr key={user.id}>
                    <td>
                      <div>{user.name}</div>
                      <small className="text-gray">{user.email}</small>
                    </td>
                    <td>
                      <Form.Select value={draft.role} onChange={(e) => setRole(user.id, e.target.value)}>
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </Form.Select>
                    </td>
                    <td>
                      {draft.role === "admin" ? (
                        <span>All permissions</span>
                      ) : (
                        <div>
                          {employeePermissionOptions.map((permission) => (
                            <Form.Check
                              inline
                              key={`${user.id}-${permission}`}
                              type="checkbox"
                              label={permission}
                              checked={draft.permissions.includes(permission)}
                              onChange={() => togglePermission(user.id, permission)}
                            />
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        onClick={() => updateUserAccess(user.id, draft.role, draft.permissions)}
                      >
                        Save
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}
