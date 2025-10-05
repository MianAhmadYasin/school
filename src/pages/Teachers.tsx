import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { supabase } from '../lib/supabase';

interface Teacher {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  designation: string;
  qualification: string;
  phone: string;
  status: string;
}

export function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading teachers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-600 mt-1">Manage teaching staff and their assignments</p>
        </div>
        <Button>
          <Plus className="w-5 h-5 mr-2" />
          Add Teacher
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <Table
          headers={[
            'Employee No',
            'Name',
            'Designation',
            'Qualification',
            'Contact',
            'Status',
          ]}
        >
          {filteredTeachers.length === 0 ? (
            <TableRow>
              <TableCell className="text-center" colSpan={6}>
                No teachers found
              </TableCell>
            </TableRow>
          ) : (
            filteredTeachers.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>{teacher.employee_number}</TableCell>
                <TableCell>
                  {teacher.first_name} {teacher.last_name}
                </TableCell>
                <TableCell>{teacher.designation}</TableCell>
                <TableCell>{teacher.qualification}</TableCell>
                <TableCell>{teacher.phone}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      teacher.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {teacher.status}
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>
    </div>
  );
}
