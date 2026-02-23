import React, { useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Form } from "@themesberg/react-bootstrap";
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

const toDateString = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMinutes = (minutes = 0) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
};

const getMonthDates = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const last = new Date(year, month + 1, 0);

  const dates = [];
  for (let day = 1; day <= last.getDate(); day += 1) {
    dates.push(new Date(year, month, day));
  }
  return dates;
};

const getStatusTheme = (statusType) => {
  switch (statusType) {
    case "official_leave":
      return { bg: "#1f9d55", text: "#fff", label: "Official Leave" };
    case "half_day":
      return { bg: "#f3c53f", text: "#1b1b1b", label: "Half Day" };
    case "paid_leave":
      return { bg: "#7c3aed", text: "#fff", label: "Paid Leave" };
    case "weekend":
      return { bg: "#d7263d", text: "#fff", label: "Weekend" };
    case "full_day":
      return { bg: "#2563eb", text: "#fff", label: "Full Day" };
    case "absent":
      return { bg: "#64748b", text: "#fff", label: "Absent" };
    default:
      return { bg: "#0ea5e9", text: "#fff", label: "Present" };
  }
};

export default function Attendance() {
  const { currentUser, users, leaves, holidays, attendanceSessions, submitRegularizationRequest } = useAuth();
  const [showRegularizeForm, setShowRegularizeForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [regularizeReason, setRegularizeReason] = useState("");
  const [regularizeMessage, setRegularizeMessage] = useState("");

  const scopedUsers = useMemo(() => {
    if (currentUser.role === "admin") return users;
    return users.filter((user) => user.department === currentUser.department);
  }, [currentUser, users]);

  const monthDates = useMemo(() => getMonthDates(), []);

  const hrRecipients = useMemo(
    () =>
      users.filter(
        (user) =>
          user.id !== currentUser.id &&
          (user.role === "admin" || /hr|manager|senior/i.test(user.designation || ""))
      ),
    [users, currentUser.id]
  );

  const attendanceByUser = useMemo(() => {
    return scopedUsers.map((user) => {
      const days = monthDates.map((dateObj) => {
        const date = toDateString(dateObj);
        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

        const holiday = holidays.find((item) => item.date === date);
        const approvedLeave = leaves.find((leave) => {
          if (leave.userId !== user.id) return false;
          if (leave.status !== "Approved") return false;
          return leave.fromDate <= date && leave.toDate >= date;
        });

        const sessions = attendanceSessions.filter(
          (session) => session.userId === user.id && session.date === date
        );
        const totalWorkedMinutes = sessions.reduce((sum, session) => sum + (session.workedMinutes || 0), 0);

        let statusType = "absent";
        let statusLabel = "Absent";

        if (approvedLeave) {
          if (approvedLeave.type === "Paid Leave") {
            statusType = "paid_leave";
            statusLabel = "Paid Leave";
          } else if (approvedLeave.dayType === "Half Day") {
            statusType = "half_day";
            statusLabel = "Half Day Leave";
          } else {
            statusType = "official_leave";
            statusLabel = approvedLeave.type;
          }
        } else if (holiday) {
          statusType = "official_leave";
          statusLabel = holiday.name;
        } else if (isWeekend) {
          statusType = "weekend";
          statusLabel = "Weekend";
        } else if (totalWorkedMinutes >= 540) {
          statusType = "full_day";
          statusLabel = "Full Day (9h)";
        } else if (totalWorkedMinutes >= 300) {
          statusType = "half_day";
          statusLabel = "Half Day (5h)";
        } else if (totalWorkedMinutes > 0) {
          statusType = "present";
          statusLabel = "Present";
        }

        const firstSession = sessions[0];
        const lastSession = sessions[sessions.length - 1];

        const sessionInfo = sessions.length
          ? `In: ${new Date(firstSession.clockIn).toLocaleTimeString()} | Out: ${lastSession.clockOut ? new Date(lastSession.clockOut).toLocaleTimeString() : "Working"}`
          : "No work session";

        return {
          date,
          dayNumber: dateObj.getDate(),
          statusType,
          statusLabel,
          worked: formatMinutes(totalWorkedMinutes),
          tooltip: `${date} | ${statusLabel} | Worked: ${formatMinutes(totalWorkedMinutes)} | ${sessionInfo}`
        };
      });

      return {
        user,
        days
      };
    });
  }, [scopedUsers, monthDates, leaves, holidays, attendanceSessions]);

  const monthTitle = new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const onRegularizeSubmit = (event) => {
    event.preventDefault();
    const result = submitRegularizationRequest({
      date: selectedDate,
      reason: regularizeReason,
      recipientUserId: selectedRecipientId || null
    });
    setRegularizeMessage(result.success ? "Regularization request sent." : result.message);
    if (result.success) {
      setSelectedDate("");
      setSelectedRecipientId("");
      setRegularizeReason("");
      setShowRegularizeForm(false);
    }
  };

  return (
    <>
      <Card border="light" className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Attendance - {monthTitle}</h5>
        </Card.Header>
        <Card.Body>
          <p className="small text-gray mb-3">
            Full Day: 9 hours (including lunch) | Half Day: 5 hours | Admin sees all departments, employee sees own department.
          </p>

          <div className="mb-3">
            <Button
              variant="outline-primary"
              onClick={() => {
                setShowRegularizeForm(true);
                setRegularizeMessage("");
              }}
            >
              Regularize
            </Button>
          </div>

          <div className="d-flex gap-2 flex-wrap mb-4">
            {["official_leave", "half_day", "paid_leave", "weekend", "full_day", "absent"].map((type) => {
              const theme = getStatusTheme(type);
              return (
                <Badge key={type} style={{ backgroundColor: theme.bg, color: theme.text }}>
                  {theme.label}
                </Badge>
              );
            })}
          </div>

          <div style={{ overflowX: "auto" }}>
            {attendanceByUser.map(({ user, days }) => (
              <div key={user.id} className="mb-4 pb-3 border-bottom border-light">
                <div className="mb-2">
                  <strong>{user.name}</strong>
                  <span className="text-gray ms-2">({user.department})</span>
                </div>

                <div className="d-flex align-items-center gap-2" style={{ minWidth: 1200 }}>
                  {days.map((day) => {
                    const theme = getStatusTheme(day.statusType);
                    return (
                      <div
                        key={`${user.id}-${day.date}`}
                        title={day.tooltip}
                        onClick={() => {
                          if (user.id === currentUser.id) setSelectedDate(day.date);
                        }}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: theme.bg,
                          color: theme.text,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: user.id === currentUser.id ? "pointer" : "default",
                          border: "1px solid rgba(0,0,0,0.1)"
                        }}
                      >
                        {day.dayNumber}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {showRegularizeForm ? (
        <>
          <div
            style={drawerStyles.overlay}
            onClick={() => setShowRegularizeForm(false)}
          />
          <aside style={drawerStyles.panel}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Attendance Regularize Request</h4>
              <Button variant="outline-secondary" size="sm" onClick={() => setShowRegularizeForm(false)}>
                Close
              </Button>
            </div>

            <Card border="light" className="shadow-sm">
              <Card.Body>
                <Form onSubmit={onRegularizeSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Selected Date</Form.Label>
                    <Form.Control
                      required
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                    <small className="text-gray">Tip: click your date circle to auto-fill.</small>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Send HR Email To</Form.Label>
                    <Form.Select
                      required
                      value={selectedRecipientId}
                      onChange={(e) => setSelectedRecipientId(e.target.value)}
                    >
                      <option value="">Select HR/Manager email</option>
                      {hrRecipients.map((recipient) => (
                        <option key={recipient.id} value={recipient.id}>
                          {recipient.email}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Reason</Form.Label>
                    <Form.Control
                      required
                      value={regularizeReason}
                      onChange={(e) => setRegularizeReason(e.target.value)}
                      placeholder="Missed work login/out"
                    />
                  </Form.Group>

                  <Button type="submit" variant="outline-primary">
                    Regularize
                  </Button>
                </Form>
                {regularizeMessage ? <Alert className="mt-3 mb-0" variant="info">{regularizeMessage}</Alert> : null}
              </Card.Body>
            </Card>
          </aside>
        </>
      ) : null}
    </>
  );
}
