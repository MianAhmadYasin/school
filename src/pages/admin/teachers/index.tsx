import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Table } from '../../../components/ui/Table';
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../../lib/teachers';
import type { TeacherWithDetails } from '../../../lib/teachers';

export function TeacherManagement() {
  const { hasPermission } = useAuth();
  const [teachers, setTeachers] = useState<TeacherWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const canManageTeachers = hasPermission('manage_teachers');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await getTeachers();
      setTeachers(data);
    } catch (err) {
      setError('Failed to fetch teachers');
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      setLoading(true);
      const teacherData = {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        employee_number: formData.get('employeeNumber') as string,
        phone: formData.get('phone') as string,
        qualification: formData.get('qualification') as string,
        department: formData.get('department') as string,
        joining_date: formData.get('joiningDate') as string,
        salary: parseFloat(formData.get('salary') as string),
        address: formData.get('address') as string,
        status: 'active' as const,
      };

      await createTeacher(teacherData);
      await fetchTeachers();
      setIsAddModalOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to add teacher');
      console.error('Error adding teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTeacher) return;

    const formData = new FormData(e.currentTarget);
    
    try {
      setLoading(true);
      const teacherData = {
        first_name: formData.get('firstName') as string,
        last_name: formData.get('lastName') as string,
        employee_number: formData.get('employeeNumber') as string,
        phone: formData.get('phone') as string,
        qualification: formData.get('qualification') as string,
        department: formData.get('department') as string,
        joining_date: formData.get('joiningDate') as string,
        salary: parseFloat(formData.get('salary') as string),
        address: formData.get('address') as string,
        status: 'active' as const,
      };

      await updateTeacher(editingTeacher.id, teacherData);
      await fetchTeachers();
      setIsEditModalOpen(false);
      setEditingTeacher(null);
      setError(null);
    } catch (err) {
      setError('Failed to update teacher');
      console.error('Error updating teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    try {
      setLoading(true);
      await deleteTeacher(id);
      await fetchTeachers();
      setError(null);
    } catch (err) {
      setError('Failed to delete teacher');
      console.error('Error deleting teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.qualification.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const teacherStats = {
    total: teachers.length,
    active: teachers.filter(t => t.status === 'active').length,
    onLeave: teachers.filter(t => t.status === 'on_leave').length,
    resigned: teachers.filter(t => t.status === 'resigned').length,
  };

  if (loading && teachers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teachers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Teacher Management</h1>
        {canManageTeachers && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            Add New Teacher
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Teachers</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {teacherStats.total}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Active</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {teacherStats.active}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">On Leave</h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">
            {teacherStats.onLeave}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Resigned</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            {teacherStats.resigned}
          </p>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Teachers Table */}
      <Card>
        <Table
          data={filteredTeachers}
          columns={[
            { key: 'name', label: 'Name', render: (teacher) => `${teacher.first_name} ${teacher.last_name}` },
            { key: 'employee_number', label: 'Employee #' },
            { key: 'phone', label: 'Phone' },
            { key: 'qualification', label: 'Qualification' },
            { key: 'department', label: 'Department' },
            { key: 'joining_date', label: 'Joining Date' },
            { key: 'salary', label: 'Salary', render: (teacher) => `$${teacher.salary?.toLocaleString() || '0'}` },
            { key: 'status', label: 'Status', render: (teacher) => (
              <span className={`px-2 py-1 text-xs rounded-full ${
                teacher.status === 'active' ? 'bg-green-100 text-green-800' :
                teacher.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {teacher.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
              </span>
            )},
            { key: 'actions', label: 'Actions', render: (teacher) => (
              <div className="flex items-center gap-2">
                {canManageTeachers && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingTeacher(teacher);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTeacher(teacher.id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            )}
          ]}
        />
      </Card>

      {/* Add Teacher Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Teacher"
      >
        <form onSubmit={handleAddTeacher} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <Input name="firstName" type="text" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <Input name="lastName" type="text" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee Number</label>
              <Input name="employeeNumber" type="text" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <Input name="phone" type="tel" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Qualification</label>
              <Input name="qualification" type="text" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                name="department"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                <option value="academic">Academic</option>
                <option value="administration">Administration</option>
                <option value="library">Library</option>
                <option value="laboratory">Laboratory</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Joining Date</label>
              <Input name="joiningDate" type="date" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Salary</label>
              <Input name="salary" type="number" required min="0" step="0.01" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <Input name="address" type="text" required />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Teacher'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Teacher Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTeacher(null);
        }}
        title="Edit Teacher"
      >
        {editingTeacher && (
          <form onSubmit={handleEditTeacher} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <Input name="firstName" type="text" defaultValue={editingTeacher.first_name} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <Input name="lastName" type="text" defaultValue={editingTeacher.last_name} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee Number</label>
                <Input name="employeeNumber" type="text" defaultValue={editingTeacher.employee_number} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <Input name="phone" type="tel" defaultValue={editingTeacher.phone} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Qualification</label>
                <Input name="qualification" type="text" defaultValue={editingTeacher.qualification} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  name="department"
                  required
                  defaultValue={editingTeacher.department}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  <option value="academic">Academic</option>
                  <option value="administration">Administration</option>
                  <option value="library">Library</option>
                  <option value="laboratory">Laboratory</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                <Input name="joiningDate" type="date" defaultValue={editingTeacher.joining_date} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Salary</label>
                <Input name="salary" type="number" defaultValue={editingTeacher.salary} required min="0" step="0.01" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <Input name="address" type="text" defaultValue={editingTeacher.address} required />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTeacher(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Teacher'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
