import React, { useMemo, useState } from "react";
import { Button, Card, Col, Form, Row } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";

export default function Chat() {
  const { currentUser, users, chats, sendChatMessage } = useAuth();

  const availableUsers = users.filter((user) => user.id !== currentUser.id);
  const [selectedUser, setSelectedUser] = useState(availableUsers[0]?.id || "");
  const [message, setMessage] = useState("");

  const activeChat = useMemo(() => {
    return chats.find((chat) =>
      chat.participants.includes(currentUser.id) && chat.participants.includes(selectedUser)
    );
  }, [chats, currentUser.id, selectedUser]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.id] = user;
    });
    return map;
  }, [users]);

  const onSend = (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    sendChatMessage(selectedUser, message);
    setMessage("");
  };

  return (
    <Row>
      <Col xs={12} lg={4} className="mb-4">
        <Card border="light" className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">Chat Contacts</h5>
          </Card.Header>
          <Card.Body>
            <Form.Select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </Form.Select>
          </Card.Body>
        </Card>
      </Col>

      <Col xs={12} lg={8}>
        <Card border="light" className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">Messages</h5>
          </Card.Header>
          <Card.Body style={{ minHeight: 280 }}>
            {!activeChat || activeChat.messages.length === 0 ? (
              <p className="mb-0">No messages yet.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {activeChat.messages.map((msg) => (
                  <li key={msg.id} className="mb-3">
                    <strong>{userMap[msg.from]?.name || "Unknown"}:</strong> {msg.text}
                    <div>
                      <small className="text-gray">{new Date(msg.createdAt).toLocaleString()}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
          <Card.Footer>
            <Form onSubmit={onSend}>
              <Row>
                <Col xs={9}>
                  <Form.Control
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message"
                  />
                </Col>
                <Col xs={3}>
                  <Button type="submit" className="w-100">Send</Button>
                </Col>
              </Row>
            </Form>
          </Card.Footer>
        </Card>
      </Col>
    </Row>
  );
}
