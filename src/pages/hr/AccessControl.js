import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, InputGroup, Row, Table } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";

export default function AccessControl() {
  const { users, currentUser, updateUserAccess, createEmployeeInvite, adminUpdateAttendance, meta } = useAuth();
  const rolePermissions = meta?.rolePermissions || { admin: [], employee: [] };
  const permissionOptions = meta?.permissionOptions || [];
  const departmentOptions = meta?.departments || [];
  const designationOptions = meta?.designations || [];
  const attendanceStatusOptions = meta?.attendanceStatuses || [];
  const workDayTypeOptions = meta?.workDayTypes || [];
  const roleOptions = meta?.roleOptions || ["employee", "admin"];

  const managedUsers = useMemo(
    () => users.filter((user) => user.id !== currentUser.id),
    [users, currentUser.id]
  );
  const managerOptions = useMemo(
    () =>
      users.filter(
        (user) =>
          user.id !== currentUser.id &&
          (user.role === "admin" || /manager|lead|senior/i.test(user.designation || ""))
      ),
    [users, currentUser.id]
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
    department: departmentOptions[0] || "",
    designation: "",
    managerId: managerOptions[0]?.id || "",
    permissions: rolePermissions.employee || []
  });
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteInfo, setInviteInfo] = useState("");
  const [inviteTempPassword, setInviteTempPassword] = useState("");
  const [attendanceForm, setAttendanceForm] = useState({
    userId: managedUsers[0]?.id || "",
    date: new Date().toISOString().slice(0, 10),
    attendanceStatus: attendanceStatusOptions[0] || "",
    workDayType: workDayTypeOptions[0] || "",
    comment: ""
  });
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [attendanceError, setAttendanceError] = useState("");

  useEffect(() => {
    const nextDrafts = {};
    managedUsers.forEach((user) => {
      nextDrafts[user.id] = { role: user.role, permissions: user.permissions };
    });
    setDrafts(nextDrafts);

    setInviteForm((prev) => ({
      ...prev,
      department: prev.department || departmentOptions[0] || "",
      managerId: prev.managerId || managerOptions[0]?.id || "",
      permissions: prev.permissions.length > 0 ? prev.permissions : rolePermissions.employee || []
    }));

    setAttendanceForm((prev) => ({
      ...prev,
      userId: managedUsers[0]?.id || prev.userId || "",
      attendanceStatus: prev.attendanceStatus || attendanceStatusOptions[0] || "",
      workDayType: prev.workDayType || workDayTypeOptions[0] || ""
    }));
  }, [managedUsers, departmentOptions, managerOptions, rolePermissions.employee, attendanceStatusOptions, workDayTypeOptions]);

  const setRole = (userId, role) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        role,
        permissions: role === "admin" ? rolePermissions.admin || [] : rolePermissions.employee || []
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

  const onCreateInvite = async (event) => {
    event.preventDefault();
    setInviteError("");
    setInviteLink("");
    setInviteInfo("");
    setInviteTempPassword("");

    const response = await createEmployeeInvite(inviteForm);
    if (!response.success) {
      setInviteError(response.message || "Unable to create employee access.");
      return;
    }

    setInviteLink(response.portalLink);
    setInviteInfo(
      response.emailDelivered
        ? "Invite email sent to the employee with the temporary password."
        : (response.emailMessage || "Employee account created, but invite email was not sent.")
    );
    setInviteTempPassword(response.tempPassword || "");
    setInviteForm({
      name: "",
      email: "",
      department: departmentOptions[0] || "",
      designation: "",
      managerId: managerOptions[0]?.id || "",
      permissions: rolePermissions.employee || []
    });
  };

  const onAttendanceOverrideSubmit = async (event) => {
    event.preventDefault();
    setAttendanceMessage("");
    setAttendanceError("");

    const response = await adminUpdateAttendance(attendanceForm);
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
                  {departmentOptions.length > 0 ? (
                    <Form.Select
                      value={inviteForm.department}
                      onChange={(e) => {
                        const { value } = e.target;
                        setInviteForm((prev) => ({ ...prev, department: value }));
                      }}
                    >
                      <option value="">Select department</option>
                      {departmentOptions.map((department) => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      value={inviteForm.department}
                      onChange={(e) => {
                        const { value } = e.target;
                        setInviteForm((prev) => ({ ...prev, department: value }));
                      }}
                      placeholder="Enter department"
                    />
                  )}
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Designation</Form.Label>
                  {designationOptions.length > 0 ? (
                    <Form.Select
                      value={inviteForm.designation}
                      onChange={(e) => {
                        const { value } = e.target;
                        setInviteForm((prev) => ({ ...prev, designation: value }));
                      }}
                    >
                      <option value="">Select designation</option>
                      {designationOptions.map((designation) => (
                        <option key={designation} value={designation}>{designation}</option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      value={inviteForm.designation}
                      onChange={(e) => {
                        const { value } = e.target;
                        setInviteForm((prev) => ({ ...prev, designation: value }));
                      }}
                      placeholder="e.g. Software Engineer"
                    />
                  )}
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Label>Reporting Manager</Form.Label>
                  <Form.Select
                    value={inviteForm.managerId}
                    onChange={(e) => {
                      const { value } = e.target;
                      setInviteForm((prev) => ({ ...prev, managerId: value }));
                    }}
                  >
                    <option value="">Select manager</option>
                    {managerOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.designation || user.role}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={12} className="mb-3">
                  <Form.Label>Portal Access Permissions</Form.Label>
                  <div>
                    {permissionOptions.map((permission) => (
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
            {inviteInfo ? <Alert variant={inviteTempPassword ? "warning" : "success"} className="mt-3 mb-0">{inviteInfo}</Alert> : null}

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
                {inviteTempPassword ? (
                  <div className="mt-2">
                    <Form.Label>Temporary Password</Form.Label>
                    <Form.Control readOnly value={inviteTempPassword} />
                    <small className="text-danger">
                      Email delivery is not configured, so share this password securely with the employee. They will be forced to change it on first login.
                    </small>
                  </div>
                ) : null}
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
                    {attendanceStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
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
                    {workDayTypeOptions.map((workDayType) => (
                      <option key={workDayType} value={workDayType}>
                        {workDayType === "Full Day"
                          ? "Full Day (9h)"
                          : workDayType === "Half Day"
                            ? "Half Day (5h)"
                            : workDayType}
                      </option>
                    ))}
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
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      {draft.role === "admin" ? (
                        <span>All permissions</span>
                      ) : (
                        <div>
                          {permissionOptions.map((permission) => (
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
                          onClick={async () => {
                            const response = await updateUserAccess(user.id, draft.role, draft.permissions);
                            if (!response.success) {
                              setAttendanceError(response.message || "Unable to update access.");
                            }
                          }}
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
