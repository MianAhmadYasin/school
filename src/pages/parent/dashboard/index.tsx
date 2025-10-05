import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { useAuth } from '../../../contexts/AuthContext';

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNumber: string;
}

interface FeeStatus {
  studentId: string;
  pendingAmount: number;
  nextDueDate: string;
  lastPayment: {
    amount: number;
    date: string;
  };
}

interface AcademicProgress {
  studentId: string;
  attendance: number;
  averageScore: number;
  assignments: {
    total: number;
    completed: number;
  };
}

export function ParentDashboard() {
  const { profile } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Sample data - replace with actual data from API
  const children: Student[] = [
    {
      id: '1',
      name: 'John Doe',
      class: '10',
      section: 'A',
      rollNumber: '1001',
    },
    {
      id: '2',
      name: 'Jane Doe',
      class: '8',
      section: 'B',
      rollNumber: '2001',
    },
  ];

  const feeStatus: Record<string, FeeStatus> = {
    '1': {
      studentId: '1',
      pendingAmount: 0,
      nextDueDate: '2025-11-01',
      lastPayment: {
        amount: 500,
        date: '2025-10-01',
      },
    },
    '2': {
      studentId: '2',
      pendingAmount: 250,
      nextDueDate: '2025-10-15',
      lastPayment: {
        amount: 500,
        date: '2025-09-15',
      },
    },
  };

  const academicProgress: Record<string, AcademicProgress> = {
    '1': {
      studentId: '1',
      attendance: 95,
      averageScore: 88,
      assignments: {
        total: 10,
        completed: 9,
      },
    },
    '2': {
      studentId: '2',
      attendance: 92,
      averageScore: 85,
      assignments: {
        total: 8,
        completed: 7,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {profile?.full_name}
          </h1>
          <p className="text-sm text-gray-600">
            Monitor your children's academic progress
          </p>
        </div>
        <select
          className="rounded-md border-gray-300"
          value={selectedStudent?.id || ''}
          onChange={(e) => {
            const student = children.find((c) => c.id === e.target.value);
            setSelectedStudent(student || null);
          }}
        >
          <option value="">Select Child</option>
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name} - Class {child.class}-{child.section}
            </option>
          ))}
        </select>
      </div>

      {selectedStudent ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600">
                Attendance Rate
              </h3>
              <p className="mt-2 text-3xl font-semibold text-blue-600">
                {academicProgress[selectedStudent.id].attendance}%
              </p>
              <p className="mt-1 text-sm text-gray-600">This semester</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600">
                Average Score
              </h3>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                {academicProgress[selectedStudent.id].averageScore}%
              </p>
              <p className="mt-1 text-sm text-gray-600">All subjects</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600">
                Assignments Status
              </h3>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">
                {academicProgress[selectedStudent.id].assignments.completed}/
                {academicProgress[selectedStudent.id].assignments.total}
              </p>
              <p className="mt-1 text-sm text-gray-600">Completed</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600">Fee Status</h3>
              {feeStatus[selectedStudent.id].pendingAmount > 0 ? (
                <p className="mt-2 text-xl font-semibold text-red-600">
                  ${feeStatus[selectedStudent.id].pendingAmount} Due
                </p>
              ) : (
                <p className="mt-2 text-xl font-semibold text-green-600">
                  All Clear
                </p>
              )}
              <p className="mt-1 text-sm text-gray-600">
                Next: {feeStatus[selectedStudent.id].nextDueDate}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Recent Activities</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">
                      Submitted Mathematics Assignment
                    </p>
                    <p className="text-xs text-gray-600">Today, 2:30 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Science Quiz Completed</p>
                    <p className="text-xs text-gray-600">Yesterday, 11:00 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">
                      New English Assignment Posted
                    </p>
                    <p className="text-xs text-gray-600">Yesterday, 9:15 AM</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Upcoming Events</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <span className="text-sm font-semibold">OCT</span>
                    <span className="text-lg font-bold">15</span>
                  </div>
                  <div>
                    <p className="font-medium">Mathematics Test</p>
                    <p className="text-sm text-gray-600">
                      Chapter 5: Quadratic Equations
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <span className="text-sm font-semibold">OCT</span>
                    <span className="text-lg font-bold">20</span>
                  </div>
                  <div>
                    <p className="font-medium">Parent-Teacher Meeting</p>
                    <p className="text-sm text-gray-600">
                      Mid-term Progress Discussion
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4">Academic Performance</h3>
                <div className="rounded-lg border bg-white">
                  <Table
                    headers={[
                      'Subject',
                      'Last Test',
                      'Score',
                      'Class Average',
                      'Status',
                    ]}
                  >
                    <TableRow>
                      <TableCell>Mathematics</TableCell>
                      <TableCell>Oct 1, 2025</TableCell>
                      <TableCell>92%</TableCell>
                      <TableCell>85%</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full px-2 text-xs font-semibold bg-green-100 text-green-800">
                          Above Average
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Science</TableCell>
                      <TableCell>Sep 28, 2025</TableCell>
                      <TableCell>88%</TableCell>
                      <TableCell>82%</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full px-2 text-xs font-semibold bg-green-100 text-green-800">
                          Above Average
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>English</TableCell>
                      <TableCell>Sep 25, 2025</TableCell>
                      <TableCell>78%</TableCell>
                      <TableCell>80%</TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full px-2 text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Below Average
                        </span>
                      </TableCell>
                    </TableRow>
                  </Table>
                </div>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">
            Select a child to view their academic progress
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Choose from the dropdown menu above to see detailed information
          </p>
        </div>
      )}
    </div>
  );
}