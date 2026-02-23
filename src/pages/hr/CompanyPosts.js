import React, { useMemo, useState } from "react";
import { Alert, Badge, Button, Card, Col, Form, Row } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const resolveAttachmentType = (mimeType = "") => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
};

export default function CompanyPosts() {
  const { currentUser, organizationPosts, createCompanyPost, hasPermission } = useAuth();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canCreatePost = currentUser.role === "admin" || hasPermission("access");

  const sortedPosts = useMemo(
    () => [...organizationPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [organizationPosts]
  );

  const onUploadFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const next = [];
    for (const file of files) {
      const dataUrl = await readFileAsDataUrl(file);
      next.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: resolveAttachmentType(file.type),
        mimeType: file.type,
        name: file.name,
        url: dataUrl
      });
    }

    setAttachments((prev) => [...prev, ...next]);
  };

  const removeAttachment = (attachmentId) => {
    setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
  };

  const onSubmitPost = (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const response = createCompanyPost({ title, message, attachments });
    if (!response.success) {
      setError(response.message || "Unable to create post.");
      return;
    }

    setSuccess("Company post published successfully.");
    setTitle("");
    setMessage("");
    setAttachments([]);
  };

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
        <div>
          <h4>Company Post</h4>
          <p className="mb-0">Announcements, festive wishes, increment notes and company-wide updates.</p>
        </div>
      </div>

      {canCreatePost ? (
        <Card border="light" className="shadow-sm mb-4">
          <Card.Header>
            <h5 className="mb-0">Create New Company Post</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={onSubmitPost}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Diwali celebration at HQ"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Announcement Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write announcement details"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Attach Image / Audio / Video</Form.Label>
                <Form.Control type="file" accept="image/*,audio/*,video/*" multiple onChange={onUploadFiles} />
              </Form.Group>

              {attachments.length > 0 ? (
                <Row className="mb-3">
                  {attachments.map((attachment) => (
                    <Col xs={12} md={6} lg={4} key={attachment.id} className="mb-3">
                      <Card border="light">
                        <Card.Body>
                          <div className="small text-gray mb-2">{attachment.name}</div>
                          {attachment.type === "image" ? (
                            <img src={attachment.url} alt={attachment.name} style={{ width: "100%", borderRadius: 6 }} />
                          ) : null}
                          {attachment.type === "video" ? (
                            <video src={attachment.url} controls style={{ width: "100%", borderRadius: 6 }} />
                          ) : null}
                          {attachment.type === "audio" ? <audio src={attachment.url} controls style={{ width: "100%" }} /> : null}
                          <Button size="sm" variant="outline-danger" className="mt-2" onClick={() => removeAttachment(attachment.id)}>
                            Remove
                          </Button>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : null}

              {error ? <Alert variant="danger">{error}</Alert> : null}
              {success ? <Alert variant="success">{success}</Alert> : null}

              <Button type="submit">Publish Company Post</Button>
            </Form>
          </Card.Body>
        </Card>
      ) : null}

      <Card border="light" className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Recent Company Posts</h5>
        </Card.Header>
        <Card.Body>
          {sortedPosts.length === 0 ? (
            <p className="mb-0">No company posts yet.</p>
          ) : (
            sortedPosts.map((post) => {
              const mediaCount = Array.isArray(post.attachments) ? post.attachments.length : 0;

              return (
                <Card border="light" className="mb-3" key={post.id}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="mb-1">{post.title}</h5>
                        <div className="small text-gray">
                          {post.author} | {new Date(post.createdAt).toLocaleString()}
                        </div>
                      </div>
                      {mediaCount > 0 ? <Badge bg="info">{mediaCount} media</Badge> : null}
                    </div>

                    <p className="mb-3">{post.message || post.summary}</p>

                    {Array.isArray(post.attachments) && post.attachments.length > 0 ? (
                      <Row>
                        {post.attachments.map((attachment) => (
                          <Col xs={12} md={6} lg={4} key={attachment.id} className="mb-3">
                            {attachment.type === "image" ? (
                              <img src={attachment.url} alt={attachment.name} style={{ width: "100%", borderRadius: 6 }} />
                            ) : null}
                            {attachment.type === "video" ? (
                              <video src={attachment.url} controls style={{ width: "100%", borderRadius: 6 }} />
                            ) : null}
                            {attachment.type === "audio" ? (
                              <audio src={attachment.url} controls style={{ width: "100%" }} />
                            ) : null}
                          </Col>
                        ))}
                      </Row>
                    ) : null}
                  </Card.Body>
                </Card>
              );
            })
          )}
        </Card.Body>
      </Card>
    </>
  );
}
