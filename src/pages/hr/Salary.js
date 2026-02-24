import React, { useMemo } from "react";
import { Alert, Button, Card, Table } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { getPeriodKeyFromSlip } from "../../utils/salarySlip";

const COMPANY_NAME = "Ingenious HR Portal Pvt. Ltd.";

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
  const employeeProfile = slip.employeeProfile || {};
  const currency = slip.currency || employeeProfile.currency || "USD";
  const deductions =
    typeof slip.deductions === "object" && slip.deductions !== null
      ? {
          pf: Number(slip.deductions.pf || 0),
          esi: Number(slip.deductions.esi || 0),
          professionalTax: Number(slip.deductions.professionalTax || 0),
          tds: Number(slip.deductions.tds || 0),
          loanDeduction: Number(slip.deductions.loanDeduction || 0),
          total: Number(
            slip.deductions.total ??
            slip.deductions.pf + slip.deductions.esi + slip.deductions.professionalTax + slip.deductions.tds + slip.deductions.loanDeduction
          )
        }
      : { pf: 0, esi: 0, professionalTax: 0, tds: 0, loanDeduction: 0, total: 0 };

  return {
    ...slip,
    companyName: slip.companyName || COMPANY_NAME,
    currency,
    employeeProfile,
    deductions,
    periodKey: getPeriodKeyFromSlip(slip)
  };
};

const getDownloadMarkup = (slip, employeeName) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Salary Slip - ${employeeName} - ${slip.month}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
    h1, h2 { margin: 0; }
    .muted { color: #64748b; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
    th { background: #f8fafc; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 6px; }
    .total { font-weight: 700; }
  </style>
</head>
<body>
  <h1>${slip.companyName}</h1>
  <p class="muted">Salary Slip for ${slip.month}</p>
  <h2 style="margin:10px 0 0;font-size:18px;">1. Employee Details</h2>
  <div class="two-col">
    <div><strong>Employee:</strong> ${employeeName}</div>
    <div><strong>Generated On:</strong> ${new Date(slip.generatedOn || Date.now()).toLocaleDateString()}</div>
  </div>
  <div class="two-col">
    <div><strong>Employee Code:</strong> ${slip.employeeProfile?.employeeCode || "-"}</div>
    <div><strong>Currency:</strong> ${slip.currency || "USD"}</div>
  </div>
  <div class="two-col">
    <div><strong>PF Number:</strong> ${slip.employeeProfile?.pfNumber || "-"}</div>
    <div><strong>ESI Number:</strong> ${slip.employeeProfile?.esiNumber || "-"}</div>
  </div>
  <div class="two-col">
    <div><strong>Bank:</strong> ${slip.employeeProfile?.bankName || "-"}</div>
    <div><strong>A/C:</strong> ${slip.employeeProfile?.accountNumber || "-"} (${slip.employeeProfile?.ifscCode || "-"})</div>
  </div>
  <h2 style="margin:14px 0 0;font-size:18px;">2. Attendance Summary</h2>
  <div class="two-col">
    <div><strong>Working Days:</strong> ${slip.attendanceSummary?.workingDays ?? "-"}</div>
    <div><strong>Paid Days:</strong> ${slip.attendanceSummary?.paidDays ?? "-"}</div>
  </div>
  <h2 style="margin:14px 0 0;font-size:18px;">3. Earnings</h2>
  <table>
    <thead><tr><th>Earnings</th><th>Amount</th></tr></thead>
    <tbody>
      <tr><td>Basic</td><td>${formatAmount(slip.earnings?.basic, slip.currency)}</td></tr>
      <tr><td>HRA</td><td>${formatAmount(slip.earnings?.hra, slip.currency)}</td></tr>
      <tr><td>Conveyance Allowance</td><td>${formatAmount(slip.earnings?.conveyance, slip.currency)}</td></tr>
      <tr><td>Medical Allowance</td><td>${formatAmount(slip.earnings?.medical, slip.currency)}</td></tr>
      <tr><td>Special Allowance</td><td>${formatAmount(slip.earnings?.specialAllowance, slip.currency)}</td></tr>
      <tr><td>Other Allowance</td><td>${formatAmount(slip.earnings?.otherAllowance, slip.currency)}</td></tr>
      <tr class="total"><td>Gross Earnings</td><td>${formatAmount(slip.earnings?.gross, slip.currency)}</td></tr>
    </tbody>
  </table>
  <h2 style="margin:14px 0 0;font-size:18px;">4. Deductions</h2>
  <table>
    <thead><tr><th>Deductions</th><th>Amount</th></tr></thead>
    <tbody>
      <tr><td>PF</td><td>${formatAmount(slip.deductions?.pf, slip.currency)}</td></tr>
      <tr><td>ESI</td><td>${formatAmount(slip.deductions?.esi, slip.currency)}</td></tr>
      <tr><td>Professional Tax</td><td>${formatAmount(slip.deductions?.professionalTax, slip.currency)}</td></tr>
      <tr><td>TDS</td><td>${formatAmount(slip.deductions?.tds, slip.currency)}</td></tr>
      <tr><td>Loan Deduction</td><td>${formatAmount(slip.deductions?.loanDeduction, slip.currency)}</td></tr>
      <tr class="total"><td>Total Deductions</td><td>${formatAmount(slip.deductions?.total, slip.currency)}</td></tr>
    </tbody>
  </table>
  <h2 style="margin-top:14px;">5. Net Salary: ${formatAmount(slip.net, slip.currency)}</h2>
</body>
</html>`;

export default function Salary() {
  const { currentUser, salarySlips, users } = useAuth();

  const userMap = useMemo(
    () =>
      users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}),
    [users]
  );

  const visibleSlips = useMemo(() => {
    const scoped =
      currentUser.role === "admin"
        ? salarySlips
        : salarySlips.filter((slip) => slip.userId === currentUser.id);

    return scoped
      .map(normalizeSlip)
      .sort((a, b) => (b.periodKey || b.month).localeCompare(a.periodKey || a.month));
  }, [salarySlips, currentUser]);

  const downloadSlip = (slip) => {
    const employeeName = userMap[slip.userId]?.name || "Employee";
    const markup = getDownloadMarkup(slip, employeeName);
    const blob = new Blob([markup], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `salary-slip-${employeeName.toLowerCase().replace(/\s+/g, "-")}-${slip.month.replace(/\s+/g, "-")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <Card border="light" className="shadow-sm">
      <Card.Header>
        <h5 className="mb-0">Salary Slip</h5>
      </Card.Header>
      <Card.Body>
        <Alert variant="info" className="mb-3">
          Employees can download salary slips from this page. Slips are generated from saved HR salary setup details.
        </Alert>
        <Table responsive>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Emp Code</th>
              <th>Month</th>
              <th>Currency</th>
              <th>PF / ESI</th>
              <th>Net Salary</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {visibleSlips.map((slip) => (
              <tr key={slip.id}>
                <td>{userMap[slip.userId]?.name || "Unknown"}</td>
                <td>{slip.employeeProfile?.employeeCode || "-"}</td>
                <td>{slip.month}</td>
                <td>{slip.currency || "USD"}</td>
                <td>{formatAmount(slip.deductions.pf, slip.currency)} / {formatAmount(slip.deductions.esi, slip.currency)}</td>
                <td><strong>{formatAmount(slip.net, slip.currency)}</strong></td>
                <td>
                  <Button size="sm" variant="outline-primary" onClick={() => downloadSlip(slip)}>
                    Download Slip
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        {visibleSlips.length === 0 ? <p className="mb-0 text-gray">No salary slips available yet.</p> : null}
      </Card.Body>
    </Card>
  );
}
