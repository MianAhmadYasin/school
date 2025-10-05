import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCertificateTemplates,
  issueCertificate,
  getIssuedCertificates,
  downloadCertificate,
  type CertificateTemplate,
  type IssuedCertificateWithDetails
} from '../../lib/certificates';
import { getStudents } from '../../lib/students';
import { getTeachers } from '../../lib/teachers';

export function CertificateGenerator() {
  const { hasPermission, user } = useAuth();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificateWithDetails[]>([]);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageCertificates = hasPermission('manage_certificates');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [templatesData, studentsData, teachersData, certificatesData] = await Promise.all([
        getCertificateTemplates(),
        getStudents(),
        getTeachers(),
        getIssuedCertificates()
      ]);
      
      setTemplates(templatesData);
      setStudents(studentsData);
      setTeachers(teachersData);
      setIssuedCertificates(certificatesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  };

  const handleGenerateCertificate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTemplate || (!selectedStudent && !selectedTeacher)) return;

    setLoading(true);
    setError(null);

    try {
      const certificateData = {
        certificate_type: selectedTemplate.certificate_type,
        student_id: selectedStudent || null,
        teacher_id: selectedTeacher || null,
        issue_date: new Date().toISOString().split('T')[0],
        certificate_data: {
          template_id: selectedTemplate.id,
          generated_by: user?.id
        },
        issued_by: user?.id
      };

      const newCertificate = await issueCertificate(certificateData);
      setIssuedCertificates(prev => [newCertificate, ...prev]);
      setIsGenerateModalOpen(false);
      
      // Reset form
      setSelectedTemplate(null);
      setSelectedStudent('');
      setSelectedTeacher('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      await downloadCertificate(certificateId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download certificate');
    }
  };

  const getCertificateTypeLabel = (type: string) => {
    switch (type) {
      case 'leaving_certificate':
        return 'Leaving Certificate';
      case 'character_certificate':
        return 'Character Certificate';
      case 'joining_letter':
        return 'Joining Letter';
      case 'experience_letter':
        return 'Experience Letter';
      case 'leaving_letter':
        return 'Leaving Letter';
      default:
        return type;
    }
  };

  if (!canManageCertificates) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-600">
          You don't have permission to manage certificates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Certificate Generator</h1>
        <Button onClick={() => setIsGenerateModalOpen(true)}>
          Generate Certificate
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Available Templates</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <h4 className="font-medium text-gray-900">
                {getCertificateTypeLabel(template.certificate_type)}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {template.template_name}
              </p>
              <div className="mt-3">
                <span className="inline-flex rounded-full px-2 text-xs font-semibold bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Issued Certificates */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Recently Issued Certificates</h3>
        <div className="rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issuedCertificates.map((certificate) => (
                <tr key={certificate.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getCertificateTypeLabel(certificate.certificate_type)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {certificate.student 
                        ? `${certificate.student.first_name} ${certificate.student.last_name}`
                        : certificate.teacher
                        ? `${certificate.teacher.first_name} ${certificate.teacher.last_name}`
                        : 'N/A'
                      }
                    </div>
                    <div className="text-sm text-gray-500">
                      {certificate.student ? 'Student' : 'Teacher'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {certificate.certificate_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(certificate.issue_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownloadCertificate(certificate.id)}
                    >
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generate Certificate Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Certificate"
      >
        <form onSubmit={handleGenerateCertificate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Certificate Type
            </label>
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value);
                setSelectedTemplate(template || null);
              }}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Certificate Type</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {getCertificateTypeLabel(template.certificate_type)}
                </option>
              ))}
            </select>
          </div>

          {selectedTemplate && (
            <>
              {selectedTemplate.certificate_type.includes('student') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Student
                  </label>
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} - {student.admission_number}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedTemplate.certificate_type.includes('teacher') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teacher
                  </label>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name} - {teacher.employee_number}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Certificate'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

