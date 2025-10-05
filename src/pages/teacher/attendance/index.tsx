import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../contexts/AuthContext';

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNumber: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

interface AttendanceStats {
  totalDays: number;
  averageAttendance: number;
  presentToday: number;
  absentToday: number;
}

export function AttendanceManagement() {
  const { hasPermission } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageAttendance = hasPermission('manage_attendance');

  const handleAttendanceChange = async (studentId: string, status: AttendanceRecord['status']) => {
    try {
      setLoading(true);
      // Implement attendance update logic
      const record = attendanceRecords.find(
        (r) => r.studentId === studentId && r.date === selectedDate
      );

      if (record) {
        // Update existing record
      } else {
        // Create new record
      }
    } catch (error) {
      setError('Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  const stats: AttendanceStats = {
    totalDays: 0,
    averageAttendance: 0,
    presentToday: 0,
    absentToday: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Days</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {stats.totalDays}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Average Attendance</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            {stats.averageAttendance}%
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Present Today</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {stats.presentToday}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Absent Today</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            {stats.absentToday}
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-md border-gray-300"
          >
            <option value="">Select Class</option>
            {/* Add class options */}
          </select>

          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="rounded-md border-gray-300"
          >
            <option value="">Select Section</option>
            {/* Add section options */}
          </select>

          {canManageAttendance && selectedClass && selectedSection && (
            <Button onClick={() => {}}>Mark All Present</Button>
          )}
        </div>

        <div className="rounded-lg border bg-white">
          <Table
            headers={[
              'Roll No',
              'Student Name',
              'Status',
              'Remarks',
              'Total Present',
              'Total Absent',
              'Percentage',
            ]}
          >
            {students.map((student) => {
              const record = attendanceRecords.find(
                (r) => r.studentId === student.id && r.date === selectedDate
              );

              return (
                <TableRow key={student.id}>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>
                    <select
                      value={record?.status || 'absent'}
                      onChange={(e) =>
                        handleAttendanceChange(student.id, e.target.value as AttendanceRecord['status'])
                      }
                      disabled={!canManageAttendance}
                      className={`rounded-full px-2 py-1 text-sm font-medium ${
                        record?.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : record?.status === 'absent'
                          ? 'bg-red-100 text-red-800'
                          : record?.status === 'late'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <input
                      type="text"
                      placeholder="Add remarks"
                      className="w-full rounded-md border-gray-300 text-sm"
                      value={record?.remarks || ''}
                      onChange={() => {}}
                      disabled={!canManageAttendance}
                    />
                  </TableCell>
                  <TableCell>
                    {
                      attendanceRecords.filter(
                        (r) => r.studentId === student.id && r.status === 'present'
                      ).length
                    }
                  </TableCell>
                  <TableCell>
                    {
                      attendanceRecords.filter(
                        (r) => r.studentId === student.id && r.status === 'absent'
                      ).length
                    }
                  </TableCell>
                  <TableCell>
                    {Math.round(
                      (attendanceRecords.filter(
                        (r) => r.studentId === student.id && r.status === 'present'
                      ).length /
                        attendanceRecords.filter((r) => r.studentId === student.id)
                          .length) *
                        100
                    ) || 0}
                    %
                  </TableCell>
                </TableRow>
              );
            })}
          </Table>
        </div>
      </div>
    </div>
  );
}