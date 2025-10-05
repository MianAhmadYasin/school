import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../contexts/AuthContext';

interface FeeStructure {
  id: string;
  class: string;
  type: 'tuition' | 'admission' | 'exam' | 'transport' | 'other';
  amount: number;
  dueDate: string;
  frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time';
}

interface FeePayment {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  feeType: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paidAmount: number;
}

export function FeeManagement() {
  const { hasPermission } = useAuth();
  const [isAddFeeModalOpen, setIsAddFeeModalOpen] = useState(false);
  const [isCollectFeeModalOpen, setIsCollectFeeModalOpen] = useState(false);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageFinances = hasPermission('manage_finances');

  const handleAddFeeStructure = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      // Implement fee structure creation logic
      setIsAddFeeModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add fee structure');
    } finally {
      setLoading(false);
    }
  };

  const handleCollectFee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPayment) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      // Implement fee collection logic
      setIsCollectFeeModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to collect fee');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalFeeCollected: feePayments.reduce((sum, payment) => sum + payment.paidAmount, 0),
    pendingFees: feePayments.reduce(
      (sum, payment) => sum + (payment.amount - payment.paidAmount),
      0
    ),
    overduePayments: feePayments.filter((payment) => payment.status === 'overdue').length,
    collectionRate:
      (feePayments.reduce((sum, payment) => sum + payment.paidAmount, 0) /
        feePayments.reduce((sum, payment) => sum + payment.amount, 0)) *
      100,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
        {canManageFinances && (
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsAddFeeModalOpen(true)}>
              Add Fee Structure
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Fee Collected</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            ${stats.totalFeeCollected.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Pending Fees</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            ${stats.pendingFees.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Overdue Payments</h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">
            {stats.overduePayments}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Collection Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            {Math.round(stats.collectionRate)}%
          </p>
        </Card>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-4">Fee Structures</h2>
          <div className="rounded-lg border bg-white">
            <Table
              headers={[
                'Class',
                'Fee Type',
                'Amount',
                'Frequency',
                'Due Date',
                'Actions',
              ]}
            >
              {feeStructures.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.class}</TableCell>
                  <TableCell className="capitalize">{fee.type}</TableCell>
                  <TableCell>${fee.amount.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{fee.frequency}</TableCell>
                  <TableCell>{fee.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Fee Payments</h2>
          <div className="rounded-lg border bg-white">
            <Table
              headers={[
                'Student',
                'Class',
                'Fee Type',
                'Amount',
                'Due Date',
                'Status',
                'Actions',
              ]}
            >
              {feePayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.studentName}</TableCell>
                  <TableCell>{payment.class}</TableCell>
                  <TableCell>{payment.feeType}</TableCell>
                  <TableCell>
                    ${payment.paidAmount.toLocaleString()} /
                    ${payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{payment.dueDate}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        payment.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : payment.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {payment.status !== 'paid' && (
                        <button
                          className="text-green-600 hover:text-green-800"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setIsCollectFeeModalOpen(true);
                          }}
                        >
                          Collect
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-800">
                        Details
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddFeeModalOpen}
        onClose={() => setIsAddFeeModalOpen(false)}
        title="Add Fee Structure"
      >
        <form onSubmit={handleAddFeeStructure} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Class
              </label>
              <select
                name="class"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {/* Add class options */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fee Type
              </label>
              <select
                name="type"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="tuition">Tuition Fee</option>
                <option value="admission">Admission Fee</option>
                <option value="exam">Exam Fee</option>
                <option value="transport">Transport Fee</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <Input
                name="amount"
                type="number"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Frequency
              </label>
              <select
                name="frequency"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
                <option value="one-time">One Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <Input name="dueDate" type="date" required />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddFeeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Fee Structure'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCollectFeeModalOpen}
        onClose={() => setIsCollectFeeModalOpen(false)}
        title="Collect Fee Payment"
      >
        <form onSubmit={handleCollectFee} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {selectedPayment && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Student
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedPayment.studentName}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Amount
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  ${selectedPayment.amount.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount Paid
                </label>
                <Input
                  name="paidAmount"
                  type="number"
                  required
                  min="0"
                  max={selectedPayment.amount - selectedPayment.paidAmount}
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Date
                </label>
                <Input
                  name="paidDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
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
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Payment</option>
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
              onClick={() => setIsCollectFeeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Collect Payment'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}