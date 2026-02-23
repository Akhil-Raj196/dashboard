import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, Col, Form, Image, Row, Table } from "@themesberg/react-bootstrap";
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
    width: "min(680px, 100vw)",
    height: "100vh",
    background: "#fff",
    zIndex: 1050,
    overflowY: "auto",
    boxShadow: "-6px 0 24px rgba(0,0,0,0.15)",
    padding: "1rem 1.25rem 2rem"
  }
};

const createEducationDraft = () => ({
  id: `edu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  degree: "",
  institution: "",
  year: "",
  score: ""
});

const hasValue = (value) => {
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function Profile() {
  const {
    currentUser,
    updateCurrentUserProfile,
    deleteEducationEntry,
    deleteVerificationDocument
  } = useAuth();

  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    setDraft({
      name: currentUser.name || "",
      designation: currentUser.designation || "",
      department: currentUser.department || "",
      phone: currentUser.phone || "",
      location: currentUser.location || "",
      personalDetails: {
        dob: currentUser.personalDetails?.dob || currentUser.dob || "",
        gender: currentUser.personalDetails?.gender || "",
        maritalStatus: currentUser.personalDetails?.maritalStatus || "",
        bloodGroup: currentUser.personalDetails?.bloodGroup || "",
        nationality: currentUser.personalDetails?.nationality || "",
        address: currentUser.personalDetails?.address || "",
        city: currentUser.personalDetails?.city || "",
        state: currentUser.personalDetails?.state || "",
        postalCode: currentUser.personalDetails?.postalCode || "",
        emergencyContactName: currentUser.personalDetails?.emergencyContactName || "",
        emergencyContactPhone: currentUser.personalDetails?.emergencyContactPhone || "",
        joiningDate: currentUser.personalDetails?.joiningDate || "",
        employeeCode: currentUser.personalDetails?.employeeCode || ""
      },
      educationDetails:
        currentUser.educationDetails && currentUser.educationDetails.length > 0
          ? currentUser.educationDetails
          : [createEducationDraft()],
      verificationDocs: {
        aadharNumber: currentUser.verificationDocs?.aadharNumber || "",
        panNumber: currentUser.verificationDocs?.panNumber || "",
        nameOnAadhar: currentUser.verificationDocs?.nameOnAadhar || currentUser.name || "",
        nameOnPan: currentUser.verificationDocs?.nameOnPan || currentUser.name || "",
        aadharImage: currentUser.verificationDocs?.aadharImage || "",
        panImage: currentUser.verificationDocs?.panImage || ""
      }
    });
  }, [currentUser]);

  const personalDetails = useMemo(() => {
    if (!currentUser) return [];
    const allFields = [
      ["Employee Code", currentUser.personalDetails?.employeeCode],
      ["Email", currentUser.email],
      ["Phone", currentUser.phone],
      ["Date Of Birth", currentUser.personalDetails?.dob || currentUser.dob],
      ["Gender", currentUser.personalDetails?.gender],
      ["Marital Status", currentUser.personalDetails?.maritalStatus],
      ["Blood Group", currentUser.personalDetails?.bloodGroup],
      ["Nationality", currentUser.personalDetails?.nationality],
      ["Department", currentUser.department],
      ["Designation", currentUser.designation],
      ["Joining Date", currentUser.personalDetails?.joiningDate],
      ["Location", currentUser.location],
      ["Address", currentUser.personalDetails?.address],
      ["City", currentUser.personalDetails?.city],
      ["State", currentUser.personalDetails?.state],
      ["Postal Code", currentUser.personalDetails?.postalCode],
      ["Emergency Contact", currentUser.personalDetails?.emergencyContactName],
      ["Emergency Phone", currentUser.personalDetails?.emergencyContactPhone]
    ];

    return allFields.filter(([, value]) => hasValue(value));
  }, [currentUser]);

  const educationRows = useMemo(
    () =>
      (currentUser.educationDetails || []).filter(
        (edu) => hasValue(edu.degree) || hasValue(edu.institution) || hasValue(edu.year) || hasValue(edu.score)
      ),
    [currentUser.educationDetails]
  );

  const hasAadharData = useMemo(() => {
    const doc = currentUser.verificationDocs || {};
    return hasValue(doc.nameOnAadhar) || hasValue(doc.aadharNumber) || hasValue(doc.aadharImage);
  }, [currentUser.verificationDocs]);

  const hasPanData = useMemo(() => {
    const doc = currentUser.verificationDocs || {};
    return hasValue(doc.nameOnPan) || hasValue(doc.panNumber) || hasValue(doc.panImage);
  }, [currentUser.verificationDocs]);

  const onDraftField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const onDraftPersonalField = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      personalDetails: { ...prev.personalDetails, [field]: value }
    }));
  };

  const onDraftDocField = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      verificationDocs: { ...prev.verificationDocs, [field]: value }
    }));
  };

  const onDraftEducationField = (id, field, value) => {
    setDraft((prev) => ({
      ...prev,
      educationDetails: prev.educationDetails.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const onRemoveEducationDraft = (id) => {
    setDraft((prev) => ({
      ...prev,
      educationDetails: prev.educationDetails.filter((edu) => edu.id !== id)
    }));
  };

  const onAddEducationDraft = () => {
    setDraft((prev) => ({
      ...prev,
      educationDetails: [...prev.educationDetails, createEducationDraft()]
    }));
  };

  const onUploadDocument = async (type, file) => {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    const key = type === "aadhar" ? "aadharImage" : "panImage";
    onDraftDocField(key, dataUrl);
  };

  const onUpdate = () => {
    const cleanedEducation = (draft.educationDetails || []).filter(
      (edu) => edu.degree || edu.institution || edu.year || edu.score
    );

    updateCurrentUserProfile({
      name: draft.name,
      designation: draft.designation,
      department: draft.department,
      phone: draft.phone,
      location: draft.location,
      personalDetails: draft.personalDetails,
      educationDetails: cleanedEducation,
      verificationDocs: draft.verificationDocs
    });

    setShowEditor(false);
  };

  return (
    <>
      <Row>
        <Col xs={12} xl={4} className="mb-4">
          <Card border="light" className="shadow-sm text-center">
            <Card.Body>
              <Image src={currentUser.image} roundedCircle className="mb-3" width={120} height={120} />
              <h4 className="mb-1">{currentUser.name}</h4>
              <p className="text-gray mb-1">{currentUser.designation}</p>
              <p className="text-gray mb-4">{currentUser.department}</p>
              <div className="d-flex gap-2 justify-content-center">
                <Button onClick={() => setShowEditor(true)}>Edit Profile</Button>
              </div>
            </Card.Body>
          </Card>

          <Card border="light" className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Verification Documents</h5>
            </Card.Header>
            <Card.Body>
              {!hasAadharData && !hasPanData ? (
                <p className="mb-0">No verification details added yet.</p>
              ) : null}

              {hasAadharData ? (
                <div className="mb-3">
                  <strong>Aadhar</strong>
                  {hasValue(currentUser.verificationDocs?.nameOnAadhar) ? (
                    <div>Name: {currentUser.verificationDocs.nameOnAadhar}</div>
                  ) : null}
                  {hasValue(currentUser.verificationDocs?.aadharNumber) ? (
                    <div>Number: {currentUser.verificationDocs.aadharNumber}</div>
                  ) : null}
                  {currentUser.verificationDocs?.aadharImage ? (
                    <Image src={currentUser.verificationDocs.aadharImage} thumbnail className="mt-2" />
                  ) : null}
                  <div className="mt-2">
                    <Button size="sm" variant="outline-danger" onClick={() => deleteVerificationDocument("aadhar")}>
                      Delete Aadhar
                    </Button>
                  </div>
                </div>
              ) : null}

              {hasPanData ? (
                <div>
                  <strong>PAN</strong>
                  {hasValue(currentUser.verificationDocs?.nameOnPan) ? (
                    <div>Name: {currentUser.verificationDocs.nameOnPan}</div>
                  ) : null}
                  {hasValue(currentUser.verificationDocs?.panNumber) ? (
                    <div>Number: {currentUser.verificationDocs.panNumber}</div>
                  ) : null}
                  {currentUser.verificationDocs?.panImage ? (
                    <Image src={currentUser.verificationDocs.panImage} thumbnail className="mt-2" />
                  ) : null}
                  <div className="mt-2">
                    <Button size="sm" variant="outline-danger" onClick={() => deleteVerificationDocument("pan")}>
                      Delete PAN
                    </Button>
                  </div>
                </div>
              ) : null}
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} xl={8} className="mb-4">
          <Card border="light" className="shadow-sm mb-4">
            <Card.Header>
              <h5 className="mb-0">Personal Details</h5>
            </Card.Header>
            <Card.Body>
              {personalDetails.length === 0 ? (
                <p className="mb-0">No personal details added yet.</p>
              ) : (
                <Table responsive>
                  <tbody>
                    {personalDetails.map(([label, value]) => (
                      <tr key={label}>
                        <td><strong>{label}</strong></td>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card border="light" className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Educational Details</h5>
            </Card.Header>
            <Card.Body>
              {educationRows.length === 0 ? (
                <p className="mb-0">No educational records added.</p>
              ) : (
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Degree</th>
                      <th>Institution</th>
                      <th>Year</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {educationRows.map((edu) => (
                      <tr key={edu.id}>
                        <td>{edu.degree}</td>
                        <td>{edu.institution}</td>
                        <td>{edu.year}</td>
                        <td>{edu.score}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => deleteEducationEntry(edu.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {showEditor && draft ? (
        <>
          <div style={drawerStyles.overlay} onClick={() => setShowEditor(false)} />
          <aside style={drawerStyles.panel}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">Edit Employee Details</h4>
              <Button variant="outline-secondary" size="sm" onClick={() => setShowEditor(false)}>
                Close
              </Button>
            </div>

            <Card border="light" className="shadow-sm mb-3">
              <Card.Header><h6 className="mb-0">Basic Details</h6></Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control value={draft.name} onChange={(e) => onDraftField("name", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Designation</Form.Label>
                    <Form.Control value={draft.designation} onChange={(e) => onDraftField("designation", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Department</Form.Label>
                    <Form.Control value={draft.department} onChange={(e) => onDraftField("department", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Phone</Form.Label>
                    <Form.Control value={draft.phone} onChange={(e) => onDraftField("phone", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control value={draft.location} onChange={(e) => onDraftField("location", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Employee Code</Form.Label>
                    <Form.Control value={draft.personalDetails.employeeCode} onChange={(e) => onDraftPersonalField("employeeCode", e.target.value)} />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card border="light" className="shadow-sm mb-3">
              <Card.Header><h6 className="mb-0">Personal Details</h6></Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label>Date Of Birth</Form.Label>
                    <Form.Control type="date" value={draft.personalDetails.dob} onChange={(e) => onDraftPersonalField("dob", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Control value={draft.personalDetails.gender} onChange={(e) => onDraftPersonalField("gender", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Marital Status</Form.Label>
                    <Form.Control value={draft.personalDetails.maritalStatus} onChange={(e) => onDraftPersonalField("maritalStatus", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Blood Group</Form.Label>
                    <Form.Control value={draft.personalDetails.bloodGroup} onChange={(e) => onDraftPersonalField("bloodGroup", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Nationality</Form.Label>
                    <Form.Control value={draft.personalDetails.nationality} onChange={(e) => onDraftPersonalField("nationality", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Joining Date</Form.Label>
                    <Form.Control type="date" value={draft.personalDetails.joiningDate} onChange={(e) => onDraftPersonalField("joiningDate", e.target.value)} />
                  </Col>
                  <Col md={12} className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control value={draft.personalDetails.address} onChange={(e) => onDraftPersonalField("address", e.target.value)} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Control value={draft.personalDetails.city} onChange={(e) => onDraftPersonalField("city", e.target.value)} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Label>State</Form.Label>
                    <Form.Control value={draft.personalDetails.state} onChange={(e) => onDraftPersonalField("state", e.target.value)} />
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Label>Postal Code</Form.Label>
                    <Form.Control value={draft.personalDetails.postalCode} onChange={(e) => onDraftPersonalField("postalCode", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Emergency Contact Name</Form.Label>
                    <Form.Control value={draft.personalDetails.emergencyContactName} onChange={(e) => onDraftPersonalField("emergencyContactName", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Emergency Contact Phone</Form.Label>
                    <Form.Control value={draft.personalDetails.emergencyContactPhone} onChange={(e) => onDraftPersonalField("emergencyContactPhone", e.target.value)} />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card border="light" className="shadow-sm mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Educational Details</h6>
                <Button size="sm" variant="outline-primary" onClick={onAddEducationDraft}>Add</Button>
              </Card.Header>
              <Card.Body>
                {draft.educationDetails.map((edu) => (
                  <Card key={edu.id} border="light" className="mb-3">
                    <Card.Body>
                      <Row>
                        <Col md={6} className="mb-3">
                          <Form.Label>Degree</Form.Label>
                          <Form.Control value={edu.degree} onChange={(e) => onDraftEducationField(edu.id, "degree", e.target.value)} />
                        </Col>
                        <Col md={6} className="mb-3">
                          <Form.Label>Institution</Form.Label>
                          <Form.Control value={edu.institution} onChange={(e) => onDraftEducationField(edu.id, "institution", e.target.value)} />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Year</Form.Label>
                          <Form.Control value={edu.year} onChange={(e) => onDraftEducationField(edu.id, "year", e.target.value)} />
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Label>Score/CGPA</Form.Label>
                          <Form.Control value={edu.score} onChange={(e) => onDraftEducationField(edu.id, "score", e.target.value)} />
                        </Col>
                        <Col md={4} className="mb-3 d-flex align-items-end">
                          <Button variant="outline-danger" onClick={() => onRemoveEducationDraft(edu.id)}>
                            Delete
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
              </Card.Body>
            </Card>

            <Card border="light" className="shadow-sm mb-4">
              <Card.Header><h6 className="mb-0">Verification Details (Aadhar / PAN)</h6></Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label>Name On Aadhar</Form.Label>
                    <Form.Control value={draft.verificationDocs.nameOnAadhar} onChange={(e) => onDraftDocField("nameOnAadhar", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Aadhar Number</Form.Label>
                    <Form.Control value={draft.verificationDocs.aadharNumber} onChange={(e) => onDraftDocField("aadharNumber", e.target.value)} />
                  </Col>
                  <Col md={12} className="mb-3">
                    <Form.Label>Aadhar Image</Form.Label>
                    <Form.Control type="file" accept="image/*" onChange={(e) => onUploadDocument("aadhar", e.target.files?.[0])} />
                  </Col>

                  <Col md={6} className="mb-3">
                    <Form.Label>Name On PAN</Form.Label>
                    <Form.Control value={draft.verificationDocs.nameOnPan} onChange={(e) => onDraftDocField("nameOnPan", e.target.value)} />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>PAN Number</Form.Label>
                    <Form.Control value={draft.verificationDocs.panNumber} onChange={(e) => onDraftDocField("panNumber", e.target.value)} />
                  </Col>
                  <Col md={12} className="mb-3">
                    <Form.Label>PAN Image</Form.Label>
                    <Form.Control type="file" accept="image/*" onChange={(e) => onUploadDocument("pan", e.target.files?.[0])} />
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <div className="d-flex gap-2 justify-content-end">
              <Button variant="outline-secondary" onClick={() => setShowEditor(false)}>Cancel</Button>
              <Button onClick={onUpdate}>Update</Button>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
