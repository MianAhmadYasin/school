import React, { useEffect, useState } from 'react';
import { FileText, Download, Plus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Certificate {
  id: string;
  certificate_type: string;
  certificate_number: string;
  issue_date: string;
  student_id: string | null;
  teacher_id: string | null;
  students?: {
    first_name: string;
    last_name: string;
  };
  teachers?: {
    first_name: string;
    last_name: string;
  };
}

export function Certificates() {
  const { profile } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, [profile]);

  const loadCertificates = async () => {
    try {
      let query = supabase
        .from('issued_certificates')
        .select(`
          *,
          students (first_name, last_name),
          teachers (first_name, last_name)
        `)
        .order('issue_date', { ascending: false });

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
      setCertificates(data || []);
    } catch (error) {
      console.error('Error loading certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCertificateTypeName = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return <div>Loading certificates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
          <p className="text-gray-600 mt-1">Generate and manage certificates</p>
        </div>
        {profile?.role === 'admin' && (
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            Generate Certificate
          </Button>
        )}
      </div>

      {profile?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Leaving Certificate</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Issue leaving certificates for students
            </p>
            <Button size="sm" variant="secondary" className="w-full">
              Generate
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Character Certificate</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Issue character certificates for students
            </p>
            <Button size="sm" variant="secondary" className="w-full">
              Generate
            </Button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Experience Letter</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Issue experience letters for teachers
            </p>
            <Button size="sm" variant="secondary" className="w-full">
              Generate
            </Button>
          </Card>
        </div>
      )}

      <Card>
        <Table
          headers={[
            'Certificate Type',
            'Certificate No',
            'Issued To',
            'Issue Date',
            'Actions',
          ]}
        >
          {certificates.length === 0 ? (
            <TableRow>
              <TableCell className="text-center" colSpan={5}>
                No certificates found
              </TableCell>
            </TableRow>
          ) : (
            certificates.map((cert) => (
              <TableRow key={cert.id}>
                <TableCell>{getCertificateTypeName(cert.certificate_type)}</TableCell>
                <TableCell className="font-mono text-sm">
                  {cert.certificate_number}
                </TableCell>
                <TableCell>
                  {cert.students
                    ? `${cert.students.first_name} ${cert.students.last_name}`
                    : cert.teachers
                    ? `${cert.teachers.first_name} ${cert.teachers.last_name}`
                    : 'N/A'}
                </TableCell>
                <TableCell>
                  {new Date(cert.issue_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </Card>
    </div>
  );
}
