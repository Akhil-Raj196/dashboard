import React, { useState } from "react";
import { Badge, Button, Card, Modal, Table } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";

export default function Notifications() {
  const { currentUser, notifications, markNotificationRead } = useAuth();
  const [activeNotification, setActiveNotification] = useState(null);

  const visibleNotifications = notifications.filter(
    (notification) => currentUser.role === "admin" || notification.userId === currentUser.id
  );

  const openNotification = (notification) => {
    setActiveNotification(notification);
    if (!notification.read) {
      markNotificationRead(notification.id);
    }
  };

  return (
    <>
      <Card border="light" className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Notifications (App + Email)</h5>
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <th>Title</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Time</th>
                <th>Read</th>
              </tr>
            </thead>
            <tbody>
              {visibleNotifications.map((notification) => (
                <tr key={notification.id}>
                  <td>
                    <Button
                      variant="link"
                      className="p-0 text-start"
                      onClick={() => openNotification(notification)}
                    >
                      {notification.title}
                    </Button>
                  </td>
                  <td>
                    <Badge bg={notification.channel === "email" ? "info" : "secondary"}>
                      {notification.channel}
                    </Badge>
                  </td>
                  <td>{notification.status}</td>
                  <td>{new Date(notification.createdAt).toLocaleString()}</td>
                  <td>
                    {notification.read ? (
                      <Badge bg="success">Read</Badge>
                    ) : (
                      <Button size="sm" variant="outline-primary" onClick={() => markNotificationRead(notification.id)}>
                        Mark Read
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={Boolean(activeNotification)} onHide={() => setActiveNotification(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{activeNotification?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">{activeNotification?.message}</p>
          <p className="mb-1"><strong>Channel:</strong> {activeNotification?.channel}</p>
          <p className="mb-1"><strong>Status:</strong> {activeNotification?.status}</p>
          <p className="mb-0"><strong>Time:</strong> {activeNotification ? new Date(activeNotification.createdAt).toLocaleString() : ""}</p>
        </Modal.Body>
      </Modal>
    </>
  );
}
