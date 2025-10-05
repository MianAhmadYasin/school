import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Users,
  UserCheck,
  UserX,
  Award
} from 'lucide-react';

interface Student {
  id: string;
  admissionNumber: string;
  fullName: string;
  class: string;
  section: string;
  parentName: string;
  contactNumber: string;
  email: string;
  status: 'active' | 'inactive' | 'graduated';
  joiningDate: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  bloodGroup?: string;
  emergencyContact?: string;
}

interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  graduatedStudents: number;
}

export function StudentManagement() {
  const { hasPermission } = useAuth();
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  const canManageStudents = hasPermission('manage_students');

  // Mock data for demonstration
  useEffect(() => {
    const mockStudents: Student[] = [
      {
        id: '1',
        admissionNumber: 'ADM-2024-001',
        fullName: 'Ahmed Ali Khan',
        class: '10',
        section: 'A',
        parentName: 'Muhammad Ali Khan',
        contactNumber: '+92-300-1234567',
        email: 'ahmed.ali@email.com',
        status: 'active',
        joiningDate: '2024-01-15',
        address: 'House 123, Street 45, Karachi',
        dateOfBirth: '2008-05-15',
        gender: 'male',
        bloodGroup: 'O+',
        emergencyContact: '+92-300-7654321'
      },
      {
        id: '2',
        admissionNumber: 'ADM-2024-002',
        fullName: 'Fatima Zahra',
        class: '9',
        section: 'B',
        parentName: 'Hassan Ahmed',
        contactNumber: '+92-301-2345678',
        email: 'fatima.zahra@email.com',
        status: 'active',
        joiningDate: '2024-01-20',
        address: 'Apartment 456, Block 7, Lahore',
        dateOfBirth: '2009-03-22',
        gender: 'female',
        bloodGroup: 'A+',
        emergencyContact: '+92-301-8765432'
      },
      {
        id: '3',
        admissionNumber: 'ADM-2023-150',
        fullName: 'Muhammad Hassan',
        class: '11',
        section: 'A',
        parentName: 'Abdul Rahman',
        contactNumber: '+92-302-3456789',
        email: 'muhammad.hassan@email.com',
        status: 'active',
        joiningDate: '2023-08-10',
        address: 'Villa 789, Phase 2, Islamabad',
        dateOfBirth: '2007-11-08',
        gender: 'male',
        bloodGroup: 'B+',
        emergencyContact: '+92-302-9876543'
      },
      {
        id: '4',
        admissionNumber: 'ADM-2022-089',
        fullName: 'Ayesha Siddiqui',
        class: '12',
        section: 'A',
        parentName: 'Dr. Muhammad Siddiqui',
        contactNumber: '+92-303-4567890',
        email: 'ayesha.siddiqui@email.com',
        status: 'graduated',
        joiningDate: '2022-01-10',
        address: 'House 321, Gulberg, Lahore',
        dateOfBirth: '2006-07-14',
        gender: 'female',
        bloodGroup: 'AB+',
        emergencyContact: '+92-303-0987654'
      }
    ];

    setStudents(mockStudents);
    setFilteredStudents(mockStudents);
  }, []);

  // Filter students based on search and filters
  useEffect(() => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.contactNumber.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // Class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter(student => student.class === classFilter);
    }

    setFilteredStudents(filtered);
  }, [students, searchTerm, statusFilter, classFilter]);

  const studentStats: StudentStats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    inactiveStudents: students.filter(s => s.status === 'inactive').length,
    graduatedStudents: students.filter(s => s.status === 'graduated').length,
  };

  const handleAddStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const newStudent: Student = {
        id: Date.now().toString(),
        admissionNumber: formData.get('admissionNumber') as string,
        fullName: formData.get('fullName') as string,
        class: formData.get('class') as string,
        section: formData.get('section') as string,
        parentName: formData.get('parentName') as string,
        contactNumber: formData.get('contactNumber') as string,
        email: formData.get('email') as string,
        status: 'active',
        joiningDate: new Date().toISOString().split('T')[0],
        address: formData.get('address') as string,
        dateOfBirth: formData.get('dateOfBirth') as string,
        gender: formData.get('gender') as 'male' | 'female',
        bloodGroup: formData.get('bloodGroup') as string,
        emergencyContact: formData.get('emergencyContact') as string,
      };

      setStudents(prev => [...prev, newStudent]);
      setIsAddStudentModalOpen(false);
      
      // Reset form
      (event.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingStudent) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const updatedStudent: Student = {
        ...editingStudent,
        admissionNumber: formData.get('admissionNumber') as string,
        fullName: formData.get('fullName') as string,
        class: formData.get('class') as string,
        section: formData.get('section') as string,
        parentName: formData.get('parentName') as string,
        contactNumber: formData.get('contactNumber') as string,
        email: formData.get('email') as string,
        address: formData.get('address') as string,
        dateOfBirth: formData.get('dateOfBirth') as string,
        gender: formData.get('gender') as 'male' | 'female',
        bloodGroup: formData.get('bloodGroup') as string,
        emergencyContact: formData.get('emergencyContact') as string,
      };

      setStudents(prev => prev.map(s => s.id === editingStudent.id ? updatedStudent : s));
      setIsEditStudentModalOpen(false);
      setEditingStudent(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete student');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'graduated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck className="w-4 h-4" />;
      case 'inactive':
        return <UserX className="w-4 h-4" />;
      case 'graduated':
        return <Award className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-1">Manage student records and information</p>
        </div>
        {canManageStudents && (
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button variant="secondary" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import
            </Button>
            <Button onClick={() => setIsAddStudentModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
          </div>
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
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Total Students</h3>
              <p className="text-2xl font-semibold text-gray-900">{studentStats.totalStudents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Active Students</h3>
              <p className="text-2xl font-semibold text-gray-900">{studentStats.activeStudents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserX className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Inactive Students</h3>
              <p className="text-2xl font-semibold text-gray-900">{studentStats.inactiveStudents}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Graduated</h3>
              <p className="text-2xl font-semibold text-gray-900">{studentStats.graduatedStudents}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Classes</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Students Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table
            headers={[
              'Admission #',
              'Student Name',
              'Class & Section',
              'Parent Name',
              'Contact',
              'Status',
              'Actions'
            ]}
          >
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.admissionNumber}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{student.fullName}</div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                    <span>Class {student.class}-{student.section}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">{student.parentName}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {student.contactNumber}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">{student.contactNumber}</div>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                    {getStatusIcon(student.status)}
                    {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingStudent(student);
                        setIsEditStudentModalOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canManageStudents && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      </Card>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        title="Add New Student"
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Admission Number</label>
              <Input name="admissionNumber" type="text" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <Input name="fullName" type="text" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class</label>
              <select
                name="class"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Section</label>
              <select
                name="section"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Parent Name</label>
              <Input name="parentName" type="text" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Number</label>
              <Input name="contactNumber" type="tel" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <Input name="email" type="email" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <Input name="dateOfBirth" type="date" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Group</label>
              <select
                name="bloodGroup"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
              <Input name="emergencyContact" type="tel" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              name="address"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddStudentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditStudentModalOpen}
        onClose={() => {
          setIsEditStudentModalOpen(false);
          setEditingStudent(null);
        }}
        title="Edit Student"
      >
        {editingStudent && (
          <form onSubmit={handleEditStudent} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Admission Number</label>
                <Input name="admissionNumber" type="text" defaultValue={editingStudent.admissionNumber} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <Input name="fullName" type="text" defaultValue={editingStudent.fullName} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Class</label>
                <select
                  name="class"
                  required
                  defaultValue={editingStudent.class}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="9">Class 9</option>
                  <option value="10">Class 10</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <select
                  name="section"
                  required
                  defaultValue={editingStudent.section}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Name</label>
                <Input name="parentName" type="text" defaultValue={editingStudent.parentName} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <Input name="contactNumber" type="tel" defaultValue={editingStudent.contactNumber} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input name="email" type="email" defaultValue={editingStudent.email} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <Input name="dateOfBirth" type="date" defaultValue={editingStudent.dateOfBirth} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  required
                  defaultValue={editingStudent.gender}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                <select
                  name="bloodGroup"
                  defaultValue={editingStudent.bloodGroup}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                <Input name="emergencyContact" type="tel" defaultValue={editingStudent.emergencyContact} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                name="address"
                rows={3}
                defaultValue={editingStudent.address}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditStudentModalOpen(false);
                  setEditingStudent(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Student'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}