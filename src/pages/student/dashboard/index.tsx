import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { useAuth } from '../../../contexts/AuthContext';

interface Assignment {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: string;
}

interface Exam {
  id: string;
  subject: string;
  type: string;
  date: string;
  totalMarks: number;
  obtainedMarks?: number;
}

interface Attendance {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export function StudentDashboard() {
  const { profile } = useAuth();

  // Sample data - replace with actual data from API
  const assignments: Assignment[] = [
    {
      id: '1',
      subject: 'Mathematics',
      title: 'Quadratic Equations',
      dueDate: '2025-10-10',
      status: 'pending',
    },
    {
      id: '2',
      subject: 'Science',
      title: 'Lab Report - Chemical Reactions',
      dueDate: '2025-10-08',
      status: 'submitted',
    },
  ];

  const recentExams: Exam[] = [
    {
      id: '1',
      subject: 'English',
      type: 'Mid Term',
      date: '2025-10-01',
      totalMarks: 100,
      obtainedMarks: 85,
    },
    {
      id: '2',
      subject: 'Mathematics',
      type: 'Quiz',
      date: '2025-09-28',
      totalMarks: 20,
      obtainedMarks: 18,
    },
  ];

  const recentAttendance: Attendance[] = [
    { date: '2025-10-05', status: 'present' },
    { date: '2025-10-04', status: 'present' },
    { date: '2025-10-03', status: 'late' },
    { date: '2025-10-02', status: 'present' },
    { date: '2025-10-01', status: 'excused' },
  ];

  const stats = {
    attendance: {
      total: recentAttendance.length,
      present: recentAttendance.filter((a) => a.status === 'present').length,
      percentage:
        (recentAttendance.filter((a) => a.status === 'present').length /
          recentAttendance.length) *
        100,
    },
    assignments: {
      total: assignments.length,
      pending: assignments.filter((a) => a.status === 'pending').length,
      submitted: assignments.filter((a) => a.status === 'submitted').length,
    },
    exams: {
      averageScore:
        recentExams.reduce(
          (acc, exam) =>
            acc + ((exam.obtainedMarks || 0) / exam.totalMarks) * 100,
          0
        ) / recentExams.length,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile?.full_name}
          </h1>
          <p className="text-sm text-gray-600">Here's your academic overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">
            Attendance Rate
          </h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            {Math.round(stats.attendance.percentage)}%
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Present: {stats.attendance.present}/{stats.attendance.total} days
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">
            Pending Assignments
          </h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">
            {stats.assignments.pending}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Total: {stats.assignments.total}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">
            Average Score
          </h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {Math.round(stats.exams.averageScore)}%
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Recent exams average
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Next Exam</h3>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            Mathematics
          </p>
          <p className="mt-1 text-sm text-gray-600">October 15, 2025</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-medium mb-4">Upcoming Assignments</h2>
          <div className="rounded-lg border bg-white">
            <Table
              headers={['Subject', 'Assignment', 'Due Date', 'Status']}
            >
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.subject}</TableCell>
                  <TableCell>{assignment.title}</TableCell>
                  <TableCell>{assignment.dueDate}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        assignment.status === 'submitted'
                          ? 'bg-green-100 text-green-800'
                          : assignment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Recent Exam Results</h2>
          <div className="rounded-lg border bg-white">
            <Table
              headers={['Subject', 'Type', 'Date', 'Score']}
            >
              {recentExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>{exam.type}</TableCell>
                  <TableCell>{exam.date}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        ((exam.obtainedMarks || 0) / exam.totalMarks) * 100 >= 70
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {exam.obtainedMarks}/{exam.totalMarks} (
                      {Math.round(
                        ((exam.obtainedMarks || 0) / exam.totalMarks) * 100
                      )}
                      %)
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Recent Attendance</h2>
          <div className="rounded-lg border bg-white">
            <Table headers={['Date', 'Status']}>
              {recentAttendance.map((attendance, index) => (
                <TableRow key={index}>
                  <TableCell>{attendance.date}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        attendance.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : attendance.status === 'absent'
                          ? 'bg-red-100 text-red-800'
                          : attendance.status === 'late'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {attendance.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Fee Status</h2>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tuition Fee</span>
                <span className="inline-flex rounded-full px-2 text-xs font-semibold bg-green-100 text-green-800">
                  Paid
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Library Fee</span>
                <span className="inline-flex rounded-full px-2 text-xs font-semibold bg-green-100 text-green-800">
                  Paid
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Lab Fee</span>
                <span className="inline-flex rounded-full px-2 text-xs font-semibold bg-yellow-100 text-yellow-800">
                  Pending
                </span>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Next Due</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">October 15, 2025</p>
                    <p className="text-xs text-gray-600">$500.00</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}