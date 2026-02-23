import React from "react";
import { Card, Table } from "@themesberg/react-bootstrap";
import { useAuth } from "../../context/AuthContext";

export default function Salary() {
  const { currentUser, salarySlips, users } = useAuth();

  const visibleSlips =
    currentUser.role === "admin"
      ? salarySlips
      : salarySlips.filter((slip) => slip.userId === currentUser.id);

  const getEmployeeName = (userId) => users.find((u) => u.id === userId)?.name || "Unknown";

  return (
    <Card border="light" className="shadow-sm">
      <Card.Header>
        <h5 className="mb-0">Salary Slips</h5>
      </Card.Header>
      <Card.Body>
        <Table responsive>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Month</th>
              <th>Basic</th>
              <th>Allowances</th>
              <th>Deductions</th>
              <th>Net Pay</th>
            </tr>
          </thead>
          <tbody>
            {visibleSlips.map((slip) => (
              <tr key={slip.id}>
                <td>{getEmployeeName(slip.userId)}</td>
                <td>{slip.month}</td>
                <td>${slip.basic}</td>
                <td>${slip.allowances}</td>
                <td>${slip.deductions}</td>
                <td><strong>${slip.net}</strong></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
