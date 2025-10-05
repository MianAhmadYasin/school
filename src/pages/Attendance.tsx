import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AttendanceRecord {
  id: string;
  student_id: string;
  attendance_date: string;
  status: string;
  students: {
    first_name: string;
    last_name: string;
    admission_number: string;
  };
}

export function Attendance() {
  const { profile } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    loadAttendance();
  }, [profile, selectedDate]);

  const loadAttendance = async () => {
    try {
      let query = supabase
        .from('student_attendance')
        .select(`
          *,
          students (first_name, last_name, admission_number)
        `)
        .eq('attendance_date', selectedDate)
        .order('created_at', { ascending: false });

      if (profile?.role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (studentData) {
          query = query.eq('student_id', studentData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-amber-100 text-amber-800';
      case 'half_day':
        return 'bg-blue-100 text-blue-800';
      case 'leave':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const attendancePercentage =
    attendance.length > 0 ? (presentCount / attendance.length) * 100 : 0;

  if (loading) {
    return <div>Loading attendance...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">Track daily attendance records</p>
        </div>
        {profile?.role === 'teacher' && (
          <Button>
            <CheckCircle className="w-5 h-5 mr-2" />
            Mark Attendance
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{presentCount}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{absentCount}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Percentage</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {attendancePercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <Table
          headers={['Student', 'Admission No', 'Date', 'Status', 'Check-in Time']}
        >
          {attendance.length === 0 ? (
            <TableRow>
              <TableCell className="text-center" colSpan={5}>
                No attendance records for selected date
              </TableCell>
            </TableRow>
          ) : (
            attendance.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {record.students.first_name} {record.students.last_name}
                </TableCell>
                <TableCell>{record.students.admission_number}</TableCell>
                <TableCell>
                  {new Date(record.attendance_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      record.status
                    )}`}
                  >
                    {record.status}
                  </span>
                </TableCell>
                <TableCell>N/A</TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>
    </div>
  );
}
