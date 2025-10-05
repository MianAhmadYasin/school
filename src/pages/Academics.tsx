import React, { useEffect, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { supabase } from '../lib/supabase';

interface Class {
  id: string;
  class_name: string;
  class_order: number;
}

interface Subject {
  id: string;
  subject_name: string;
  subject_code: string | null;
}

export function Academics() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        supabase.from('classes').select('*').order('class_order'),
        supabase.from('subjects').select('*').order('subject_name'),
      ]);

      if (classesRes.error) throw classesRes.error;
      if (subjectsRes.error) throw subjectsRes.error;

      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading academics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Academics</h1>
          <p className="text-gray-600 mt-1">Manage classes, subjects, and curriculum</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Classes"
          action={
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Class
            </Button>
          }
        >
          <Table headers={['Class Name', 'Order', 'Status']}>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell className="text-center" colSpan={3}>
                  No classes found
                </TableCell>
              </TableRow>
            ) : (
              classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>{cls.class_name}</TableCell>
                  <TableCell>{cls.class_order}</TableCell>
                  <TableCell>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </Table>
        </Card>

        <Card
          title="Subjects"
          action={
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Subject
            </Button>
          }
        >
          <Table headers={['Subject Name', 'Code', 'Status']}>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell className="text-center" colSpan={3}>
                  No subjects found
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>{subject.subject_name}</TableCell>
                  <TableCell>{subject.subject_code || 'N/A'}</TableCell>
                  <TableCell>
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </Table>
        </Card>
      </div>

      <Card title="Academic Year Configuration">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">Current Year</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">2024-2025</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-gray-700">Total Classes</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-medium text-gray-700">Total Subjects</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
