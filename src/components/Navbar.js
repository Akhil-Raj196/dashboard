import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faClock, faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import { Badge, Button, Container, Form, Nav, Navbar } from "@themesberg/react-bootstrap";
import { useAuth } from "../context/AuthContext";

export default function TopNavbar() {
  const { currentUser, notifications, logout, uiTheme, setTheme, availableThemes } = useAuth();

  const unreadCount = notifications.filter(
    (n) => n.userId === currentUser.id && !n.read
  ).length;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Navbar variant="dark" expanded className="ps-0 pe-2 pb-0">
      <Container fluid className="px-0">
        <div className="d-flex justify-content-between w-100 align-items-center">
          <div>
            <h6 className="mb-1">{currentUser.name}</h6>
            <small className="text-gray text-capitalize">{currentUser.role} | {currentUser.department}</small>
          </div>

          <Nav className="align-items-center gap-3 topbar-actions flex-wrap justify-content-end">
            <Form.Select
              className="theme-select"
              size="sm"
              value={uiTheme || "ocean"}
              onChange={(event) => setTheme(event.target.value)}
            >
              {availableThemes.map((theme) => (
                <option key={theme.key} value={theme.key}>
                  {theme.label}
                </option>
              ))}
            </Form.Select>

            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faClock} className="me-2" />
              <small>{timezone}</small>
            </div>

            <div>
              <FontAwesomeIcon icon={faBell} className="me-2" />
              <Badge bg={unreadCount > 0 ? "danger" : "secondary"}>{unreadCount}</Badge>
            </div>

            <Button variant="outline-primary" size="sm" onClick={logout}>
              <FontAwesomeIcon icon={faSignOutAlt} className="me-1" /> Logout
            </Button>
          </Nav>
        </div>
      </Container>
    </Navbar>
  );
}
