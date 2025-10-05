import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../contexts/AuthContext';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface FinanceStats {
  totalIncome: number;
  totalExpenses: number;
  pendingPayments: number;
  monthlyBalance: number;
}

export function FinanceManagement() {
  const { hasPermission } = useAuth();
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [stats, setStats] = useState<FinanceStats>({
    totalIncome: 0,
    totalExpenses: 0,
    pendingPayments: 0,
    monthlyBalance: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const canManageFinances = hasPermission('manage_finances');

  const handleAddTransaction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Implement transaction creation logic
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Finance Management</h1>
        {canManageFinances && (
          <Button onClick={() => setIsAddTransactionModalOpen(true)}>
            Add Transaction
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Income</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            ${stats.totalIncome.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Expenses</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            ${stats.totalExpenses.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Pending Payments</h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">
            ${stats.pendingPayments.toLocaleString()}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Monthly Balance</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            ${stats.monthlyBalance.toLocaleString()}
          </p>
        </Card>
      </div>

      <div className="rounded-lg border bg-white">
        <Table
          headers={[
            'Date',
            'Description',
            'Amount',
            'Type',
            'Category',
            'Status',
            'Actions',
          ]}
        >
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{transaction.date}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell
                className={
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }
              >
                ${transaction.amount.toLocaleString()}
              </TableCell>
              <TableCell className="capitalize">{transaction.type}</TableCell>
              <TableCell>{transaction.category}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                    transaction.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {transaction.status}
                </span>
              </TableCell>
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

      <Modal
        isOpen={isAddTransactionModalOpen}
        onClose={() => setIsAddTransactionModalOpen(false)}
        title="Add New Transaction"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              Transaction Type
            </label>
            <select
              id="type"
              name="type"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <Input
              id="amount"
              name="amount"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <Input
              id="description"
              name="description"
              type="text"
              required
              placeholder="Transaction description"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="fees">School Fees</option>
              <option value="salary">Salary</option>
              <option value="supplies">Supplies</option>
              <option value="utilities">Utilities</option>
              <option value="maintenance">Maintenance</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddTransactionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Transaction</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}