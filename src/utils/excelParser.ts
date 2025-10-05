import * as XLSX from 'xlsx';

export interface MarksRow {
  studentId: string;
  admissionNumber: string;
  studentName: string;
  subject: string;
  totalMarks: number;
  obtainedMarks: number;
  isAbsent?: boolean;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function validateMarksData(data: any[]): {
  valid: boolean;
  errors: ValidationError[];
  validRows: MarksRow[];
} {
  const errors: ValidationError[] = [];
  const validRows: MarksRow[] = [];

  data.forEach((row, index) => {
    const rowNumber = index + 2;

    if (!row.admission_number && !row.admissionNumber && !row['Admission Number']) {
      errors.push({
        row: rowNumber,
        field: 'admission_number',
        message: 'Admission number is required',
      });
      return;
    }

    const admissionNumber =
      row.admission_number || row.admissionNumber || row['Admission Number'];
    const studentName = row.student_name || row.studentName || row['Student Name'];
    const subject = row.subject || row.Subject;
    const totalMarks = Number(row.total_marks || row.totalMarks || row['Total Marks']);
    const obtainedMarks = Number(
      row.obtained_marks || row.obtainedMarks || row['Obtained Marks']
    );
    const isAbsent =
      row.is_absent === true ||
      row.isAbsent === true ||
      row['Is Absent']?.toLowerCase() === 'yes';

    if (!subject) {
      errors.push({
        row: rowNumber,
        field: 'subject',
        message: 'Subject is required',
      });
    }

    if (isNaN(totalMarks) || totalMarks <= 0) {
      errors.push({
        row: rowNumber,
        field: 'total_marks',
        message: 'Valid total marks is required',
      });
    }

    if (!isAbsent && (isNaN(obtainedMarks) || obtainedMarks < 0)) {
      errors.push({
        row: rowNumber,
        field: 'obtained_marks',
        message: 'Valid obtained marks is required',
      });
    }

    if (!isAbsent && obtainedMarks > totalMarks) {
      errors.push({
        row: rowNumber,
        field: 'obtained_marks',
        message: 'Obtained marks cannot exceed total marks',
      });
    }

    if (errors.filter((e) => e.row === rowNumber).length === 0) {
      validRows.push({
        studentId: row.student_id || '',
        admissionNumber,
        studentName,
        subject,
        totalMarks,
        obtainedMarks: isAbsent ? 0 : obtainedMarks,
        isAbsent,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    validRows,
  };
}

export function exportToExcel(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function generateMarksTemplate(
  students: any[],
  subjects: any[],
  termName: string
): void {
  const templateData: any[] = [];

  students.forEach((student) => {
    subjects.forEach((subject) => {
      templateData.push({
        'Admission Number': student.admission_number,
        'Student Name': `${student.first_name} ${student.last_name}`,
        Subject: subject.subject_name,
        'Total Marks': 100,
        'Obtained Marks': '',
        'Is Absent': 'No',
      });
    });
  });

  exportToExcel(templateData, `Marks_Template_${termName}`);
}
