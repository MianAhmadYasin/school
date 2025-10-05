import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../contexts/AuthContext';

interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  examType: 'quiz' | 'test' | 'midterm' | 'final';
  marks: number;
  totalMarks: number;
  date: string;
  comments?: string;
}

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
}

export function GradeManagement() {
  const { hasPermission } = useAuth();
  const [isAddGradeModalOpen, setIsAddGradeModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageGrades = hasPermission('manage_grades');

  const handleAddGrade = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      // Implement grade creation logic here
      setIsAddGradeModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add grade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Grade Management</h1>
        {canManageGrades && (
          <Button onClick={() => setIsAddGradeModalOpen(true)}>
            Add New Grade
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Average Class Grade</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            {grades.length > 0
              ? Math.round(
                  (grades.reduce((sum, grade) => sum + (grade.marks / grade.totalMarks) * 100, 0) /
                    grades.length) *
                    10
                ) / 10
              : 0}
            %
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Assessments</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {grades.length}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Students Below Average</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            {/* Calculate students below average */}
            0
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <select
            className="rounded-md border-gray-300"
            value={selectedStudent?.id || ''}
            onChange={(e) => {
              const student = students.find(s => s.id === e.target.value);
              setSelectedStudent(student || null);
            }}
          >
            <option value="">Select Student</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.class}-{student.section})
              </option>
            ))}
          </select>

          <select className="rounded-md border-gray-300">
            <option value="">All Subjects</option>
            <option value="mathematics">Mathematics</option>
            <option value="science">Science</option>
            <option value="english">English</option>
            {/* Add more subjects */}
          </select>

          <select className="rounded-md border-gray-300">
            <option value="">All Exam Types</option>
            <option value="quiz">Quiz</option>
            <option value="test">Test</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
          </select>
        </div>

        <div className="rounded-lg border bg-white">
          <Table
            headers={[
              'Student',
              'Subject',
              'Exam Type',
              'Marks',
              'Percentage',
              'Date',
              'Actions',
            ]}
          >
            {grades.map((grade) => (
              <TableRow key={grade.id}>
                <TableCell>{grade.studentName}</TableCell>
                <TableCell>{grade.subject}</TableCell>
                <TableCell className="capitalize">{grade.examType}</TableCell>
                <TableCell>
                  {grade.marks}/{grade.totalMarks}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                      (grade.marks / grade.totalMarks) * 100 >= 70
                        ? 'bg-green-100 text-green-800'
                        : (grade.marks / grade.totalMarks) * 100 >= 50
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {Math.round((grade.marks / grade.totalMarks) * 100)}%
                  </span>
                </TableCell>
                <TableCell>{grade.date}</TableCell>
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

      <Modal
        isOpen={isAddGradeModalOpen}
        onClose={() => setIsAddGradeModalOpen(false)}
        title="Add New Grade"
      >
        <form onSubmit={handleAddGrade} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="student" className="block text-sm font-medium text-gray-700">
                Student
              </label>
              <select
                id="student"
                name="student"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.class}-{student.section})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                <option value="mathematics">Mathematics</option>
                <option value="science">Science</option>
                <option value="english">English</option>
                {/* Add more subjects */}
              </select>
            </div>

            <div>
              <label htmlFor="examType" className="block text-sm font-medium text-gray-700">
                Exam Type
              </label>
              <select
                id="examType"
                name="examType"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="quiz">Quiz</option>
                <option value="test">Test</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <Input
                id="date"
                name="date"
                type="date"
                required
              />
            </div>

            <div>
              <label htmlFor="marks" className="block text-sm font-medium text-gray-700">
                Marks Obtained
              </label>
              <Input
                id="marks"
                name="marks"
                type="number"
                required
                min="0"
              />
            </div>

            <div>
              <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700">
                Total Marks
              </label>
              <Input
                id="totalMarks"
                name="totalMarks"
                type="number"
                required
                min="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
              Comments
            </label>
            <textarea
              id="comments"
              name="comments"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddGradeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Grade'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}