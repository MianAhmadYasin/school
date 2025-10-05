import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Clock } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { Table, TableRow, TableCell } from './Table';
import { Modal } from './Modal';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type FeeRecord = Database['public']['Tables']['fee_records']['Row'];

interface StudentFeesProps {
  studentId: string;
}

export function StudentFees({ studentId }: StudentFeesProps) {
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<{ id: string; year_name: string; }[]>([]);

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    try {
      const [feesRes, yearsRes] = await Promise.all([
        supabase
          .from('fee_records')
          .select('*, academic_years(year_name)')
          .eq('student_id', studentId)
          .order('month', { ascending: true }),
        supabase
          .from('academic_years')
          .select('id, year_name')
          .eq('is_current', true)
      ]);

      if (feesRes.error) throw feesRes.error;
      if (yearsRes.error) throw yearsRes.error;

      setFees(feesRes.data || []);
      setAcademicYears(yearsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card title="Fee Records">
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Due</p>
                <p className="text-2xl font-bold text-blue-900">
                  Rs. {fees.reduce((sum, fee) => sum + (fee.amount - fee.paid_amount), 0)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Paid This Month</p>
                <p className="text-2xl font-bold text-green-900">
                  Rs. {fees
                    .filter(f => new Date(f.payment_date || '').getMonth() === new Date().getMonth())
                    .reduce((sum, fee) => sum + fee.paid_amount, 0)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Upcoming Due</p>
                <p className="text-2xl font-bold text-amber-900">
                  Rs. {fees
                    .filter(f => new Date(f.due_date) > new Date() && f.status !== 'paid')
                    .reduce((sum, fee) => sum + (fee.amount - fee.paid_amount), 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Fee Records Table */}
        <div className="mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { setSelectedFee(null); setShowModal(true); }}>
              Add Fee Record
            </Button>
          </div>

          <Table headers={['Month', 'Amount', 'Paid', 'Due Date', 'Status', 'Actions']}>
            {fees.length === 0 ? (
              <TableRow>
                <TableCell className="text-center text-gray-500">
                  No fee records found
                </TableCell>
              </TableRow>
            ) : (
              fees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.month}</TableCell>
                  <TableCell>Rs. {fee.amount}</TableCell>
                  <TableCell>Rs. {fee.paid_amount}</TableCell>
                  <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fee.status)}`}>
                      {fee.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => { setSelectedFee(fee); setShowModal(true); }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Record Payment
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </Table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedFee(null); }}
        title={selectedFee ? 'Record Payment' : 'Add Fee Record'}
      >
        <FeeForm
          fee={selectedFee}
          studentId={studentId}
          academicYears={academicYears}
          onClose={() => { setShowModal(false); setSelectedFee(null); loadData(); }}
        />
      </Modal>
    </Card>
  );
}

interface FeeFormProps {
  fee: FeeRecord | null;
  studentId: string;
  academicYears: { id: string; year_name: string; }[];
  onClose: () => void;
}

function FeeForm({ fee, studentId, academicYears, onClose }: FeeFormProps) {
  const [formData, setFormData] = useState({
    month: fee?.month || new Date().toISOString().split('-').slice(0, 2).join('-'),
    amount: fee?.amount || 0,
    paid_amount: fee?.paid_amount || 0,
    due_date: fee?.due_date || new Date().toISOString().split('T')[0],
    payment_date: fee?.payment_date || '',
    payment_method: fee?.payment_method || '',
    receipt_number: fee?.receipt_number || '',
    academic_year_id: fee?.academic_year_id || academicYears[0]?.id,
    status: fee?.status || 'pending',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const status = formData.paid_amount === 0 ? 'pending' :
        formData.paid_amount < formData.amount ? 'partial' :
        'paid';

      const data = {
        ...formData,
        status,
        student_id: studentId,
      };

      if (fee) {
        const { error } = await supabase
          .from('fee_records')
          .update(data)
          .eq('id', fee.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('fee_records')
          .insert([data]);
        if (error) throw error;
      }
      onClose();
    } catch (error) {
      console.error('Error saving fee record:', error);
      alert('Failed to save fee record');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
          <select
            value={formData.academic_year_id}
            onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>{year.year_name}</option>
            ))}
          </select>
        </div>
        <Input
          label="Month"
          type="month"
          value={formData.month}
          onChange={(e) => setFormData({ ...formData, month: e.target.value })}
          required
        />
        <Input
          label="Total Amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
          required
        />
        <Input
          label="Paid Amount"
          type="number"
          value={formData.paid_amount}
          onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) })}
          max={formData.amount}
          required
        />
        <Input
          label="Due Date"
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          required
        />
        {formData.paid_amount > 0 && (
          <>
            <Input
              label="Payment Date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Method</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <Input
              label="Receipt Number"
              value={formData.receipt_number}
              onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
            />
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : fee ? 'Update Record' : 'Add Record'}
        </Button>
      </div>
    </form>
  );
}