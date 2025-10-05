import React, { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Result {
  id: string;
  student_id: string;
  term_id: string;
  obtained_marks: number;
  total_marks: number;
  percentage: number;
  grade: string | null;
  result_status: string;
  students: {
    first_name: string;
    last_name: string;
    admission_number: string;
  };
  terms: {
    term_name: string;
  };
}

export function Results() {
  const { profile } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [profile]);

  const loadResults = async () => {
    try {
      let query = supabase
        .from('results')
        .select(`
          *,
          students (first_name, last_name, admission_number),
          terms (term_name)
        `)
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
      setResults(data || []);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (status: string) => {
    if (status === 'pass' || status === 'promoted') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return <div>Loading results...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Results</h1>
          <p className="text-gray-600 mt-1">View academic performance and grades</p>
        </div>
      </div>

      <Card>
        <Table
          headers={[
            'Student',
            'Admission No',
            'Term',
            'Obtained',
            'Total',
            'Percentage',
            'Grade',
            'Status',
            'Actions',
          ]}
        >
          {results.length === 0 ? (
            <TableRow>
              <TableCell className="text-center" colSpan={9}>
                No results found
              </TableCell>
            </TableRow>
          ) : (
            results.map((result) => (
              <TableRow key={result.id}>
                <TableCell>
                  {result.students.first_name} {result.students.last_name}
                </TableCell>
                <TableCell>{result.students.admission_number}</TableCell>
                <TableCell>{result.terms.term_name}</TableCell>
                <TableCell>{result.obtained_marks}</TableCell>
                <TableCell>{result.total_marks}</TableCell>
                <TableCell>{result.percentage.toFixed(2)}%</TableCell>
                <TableCell>{result.grade || 'N/A'}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(
                      result.result_status
                    )}`}
                  >
                    {result.result_status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4 mr-1" />
                    Report
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>

      {profile?.role === 'student' && results.length > 0 && (
        <Card title="Your Performance Overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Average Percentage</p>
              <p className="text-3xl font-bold text-blue-600">
                {(
                  results.reduce((sum, r) => sum + r.percentage, 0) / results.length
                ).toFixed(2)}
                %
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Terms Passed</p>
              <p className="text-3xl font-bold text-green-600">
                {results.filter((r) => r.result_status === 'pass').length}
              </p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Terms</p>
              <p className="text-3xl font-bold text-amber-600">{results.length}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
