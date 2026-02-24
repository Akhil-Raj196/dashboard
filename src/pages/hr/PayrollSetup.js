import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { computeSalarySlipForPeriod, getCurrentMonthPeriod } from "../../utils/salarySlip";

const CURRENCY_OPTIONS = ["USD", "INR", "EUR", "GBP", "AED", "SGD"];

const formatAmount = (value, currencyCode = "USD") => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  } catch (error) {
    return `${currencyCode} ${Number(value || 0).toFixed(0)}`;
  }
};

const normalizeSlip = (slip) => {
  const currency = slip.currency || slip.employeeProfile?.currency || "USD";
  return {
    ...slip,
    currency,
    employeeProfile: {
      ...(slip.employeeProfile || {}),
      currency
    }
  };
};

const getDownloadMarkup = (slip, employeeName) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><title>Salary Slip - ${employeeName} - ${slip.month}</title></head>
<body style="font-family:Arial,sans-serif;padding:24px;">
<h1>${slip.companyName}</h1>
<p>Salary Slip for ${slip.month}</p>
<p><strong>Employee:</strong> ${employeeName}</p>
<p><strong>Employee Code:</strong> ${slip.employeeProfile?.employeeCode || "-"}</p>
<p><strong>Currency:</strong> ${slip.currency || "USD"}</p>
<p><strong>Working Days:</strong> ${slip.attendanceSummary?.workingDays ?? "-"}</p>
<p><strong>Paid Days:</strong> ${slip.attendanceSummary?.paidDays ?? "-"}</p>
<p><strong>PF Number:</strong> ${slip.employeeProfile?.pfNumber || "-"}</p>
<p><strong>ESI Number:</strong> ${slip.employeeProfile?.esiNumber || "-"}</p>
<p><strong>Total Deductions:</strong> ${formatAmount(slip.deductions?.total, slip.currency)}</p>
<p><strong>Net Salary:</strong> ${formatAmount(slip.net, slip.currency)}</p>
</body></html>`;

export default function PayrollSetup() {
  const { currentUser, users, attendanceSessions, leaves, holidays, updateEmployeePayroll } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState(users.find((u) => u.role !== "admin")?.id || currentUser.id);
  const [saveMessage, setSaveMessage] = useState("");
  const [payrollForm, setPayrollForm] = useState({
    firstName: "",
    lastName: "",
    employeeCode: "",
    pfNumber: "",
    esiNumber: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    ctcAnnual: "",
    currency: "USD",
    basicPct: "40",
    hraPct: "20",
    conveyanceFixed: "0",
    medicalFixed: "0",
    specialAllowanceFixed: "0",
    otherAllowanceFixed: "0",
    pfRate: "12",
    esiRate: "0.75",
    professionalTax: "200",
    tds: "0",
    loanDeduction: "0"
  });

  const userMap = useMemo(
    () =>
      users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}),
    [users]
  );

  useEffect(() => {
    const target = users.find((user) => user.id === selectedUserId) || currentUser;
    const payroll = target.payrollDetails || {};
    setPayrollForm({
      firstName: payroll.firstName || "",
      lastName: payroll.lastName || "",
      employeeCode: payroll.employeeCode || target.personalDetails?.employeeCode || "",
      pfNumber: payroll.pfNumber || "",
      esiNumber: payroll.esiNumber || "",
      accountNumber: payroll.accountNumber || "",
      ifscCode: payroll.ifscCode || "",
      bankName: payroll.bankName || "",
      ctcAnnual: payroll.ctcAnnual ? String(payroll.ctcAnnual) : "",
      currency: payroll.currency || "USD",
      basicPct: String(payroll.basicPct ?? 40),
      hraPct: String(payroll.hraPct ?? 20),
      conveyanceFixed: String(payroll.conveyanceFixed ?? 0),
      medicalFixed: String(payroll.medicalFixed ?? 0),
      specialAllowanceFixed: String(payroll.specialAllowanceFixed ?? 0),
      otherAllowanceFixed: String(payroll.otherAllowanceFixed ?? 0),
      pfRate: String(payroll.pfRate ?? 12),
      esiRate: String(payroll.esiRate ?? 0.75),
      professionalTax: String(payroll.professionalTax ?? 200),
      tds: String(payroll.tds ?? 0),
      loanDeduction: String(payroll.loanDeduction ?? 0)
    });
  }, [selectedUserId, users, currentUser]);

  const monthPeriod = getCurrentMonthPeriod(new Date());
  const draftSlip = useMemo(() => {
    const employee = users.find((user) => user.id === selectedUserId) || currentUser;
    return normalizeSlip(
      computeSalarySlipForPeriod({
        user: {
          ...employee,
          payrollDetails: {
            ...(employee.payrollDetails || {}),
            ...payrollForm,
            ctcAnnual: Number(payrollForm.ctcAnnual || 0)
          }
        },
        attendanceSessions,
        leaves,
        holidays,
        year: monthPeriod.year,
        monthIndex: monthPeriod.monthIndex
      })
    );
  }, [attendanceSessions, leaves, holidays, monthPeriod.year, monthPeriod.monthIndex, users, selectedUserId, currentUser, payrollForm]);

  const onPayrollField = (key, value) => setPayrollForm((prev) => ({ ...prev, [key]: value }));

  const onSavePayroll = (event) => {
    event.preventDefault();
    const result = updateEmployeePayroll(selectedUserId, {
      ...payrollForm,
      ctcAnnual: Number(payrollForm.ctcAnnual || 0),
      basicPct: Number(payrollForm.basicPct || 0),
      hraPct: Number(payrollForm.hraPct || 0),
      conveyanceFixed: Number(payrollForm.conveyanceFixed || 0),
      medicalFixed: Number(payrollForm.medicalFixed || 0),
      specialAllowanceFixed: Number(payrollForm.specialAllowanceFixed || 0),
      otherAllowanceFixed: Number(payrollForm.otherAllowanceFixed || 0),
      pfRate: Number(payrollForm.pfRate || 0),
      esiRate: Number(payrollForm.esiRate || 0),
      professionalTax: Number(payrollForm.professionalTax || 0),
      tds: Number(payrollForm.tds || 0),
      loanDeduction: Number(payrollForm.loanDeduction || 0)
    });
    setSaveMessage(result.success ? "Payroll details updated successfully." : (result.message || "Unable to update payroll details."));
  };

  const downloadDraftSlip = () => {
    const employeeName = userMap[draftSlip.userId]?.name || "Employee";
    const markup = getDownloadMarkup(draftSlip, employeeName);
    const blob = new Blob([markup], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `salary-slip-${employeeName.toLowerCase().replace(/\s+/g, "-")}-${draftSlip.month.replace(/\s+/g, "-")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <Card border="light" className="shadow-sm">
      <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h5 className="mb-0">Payroll Setup</h5>
          <small className="text-gray">HR-only salary details form and salary-slip preview.</small>
        </div>
        <Button size="sm" variant="primary">
          Salary Slip Details
        </Button>
      </Card.Header>

      <Card.Body>
        <Row className="mb-3">
          <Col xs={12} lg={6}>
            <Form.Group>
              <Form.Label>Select Employee</Form.Label>
              <Form.Select
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setSaveMessage("");
                }}
              >
                {users
                  .filter((user) => user.role !== "admin")
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Alert variant="warning" className="mb-3">
          Fill all salary details below. CTC is used only to calculate monthly salary after deductions and leave impact.
        </Alert>

        <Card border="light" className="shadow-sm mb-3">
          <Card.Body>
            <Form onSubmit={onSavePayroll}>
              <Row>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control required value={payrollForm.firstName} onChange={(e) => onPayrollField("firstName", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control value={payrollForm.lastName} onChange={(e) => onPayrollField("lastName", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Employee Code</Form.Label>
                  <Form.Control required value={payrollForm.employeeCode} onChange={(e) => onPayrollField("employeeCode", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Currency</Form.Label>
                  <Form.Select value={payrollForm.currency} onChange={(e) => onPayrollField("currency", e.target.value)}>
                    {CURRENCY_OPTIONS.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>CTC (Annual)</Form.Label>
                  <Form.Control required type="number" min="0" value={payrollForm.ctcAnnual} onChange={(e) => onPayrollField("ctcAnnual", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Basic (%)</Form.Label>
                  <Form.Control type="number" min="0" max="100" value={payrollForm.basicPct} onChange={(e) => onPayrollField("basicPct", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>HRA (%)</Form.Label>
                  <Form.Control type="number" min="0" max="100" value={payrollForm.hraPct} onChange={(e) => onPayrollField("hraPct", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Conveyance (Monthly)</Form.Label>
                  <Form.Control type="number" min="0" value={payrollForm.conveyanceFixed} onChange={(e) => onPayrollField("conveyanceFixed", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Medical (Monthly)</Form.Label>
                  <Form.Control type="number" min="0" value={payrollForm.medicalFixed} onChange={(e) => onPayrollField("medicalFixed", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Special Allowance (Monthly)</Form.Label>
                  <Form.Control type="number" min="0" value={payrollForm.specialAllowanceFixed} onChange={(e) => onPayrollField("specialAllowanceFixed", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Other Allowance (Monthly)</Form.Label>
                  <Form.Control type="number" min="0" value={payrollForm.otherAllowanceFixed} onChange={(e) => onPayrollField("otherAllowanceFixed", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>PF Number</Form.Label>
                  <Form.Control value={payrollForm.pfNumber} onChange={(e) => onPayrollField("pfNumber", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>ESI Number</Form.Label>
                  <Form.Control value={payrollForm.esiNumber} onChange={(e) => onPayrollField("esiNumber", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>PF Rate (%)</Form.Label>
                  <Form.Control type="number" min="0" value={payrollForm.pfRate} onChange={(e) => onPayrollField("pfRate", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>ESI Rate (%)</Form.Label>
                  <Form.Control type="number" min="0" value={payrollForm.esiRate} onChange={(e) => onPayrollField("esiRate", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Professional Tax (Monthly)</Form.Label>
                  <Form.Control type="number" min="0" value={payrollForm.professionalTax} onChange={(e) => onPayrollField("professionalTax", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>TDS (Monthly)</Form.Label>
                  <Form.Control type="number" min="0" value={payrollForm.tds} onChange={(e) => onPayrollField("tds", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Loan Deduction (Monthly)</Form.Label>
                  <Form.Control type="number" min="0" value={payrollForm.loanDeduction} onChange={(e) => onPayrollField("loanDeduction", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Account Number</Form.Label>
                  <Form.Control value={payrollForm.accountNumber} onChange={(e) => onPayrollField("accountNumber", e.target.value)} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>IFSC Code</Form.Label>
                  <Form.Control value={payrollForm.ifscCode} onChange={(e) => onPayrollField("ifscCode", e.target.value.toUpperCase())} />
                </Col>
                <Col xs={12} md={6} className="mb-3">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control value={payrollForm.bankName} onChange={(e) => onPayrollField("bankName", e.target.value)} />
                </Col>
              </Row>
              <div className="d-flex align-items-center gap-3">
                <Button type="submit" variant="primary">Save Salary Details</Button>
                {saveMessage ? <small className="text-gray">{saveMessage}</small> : null}
              </div>
            </Form>
          </Card.Body>
        </Card>

        <Card border="light" className="shadow-sm">
          <Card.Header>
            <strong>Salary Slip Preview ({draftSlip.month})</strong>
          </Card.Header>
          <Card.Body>
            <Row className="mb-2">
              <Col xs={12} md={6}><strong>Employee Code:</strong> {draftSlip.employeeProfile?.employeeCode || "-"}</Col>
              <Col xs={12} md={6}><strong>Currency:</strong> {draftSlip.currency}</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={12} md={6}><strong>Working Days:</strong> {draftSlip.attendanceSummary?.workingDays || 0}</Col>
              <Col xs={12} md={6}><strong>Paid Days:</strong> {draftSlip.attendanceSummary?.paidDays || 0}</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={12} md={6}><strong>PF Number:</strong> {draftSlip.employeeProfile?.pfNumber || "-"}</Col>
              <Col xs={12} md={6}><strong>ESI Number:</strong> {draftSlip.employeeProfile?.esiNumber || "-"}</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={12} md={6}><strong>Gross:</strong> {formatAmount(draftSlip.earnings?.gross, draftSlip.currency)}</Col>
              <Col xs={12} md={6}><strong>Total Deductions:</strong> {formatAmount(draftSlip.deductions?.total, draftSlip.currency)}</Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} md={6}><strong>Basic:</strong> {formatAmount(draftSlip.earnings?.basic, draftSlip.currency)}</Col>
              <Col xs={12} md={6}><strong>Net Salary:</strong> {formatAmount(draftSlip.net, draftSlip.currency)}</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={12} md={6}><strong>HRA:</strong> {formatAmount(draftSlip.earnings?.hra, draftSlip.currency)}</Col>
              <Col xs={12} md={6}><strong>Conveyance:</strong> {formatAmount(draftSlip.earnings?.conveyance, draftSlip.currency)}</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={12} md={6}><strong>Medical:</strong> {formatAmount(draftSlip.earnings?.medical, draftSlip.currency)}</Col>
              <Col xs={12} md={6}><strong>Special:</strong> {formatAmount(draftSlip.earnings?.specialAllowance, draftSlip.currency)}</Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} md={6}><strong>Other:</strong> {formatAmount(draftSlip.earnings?.otherAllowance, draftSlip.currency)}</Col>
              <Col xs={12} md={6}><strong>PF / ESI / PT / TDS / Loan:</strong> {formatAmount(draftSlip.deductions?.pf, draftSlip.currency)} / {formatAmount(draftSlip.deductions?.esi, draftSlip.currency)} / {formatAmount(draftSlip.deductions?.professionalTax, draftSlip.currency)} / {formatAmount(draftSlip.deductions?.tds, draftSlip.currency)} / {formatAmount(draftSlip.deductions?.loanDeduction, draftSlip.currency)}</Col>
            </Row>
            <Button size="sm" variant="outline-primary" onClick={downloadDraftSlip}>Download Salary Slip Preview</Button>
          </Card.Body>
        </Card>
      </Card.Body>
    </Card>
  );
}
