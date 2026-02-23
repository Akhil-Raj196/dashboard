import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Col, Form, Row, Table } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDuration = (minutes = 0) => {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${hours}h ${mins}m`;
};

const getDaysUntilBirthday = (dob, now) => {
  if (!dob) return Number.MAX_SAFE_INTEGER;
  const [, month, day] = dob.split("-").map(Number);
  if (!month || !day) return Number.MAX_SAFE_INTEGER;
  const thisYearBirthday = new Date(now.getFullYear(), month - 1, day);
  const nextBirthday = thisYearBirthday < now
    ? new Date(now.getFullYear() + 1, month - 1, day)
    : thisYearBirthday;

  const millis = nextBirthday.setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0);
  return Math.round(millis / (1000 * 60 * 60 * 24));
};

export default function Dashboard() {
  const {
    currentUser,
    users,
    attendance,
    leaves,
    organizationPosts,
    attendanceSessions,
    attendanceClockIn,
    attendanceClockOut,
    togglePostLike,
    addPostComment
  } = useAuth();
  const [commentDrafts, setCommentDrafts] = useState({});
  const [attendanceActionMessage, setAttendanceActionMessage] = useState("");
  const [now, setNow] = useState(Date.now());

  const today = new Date();
  const todayString = toDateString(today);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.id] = user;
    });
    return map;
  }, [users]);

  const attendanceScopeUserIds = useMemo(() => {
    if (currentUser.role === "admin") {
      return users.map((user) => user.id);
    }
    return users.filter((user) => user.department === "IT").map((user) => user.id);
  }, [currentUser.role, users]);

  const todayAttendance = attendance.filter(
    (record) => record.date === todayString && attendanceScopeUserIds.includes(record.userId)
  );

  const presentCount = todayAttendance.filter((record) => record.status === "Present").length;
  const absentCount = todayAttendance.filter((record) => record.status === "Absent").length;
  const wfhCount = todayAttendance.filter((record) => record.status === "WFH").length;

  const onLeaveToday = leaves.filter((leave) => {
    if (leave.status !== "Approved") return false;
    return leave.fromDate <= todayString && leave.toDate >= todayString;
  });

  const selfPendingLeaves = leaves.filter(
    (leave) => leave.userId === currentUser.id && leave.status === "Pending"
  ).length;

  const birthdayWithDays = users
    .map((user) => ({
      ...user,
      days: getDaysUntilBirthday(user.dob, today)
    }))
    .sort((a, b) => a.days - b.days);

  const todayBirthdays = birthdayWithDays.filter((user) => user.days === 0);
  const upcomingBirthdays = birthdayWithDays.filter((user) => user.days > 0 && user.days <= 30);

  const attendanceHeading = currentUser.role === "admin"
    ? "Organization Attendance Today"
    : "IT Department Attendance Today";

  const myTodaySessions = useMemo(
    () =>
      attendanceSessions
        .filter((session) => session.userId === currentUser.id && session.date === todayString)
        .sort((a, b) => new Date(a.clockIn) - new Date(b.clockIn)),
    [attendanceSessions, currentUser.id, todayString]
  );

  const activeSession = myTodaySessions.find((session) => !session.clockOut) || null;
  const hasOpenSession = Boolean(activeSession);
  const timerClockIn = hasOpenSession ? activeSession.clockIn : null;
  const timerClockOut = null;
  const totalWorkedMinutesToday = hasOpenSession
    ? Math.max(Math.floor((now - new Date(activeSession.clockIn).getTime()) / 60000), 0)
    : 0;

  const onAttendanceAction = () => {
    const result = hasOpenSession ? attendanceClockOut() : attendanceClockIn();
    setNow(Date.now());
    setAttendanceActionMessage(result.success
      ? (hasOpenSession ? "Work session ended and time recorded." : "Work session started.")
      : (result.message || "Unable to update attendance.")
    );
  };

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
        <div>
          <h4>Dashboard</h4>
          <p className="mb-0">
            Welcome, {currentUser.name}. {currentUser.role === "admin" ? "Admin view" : "Employee view"}.
          </p>
        </div>
      </div>

      <Row>
        <Col xs={12} sm={6} xl={3} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Body>
              <h6>Employees Present Today</h6>
              <h3>{presentCount}</h3>
              <small className="text-gray">Scope: {currentUser.role === "admin" ? "Organization" : "IT Department"}</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} xl={3} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Body>
              <h6>On Leave Today</h6>
              <h3>{onLeaveToday.length}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} xl={3} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Body>
              <h6>My Pending Leaves</h6>
              <h3>{selfPendingLeaves}</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} xl={3} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Body>
              <h6>Upcoming Birthdays (30 days)</h6>
              <h3>{upcomingBirthdays.length}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Today Attendance Timer</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col xs={12} md={4} className="mb-3 mb-md-0">
                  <div className="small text-gray mb-1">Work Started (Login)</div>
                  <div className="fw-bold">
                    {timerClockIn ? new Date(timerClockIn).toLocaleTimeString() : "Not started"}
                  </div>
                </Col>
                <Col xs={12} md={4} className="mb-3 mb-md-0">
                  <div className="small text-gray mb-1">Work Ended (Logout)</div>
                  <div className="fw-bold">
                    {timerClockOut ? new Date(timerClockOut).toLocaleTimeString() : (hasOpenSession ? "Working..." : "Not ended")}
                  </div>
                </Col>
                <Col xs={12} md={4}>
                  <div className="small text-gray mb-1">Worked Duration</div>
                  <div className="fw-bold">{formatDuration(totalWorkedMinutesToday)}</div>
                </Col>
              </Row>
              <div className="mt-3 d-flex align-items-center gap-3">
                <Button
                  size="sm"
                  variant={hasOpenSession ? "danger" : "success"}
                  onClick={onAttendanceAction}
                >
                  {hasOpenSession ? "Logout Work" : "Login Work"}
                </Button>
                {attendanceActionMessage ? <small className="text-gray">{attendanceActionMessage}</small> : null}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12} xl={8} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">{attendanceHeading}</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex gap-3 mb-3">
                <Badge bg="success">Present: {presentCount}</Badge>
                <Badge bg="danger">Absent: {absentCount}</Badge>
                <Badge bg="info">WFH: {wfhCount}</Badge>
              </div>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.map((record) => (
                    <tr key={record.id}>
                      <td>{userMap[record.userId]?.name || "Unknown"}</td>
                      <td>{userMap[record.userId]?.department || "-"}</td>
                      <td>{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xs={12} xl={6} className="mb-4">
          <Card border="light" className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">Upcoming Birthdays</h5>
            </Card.Header>
            <Card.Body>
              {upcomingBirthdays.length === 0 ? (
                <p className="mb-0">No upcoming birthdays in the next 30 days.</p>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>In (days)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingBirthdays.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.department}</td>
                        <td>{user.days}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card border="light" className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">Today Birthdays</h5>
            </Card.Header>
            <Card.Body>
              {todayBirthdays.length === 0 ? (
                <p className="mb-0">No birthdays today.</p>
              ) : (
                <ul className="mb-0 ps-3">
                  {todayBirthdays.map((user) => (
                    <li key={user.id}>{user.name} ({user.department})</li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>

          <Card border="light" className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">On Leave Today</h5>
            </Card.Header>
            <Card.Body>
              {onLeaveToday.length === 0 ? (
                <p className="mb-0">No approved leave today.</p>
              ) : (
                <ul className="mb-0 ps-3">
                  {onLeaveToday.map((leave) => (
                    <li key={leave.id}>
                      {userMap[leave.userId]?.name || "Unknown"} - {leave.type}
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} xl={6} className="mb-4">
          <Card border="light" className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Organization Posts</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: 560, overflowY: "auto", paddingRight: 4 }}>
                <ul className="list-unstyled mb-0">
                  {organizationPosts.map((post) => (
                    <li key={post.id} className="mb-3 pb-3 border-bottom border-light">
                      <strong>{post.title}</strong>
                      <div className="small text-gray mb-2">
                        {post.author} | {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                      <div className="mb-2">{post.message || post.summary}</div>

                      {Array.isArray(post.attachments) && post.attachments.length > 0 ? (
                        <div>
                          {post.attachments.map((attachment) => (
                            <div key={attachment.id} className="mb-2">
                              {attachment.type === "image" ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name || "Company post attachment"}
                                  style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 6 }}
                                />
                              ) : null}
                              {attachment.type === "video" ? (
                                <video
                                  src={attachment.url}
                                  controls
                                  style={{ width: "100%", maxHeight: 260, borderRadius: 6 }}
                                />
                              ) : null}
                              {attachment.type === "audio" ? (
                                <audio src={attachment.url} controls style={{ width: "100%" }} />
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      <div className="d-flex align-items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant={(post.likes || []).includes(currentUser.id) ? "primary" : "outline-primary"}
                          onClick={() => togglePostLike(post.id)}
                        >
                          {(post.likes || []).includes(currentUser.id) ? "Unlike" : "Like"} ({(post.likes || []).length})
                        </Button>
                      </div>

                      <div className="mt-2">
                        {(post.comments || []).length > 0 ? (
                          <ul className="list-unstyled mb-2">
                            {post.comments.map((comment) => (
                              <li key={comment.id} className="small mb-1">
                                <strong>{comment.userName}:</strong> {comment.message}
                              </li>
                            ))}
                          </ul>
                        ) : null}

                        <Form
                          onSubmit={(event) => {
                            event.preventDefault();
                            const value = commentDrafts[post.id] || "";
                            if (!value.trim()) return;
                            addPostComment(post.id, value);
                            setCommentDrafts((prev) => ({ ...prev, [post.id]: "" }));
                          }}
                        >
                          <div className="d-flex gap-2">
                            <Form.Control
                              size="sm"
                              placeholder="Write a comment"
                              value={commentDrafts[post.id] || ""}
                              onChange={(event) => {
                                const { value } = event.target;
                                setCommentDrafts((prev) => ({ ...prev, [post.id]: value }));
                              }}
                            />
                            <Button size="sm" type="submit" variant="outline-secondary">
                              Comment
                            </Button>
                          </div>
                        </Form>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
