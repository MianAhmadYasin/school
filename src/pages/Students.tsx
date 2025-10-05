import React, { useEffect, useState } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, Eye, Download } from 'lucide-react';
import { ParentContacts } from '../components/ui/ParentContacts';
import { StudentDocuments } from '../components/ui/StudentDocuments';
import { StudentFees } from '../components/ui/StudentFees';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { exportToExcel } from '../utils/excelParser';

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  father_name: string;
  mother_name: string | null;
  date_of_birth: string;
  gender: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  cnic: string | null;
  admission_date: string;
  current_class_id: string | null;
  current_section_id: string | null;
  status: string;
  classes?: { class_name: string };
  sections?: { section_name: string };
}

export function Students() {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsRes, classesRes, sectionsRes] = await Promise.all([
        supabase
          .from('students')
          .select(`
            *,
            classes:current_class_id(class_name),
            sections:current_section_id(section_name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('classes').select('*').eq('is_active', true).order('class_order'),
        supabase.from('sections').select('*, classes(class_name)').eq('is_active', true),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (classesRes.error) throw classesRes.error;
      if (sectionsRes.error) throw sectionsRes.error;

      setStudents(studentsRes.data || []);
      setClasses(classesRes.data || []);
      setSections(sectionsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const handleExport = () => {
    const exportData = filteredStudents.map((s) => ({
      'Admission Number': s.admission_number,
      'First Name': s.first_name,
      'Last Name': s.last_name,
      'Father Name': s.father_name,
      'Mother Name': s.mother_name || '',
      'Date of Birth': s.date_of_birth,
      Gender: s.gender,
      Class: s.classes?.class_name || '',
      Section: s.sections?.section_name || '',
      Phone: s.phone || '',
      Email: s.email || '',
      Status: s.status,
    }));

    exportToExcel(exportData, 'Students_List');
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.father_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p>Loading students...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1">Manage student records and information</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-5 h-5 mr-2" />
            Export
          </Button>
          {isAdmin && (
            <Button onClick={() => { setSelectedStudent(null); setShowModal(true); }}>
              <Plus className="w-5 h-5 mr-2" />
              Add Student
            </Button>
          )}
        </div>
      </div>

      <Card>
        <div className="mb-4 flex gap-4 items-end">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, admission number, father name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="promoted">Promoted</option>
              <option value="transferred">Transferred</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredStudents.length} of {students.length} students
        </div>

        <Table headers={['Admission No', 'Student Name', 'Father Name', 'Class', 'Gender', 'Contact', 'Status', 'Actions']}>
          {filteredStudents.length === 0 ? (
            <TableRow>
              <TableCell className="text-center text-gray-500" colSpan={8}>
                No students found
              </TableCell>
            </TableRow>
          ) : (
            filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.admission_number}</TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">{student.first_name} {student.last_name}</div>
                </TableCell>
                <TableCell>{student.father_name}</TableCell>
                <TableCell>
                  {student.classes?.class_name || '-'} {student.sections?.section_name || ''}
                </TableCell>
                <TableCell className="capitalize">{student.gender}</TableCell>
                <TableCell>{student.phone || '-'}</TableCell>
                <TableCell>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    student.status === 'active' ? 'bg-green-100 text-green-800' :
                    student.status === 'promoted' ? 'bg-blue-100 text-blue-800' :
                    student.status === 'transferred' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {student.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedStudent(student); setShowViewModal(true); }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => { setSelectedStudent(student); setShowModal(true); }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedStudent(null); }}
        title={selectedStudent ? 'Edit Student' : 'Add New Student'}
        size="xl"
      >
        <StudentForm
          student={selectedStudent}
          classes={classes}
          sections={sections}
          onClose={() => { setShowModal(false); setSelectedStudent(null); loadData(); }}
        />
      </Modal>

      <Modal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setSelectedStudent(null); }}
        title="Student Details"
        size="lg"
      >
        {selectedStudent && <StudentDetails student={selectedStudent} />}
      </Modal>
    </div>
  );
}

interface StudentFormProps {
  student: Student | null;
  classes: any[];
  sections: any[];
  onClose: () => void;
}

function StudentForm({ student, classes, sections, onClose }: StudentFormProps) {
  const [formData, setFormData] = useState({
    admission_number: student?.admission_number || '',
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    father_name: student?.father_name || '',
    mother_name: student?.mother_name || '',
    date_of_birth: student?.date_of_birth || '',
    gender: student?.gender || 'male',
    cnic: student?.cnic || '',
    current_class_id: student?.current_class_id || '',
    current_section_id: student?.current_section_id || '',
    admission_date: student?.admission_date || new Date().toISOString().split('T')[0],
    phone: student?.phone || '',
    email: student?.email || '',
    address: student?.address || '',
    status: student?.status || 'active',
  });
  const [saving, setSaving] = useState(false);

  const filteredSections = sections.filter(s => s.class_id === formData.current_class_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (student) {
        const { error } = await supabase.from('students').update(formData).eq('id', student.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('students').insert([{
          ...formData,
          admission_class_id: formData.current_class_id || null,
        }]);
        if (error) throw error;
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving student:', error);
      alert(error.message || 'Error saving student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Admission Number"
          value={formData.admission_number}
          onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
          required
        />
        <Input
          label="Admission Date"
          type="date"
          value={formData.admission_date}
          onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
          required
        />
        <Input
          label="First Name"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
        />
        <Input
          label="Last Name"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
        />
        <Input
          label="Father's Name"
          value={formData.father_name}
          onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
          required
        />
        <Input
          label="Mother's Name"
          value={formData.mother_name}
          onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
        />
        <Input
          label="Date of Birth"
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <Input
          label="CNIC/B-Form"
          value={formData.cnic}
          onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
          placeholder="XXXXX-XXXXXXX-X"
        />
        <Input
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select
            value={formData.current_class_id}
            onChange={(e) => setFormData({ ...formData, current_class_id: e.target.value, current_section_id: '' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>{cls.class_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
          <select
            value={formData.current_section_id}
            onChange={(e) => setFormData({ ...formData, current_section_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!formData.current_class_id}
          >
            <option value="">Select Section</option>
            {filteredSections.map((sec) => (
              <option key={sec.id} value={sec.id}>{sec.section_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="promoted">Promoted</option>
            <option value="transferred">Transferred</option>
            <option value="alumni">Alumni</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      </div>

      <div>
        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : student ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
}

function StudentDetails({ student }: { student: Student }) {
  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Admission Number</label>
            <p className="font-medium">{student.admission_number}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <p className="font-medium capitalize">{student.status}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Full Name</label>
            <p className="font-medium">{student.first_name} {student.last_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Father's Name</label>
            <p className="font-medium">{student.father_name}</p>
          </div>
          {student.mother_name && (
            <div>
              <label className="text-sm text-gray-600">Mother's Name</label>
              <p className="font-medium">{student.mother_name}</p>
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600">Date of Birth</label>
            <p className="font-medium">{new Date(student.date_of_birth).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Gender</label>
            <p className="font-medium capitalize">{student.gender}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">CNIC/B-Form</label>
            <p className="font-medium">{student.cnic || '-'}</p>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Academic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Class</label>
            <p className="font-medium">{student.classes?.class_name || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Section</label>
            <p className="font-medium">{student.sections?.section_name || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Admission Date</label>
            <p className="font-medium">{new Date(student.admission_date).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Phone</label>
            <p className="font-medium">{student.phone || '-'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="font-medium">{student.email || '-'}</p>
          </div>
          <div className="col-span-2">
            <label className="text-sm text-gray-600">Address</label>
            <p className="font-medium">{student.address || '-'}</p>
          </div>
        </div>
      </div>

      {/* Parent Contacts */}
      <ParentContacts studentId={student.id} />

      {/* Documents */}
      <StudentDocuments studentId={student.id} />

      {/* Fees */}
      <StudentFees studentId={student.id} />
    </div>
  );
}
