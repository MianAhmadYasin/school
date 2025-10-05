import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { getStudents } from '../../lib/students';
import { getStudentResults } from '../../lib/marks';
import { generateReportCardData } from '../../utils/resultCalculator';
import jsPDF from 'jspdf';

export function ReportCardGenerator() {
  const { hasPermission } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [studentResults, setStudentResults] = useState<any>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageCertificates = hasPermission('manage_certificates');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const studentsData = await getStudents();
      setStudents(studentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    }
  };

  const handleStudentSelect = async (studentId: string) => {
    if (!studentId) return;

    setLoading(true);
    try {
      const results = await getStudentResults(studentId, selectedAcademicYear);
      setStudentResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student results');
    } finally {
      setLoading(false);
    }
  };

  const generateReportCardPDF = async () => {
    if (!studentResults || !selectedStudent) return;

    const student = students.find(s => s.id === selectedStudent);
    if (!student) return;

    // Convert marks to the format expected by the calculator
    const term1Marks = studentResults.marks
      .filter((mark: any) => mark.term?.term_type === 'first')
      .map((mark: any) => ({
        subjectName: mark.subject?.subject_name || '',
        totalMarks: mark.total_marks,
        obtainedMarks: mark.obtained_marks,
        passingMarks: mark.passing_marks,
        isAbsent: mark.is_absent
      }));

    const term2Marks = studentResults.marks
      .filter((mark: any) => mark.term?.term_type === 'second')
      .map((mark: any) => ({
        subjectName: mark.subject?.subject_name || '',
        totalMarks: mark.total_marks,
        obtainedMarks: mark.obtained_marks,
        passingMarks: mark.passing_marks,
        isAbsent: mark.is_absent
      }));

    const term3Marks = studentResults.marks
      .filter((mark: any) => mark.term?.term_type === 'third')
      .map((mark: any) => ({
        subjectName: mark.subject?.subject_name || '',
        totalMarks: mark.total_marks,
        obtainedMarks: mark.obtained_marks,
        passingMarks: mark.passing_marks,
        isAbsent: mark.is_absent
      }));

    const reportCardData = generateReportCardData(
      `${student.first_name} ${student.last_name}`,
      student.admission_number,
      `${student.current_class?.class_name}-${student.current_section?.section_name}`,
      term1Marks,
      term2Marks,
      term3Marks
    );

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Set font
    doc.setFont('helvetica');

    // Add header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('GHANI GRAMMAR SCHOOL', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Ghani Welfare Foundation', pageWidth / 2, 40, { align: 'center' });

    // Add report card title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ACADEMIC REPORT CARD', pageWidth / 2, 60, { align: 'center' });

    // Student information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let yPosition = 80;

    doc.text(`Student Name: ${reportCardData.studentInfo.name}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Roll Number: ${reportCardData.studentInfo.rollNumber}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Class: ${reportCardData.studentInfo.className}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Academic Year: ${new Date().getFullYear()}`, 20, yPosition);
    yPosition += 20;

    // Term results
    doc.setFont('helvetica', 'bold');
    doc.text('TERM RESULTS', 20, yPosition);
    yPosition += 15;

    doc.setFont('helvetica', 'normal');
    doc.text(`First Term: ${reportCardData.termResults.term1.percentage.toFixed(2)}% (${reportCardData.termResults.term1.status.toUpperCase()})`, 20, yPosition);
    yPosition += 10;
    doc.text(`Second Term: ${reportCardData.termResults.term2.percentage.toFixed(2)}% (${reportCardData.termResults.term2.status.toUpperCase()})`, 20, yPosition);
    yPosition += 10;
    doc.text(`Third Term: ${reportCardData.termResults.term3.percentage.toFixed(2)}% (${reportCardData.termResults.term3.status.toUpperCase()})`, 20, yPosition);
    yPosition += 20;

    // Final result
    doc.setFont('helvetica', 'bold');
    doc.text('FINAL RESULT', 20, yPosition);
    yPosition += 15;

    doc.setFont('helvetica', 'normal');
    doc.text(`Total Marks: ${reportCardData.finalResult.obtainedMarks}/${reportCardData.finalResult.totalMarks}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Percentage: ${reportCardData.finalResult.percentage.toFixed(2)}%`, 20, yPosition);
    yPosition += 10;
    doc.text(`Grade: ${reportCardData.finalResult.grade}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Status: ${reportCardData.finalResult.status.toUpperCase()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Remarks: ${reportCardData.finalResult.remarks}`, 20, yPosition);
    yPosition += 20;

    // Subject-wise marks table
    if (reportCardData.subjectMarks.term3.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('SUBJECT-WISE MARKS (FINAL TERM)', 20, yPosition);
      yPosition += 15;

      // Table headers
      doc.setFontSize(10);
      doc.text('Subject', 20, yPosition);
      doc.text('Obtained', 80, yPosition);
      doc.text('Total', 120, yPosition);
      doc.text('Grade', 160, yPosition);
      yPosition += 10;

      // Table rows
      reportCardData.subjectMarks.term3.forEach((mark) => {
        const percentage = (mark.obtainedMarks / mark.totalMarks) * 100;
        let grade = 'F';
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B';
        else if (percentage >= 60) grade = 'C';
        else if (percentage >= 50) grade = 'D';
        else if (percentage >= 33) grade = 'E';

        doc.text(mark.subjectName, 20, yPosition);
        doc.text(mark.isAbsent ? 'ABS' : mark.obtainedMarks.toString(), 80, yPosition);
        doc.text(mark.totalMarks.toString(), 120, yPosition);
        doc.text(mark.isAbsent ? 'ABS' : grade, 160, yPosition);
        yPosition += 8;
      });
    }

    // Signature section
    yPosition += 20;
    doc.text('Principal', pageWidth - 60, yPosition);
    doc.text('Date: ___________', 20, yPosition);

    // Save PDF
    const fileName = `ReportCard_${student.admission_number}_${new Date().getFullYear()}.pdf`;
    doc.save(fileName);
  };

  if (!canManageCertificates) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-600">
          You don't have permission to generate report cards.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Report Card Generator</h1>
        <Button onClick={() => setIsGenerateModalOpen(true)}>
          Generate Report Card
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

      {/* Student Results Preview */}
      {studentResults && selectedStudent && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Student Results Preview</h3>
          <div className="space-y-4">
            {studentResults.finalResults && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Final Result</h4>
                <p className="text-sm text-blue-700">
                  Percentage: {studentResults.finalResults.final_percentage}% | 
                  Grade: {studentResults.finalResults.final_grade} | 
                  Status: {studentResults.finalResults.result_status}
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {studentResults.results.map((result: any) => (
                <div key={result.id} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">{result.term?.term_name}</h4>
                  <p className="text-sm text-gray-600">
                    Percentage: {result.percentage}% | Status: {result.result_status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Generate Report Card Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Report Card"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select Student
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => {
                setSelectedStudent(e.target.value);
                handleStudentSelect(e.target.value);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} - {student.admission_number} ({student.current_class?.class_name}-{student.current_section?.section_name})
                </option>
              ))}
            </select>
          </div>

          {selectedStudent && studentResults && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Results Summary</h4>
              {studentResults.finalResults ? (
                <div className="text-sm text-gray-600">
                  <p>Final Percentage: {studentResults.finalResults.final_percentage}%</p>
                  <p>Final Grade: {studentResults.finalResults.final_grade}</p>
                  <p>Status: {studentResults.finalResults.result_status}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No final results available</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={generateReportCardPDF}
              disabled={!selectedStudent || !studentResults || loading}
            >
              {loading ? 'Loading...' : 'Generate PDF'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

