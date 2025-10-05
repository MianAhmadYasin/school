import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../contexts/AuthContext';

interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  joinDate: string;
  basicSalary: number;
  allowances: {
    type: string;
    amount: number;
  }[];
  deductions: {
    type: string;
    amount: number;
  }[];
}

interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'paid' | 'pending' | 'processing';
  paymentDate?: string;
}

export function SalaryManagement() {
  const { hasPermission } = useAuth();
  const [isProcessSalaryModalOpen, setIsProcessSalaryModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageFinances = hasPermission('manage_finances');

  const handleProcessSalary = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEmployee) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      // Implement salary processing logic
      setIsProcessSalaryModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process salary');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalSalaryPaid: salaryPayments.reduce(
      (sum, payment) => (payment.status === 'paid' ? sum + payment.netSalary : sum),
      0
    ),
    pendingPayments: salaryPayments.filter(
      (payment) => payment.status === 'pending'
    ).length,
    totalEmployees: employees.length,
    averageSalary:
      employees.reduce((sum, emp) => sum + emp.basicSalary, 0) / employees.length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Salary Management</h1>
        <div className="flex items-center gap-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border-gray-300"
          />
          {canManageFinances && (
            <Button onClick={() => setIsProcessSalaryModalOpen(true)}>
              Process Salary
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Salary Paid</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            ${stats.totalSalaryPaid.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Pending Payments</h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">
            {stats.pendingPayments}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Employees</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            {stats.totalEmployees}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Average Salary</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-600">
            ${stats.averageSalary.toLocaleString()}
          </p>
        </Card>
      </div>

      <div className="rounded-lg border bg-white">
        <Table
          headers={[
            'Employee',
            'Designation',
            'Basic Salary',
            'Allowances',
            'Deductions',
            'Net Salary',
            'Status',
            'Actions',
          ]}
        >
          {salaryPayments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.employeeName}</TableCell>
              <TableCell>
                {
                  employees.find((emp) => emp.id === payment.employeeId)
                    ?.designation
                }
              </TableCell>
              <TableCell>${payment.basicSalary.toLocaleString()}</TableCell>
              <TableCell>${payment.allowances.toLocaleString()}</TableCell>
              <TableCell>${payment.deductions.toLocaleString()}</TableCell>
              <TableCell>${payment.netSalary.toLocaleString()}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                    payment.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : payment.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {payment.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button className="text-blue-600 hover:text-blue-800">
                    Details
                  </button>
                  {payment.status === 'pending' && (
                    <button className="text-green-600 hover:text-green-800">
                      Process
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </div>

      <Modal
        isOpen={isProcessSalaryModalOpen}
        onClose={() => setIsProcessSalaryModalOpen(false)}
        title="Process Salary Payment"
      >
        <form onSubmit={handleProcessSalary} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Employee
            </label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const employee = employees.find((emp) => emp.id === e.target.value);
                setSelectedEmployee(employee || null);
              }}
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.designation}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Basic Salary
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  ${selectedEmployee.basicSalary.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Allowances
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  $
                  {selectedEmployee.allowances
                    .reduce((sum, allow) => sum + allow.amount, 0)
                    .toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Deductions
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  $
                  {selectedEmployee.deductions
                    .reduce((sum, deduct) => sum + deduct.amount, 0)
                    .toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Net Salary
                </label>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  $
                  {(
                    selectedEmployee.basicSalary +
                    selectedEmployee.allowances.reduce(
                      (sum, allow) => sum + allow.amount,
                      0
                    ) -
                    selectedEmployee.deductions.reduce(
                      (sum, deduct) => sum + deduct.amount,
                      0
                    )
                  ).toLocaleString()}
                </p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <select
                  name="paymentMethod"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsProcessSalaryModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedEmployee}>
              {loading ? 'Processing...' : 'Process Salary'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}