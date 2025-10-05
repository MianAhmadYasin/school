import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface StudentCertificateData {
  studentName: string;
  fatherName: string;
  admissionNumber: string;
  className: string;
  dateOfBirth: string;
  admissionDate?: string;
  leavingDate?: string;
  certificateNumber: string;
  issueDate: string;
}

interface TeacherCertificateData {
  teacherName: string;
  designation: string;
  joiningDate: string;
  leavingDate?: string;
  experienceYears?: number;
  certificateNumber: string;
  issueDate: string;
}

export function generateAdmissionLetter(data: StudentCertificateData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.text('Ghani Grammar School', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Ghani Welfare Foundation', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(16);
  doc.text('ADMISSION LETTER', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Certificate No: ${data.certificateNumber}`, 20, 60);
  doc.text(`Date: ${data.issueDate}`, pageWidth - 60, 60);

  doc.setFontSize(11);
  let yPos = 80;

  doc.text(`Dear Parent/Guardian,`, 20, yPos);
  yPos += 10;

  doc.text(`We are pleased to inform you that the following student has been admitted to our school:`, 20, yPos);
  yPos += 15;

  doc.text(`Student Name: ${data.studentName}`, 30, yPos);
  yPos += 8;
  doc.text(`Father's Name: ${data.fatherName}`, 30, yPos);
  yPos += 8;
  doc.text(`Admission Number: ${data.admissionNumber}`, 30, yPos);
  yPos += 8;
  doc.text(`Class: ${data.className}`, 30, yPos);
  yPos += 8;
  doc.text(`Date of Birth: ${data.dateOfBirth}`, 30, yPos);
  yPos += 8;
  doc.text(`Admission Date: ${data.admissionDate}`, 30, yPos);
  yPos += 15;

  doc.text(`This letter serves as proof of admission to Ghani Grammar School.`, 20, yPos);
  yPos += 20;

  doc.text('_____________________', 20, yPos + 20);
  doc.text('Principal', 20, yPos + 25);
  doc.text('Ghani Grammar School', 20, yPos + 30);

  return doc;
}

export function generateLeavingCertificate(data: StudentCertificateData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.text('Ghani Grammar School', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Ghani Welfare Foundation', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(16);
  doc.text('SCHOOL LEAVING CERTIFICATE', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Certificate No: ${data.certificateNumber}`, 20, 60);
  doc.text(`Date: ${data.issueDate}`, pageWidth - 60, 60);

  doc.setFontSize(11);
  let yPos = 80;

  doc.text(`This is to certify that:`, 20, yPos);
  yPos += 15;

  doc.text(`Student Name: ${data.studentName}`, 30, yPos);
  yPos += 8;
  doc.text(`Father's Name: ${data.fatherName}`, 30, yPos);
  yPos += 8;
  doc.text(`Admission Number: ${data.admissionNumber}`, 30, yPos);
  yPos += 8;
  doc.text(`Class: ${data.className}`, 30, yPos);
  yPos += 8;
  doc.text(`Date of Birth: ${data.dateOfBirth}`, 30, yPos);
  yPos += 8;
  doc.text(`Admission Date: ${data.admissionDate}`, 30, yPos);
  yPos += 8;
  doc.text(`Leaving Date: ${data.leavingDate}`, 30, yPos);
  yPos += 15;

  doc.text(`The above-named student has left this school on the date mentioned above.`, 20, yPos);
  yPos += 8;
  doc.text(`They were a student in good standing during their time at this institution.`, 20, yPos);
  yPos += 20;

  doc.text('_____________________', 20, yPos + 20);
  doc.text('Principal', 20, yPos + 25);
  doc.text('Ghani Grammar School', 20, yPos + 30);

  return doc;
}

export function generateCharacterCertificate(data: StudentCertificateData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.text('Ghani Grammar School', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Ghani Welfare Foundation', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(16);
  doc.text('CHARACTER CERTIFICATE', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Certificate No: ${data.certificateNumber}`, 20, 60);
  doc.text(`Date: ${data.issueDate}`, pageWidth - 60, 60);

  doc.setFontSize(11);
  let yPos = 80;

  doc.text(`This is to certify that:`, 20, yPos);
  yPos += 15;

  doc.text(`Student Name: ${data.studentName}`, 30, yPos);
  yPos += 8;
  doc.text(`Father's Name: ${data.fatherName}`, 30, yPos);
  yPos += 8;
  doc.text(`Admission Number: ${data.admissionNumber}`, 30, yPos);
  yPos += 8;
  doc.text(`Class: ${data.className}`, 30, yPos);
  yPos += 15;

  doc.text(`The above-named student has been a student of this school and has always`, 20, yPos);
  yPos += 8;
  doc.text(`maintained good conduct and character. They have been regular, punctual,`, 20, yPos);
  yPos += 8;
  doc.text(`and obedient. Their behavior has been satisfactory in all respects.`, 20, yPos);
  yPos += 15;

  doc.text(`We wish them all success in their future endeavors.`, 20, yPos);
  yPos += 20;

  doc.text('_____________________', 20, yPos + 20);
  doc.text('Principal', 20, yPos + 25);
  doc.text('Ghani Grammar School', 20, yPos + 30);

  return doc;
}

export function generateExperienceLetter(data: TeacherCertificateData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.text('Ghani Grammar School', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text('Ghani Welfare Foundation', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(16);
  doc.text('EXPERIENCE CERTIFICATE', pageWidth / 2, 45, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Certificate No: ${data.certificateNumber}`, 20, 60);
  doc.text(`Date: ${data.issueDate}`, pageWidth - 60, 60);

  doc.setFontSize(11);
  let yPos = 80;

  doc.text(`This is to certify that:`, 20, yPos);
  yPos += 15;

  doc.text(`Name: ${data.teacherName}`, 30, yPos);
  yPos += 8;
  doc.text(`Designation: ${data.designation}`, 30, yPos);
  yPos += 8;
  doc.text(`Joining Date: ${data.joiningDate}`, 30, yPos);
  yPos += 8;
  if (data.leavingDate) {
    doc.text(`Leaving Date: ${data.leavingDate}`, 30, yPos);
    yPos += 8;
  }
  if (data.experienceYears) {
    doc.text(`Total Experience: ${data.experienceYears} years`, 30, yPos);
    yPos += 8;
  }
  yPos += 10;

  doc.text(`The above-named employee worked with us in the capacity mentioned above`, 20, yPos);
  yPos += 8;
  doc.text(`and performed their duties with dedication and professionalism. Their conduct`, 20, yPos);
  yPos += 8;
  doc.text(`and performance have been satisfactory throughout their tenure.`, 20, yPos);
  yPos += 15;

  doc.text(`We wish them all the best in their future endeavors.`, 20, yPos);
  yPos += 20;

  doc.text('_____________________', 20, yPos + 20);
  doc.text('Principal', 20, yPos + 25);
  doc.text('Ghani Grammar School', 20, yPos + 30);

  return doc;
}

export function generateReportCard(studentData: any): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text('Ghani Grammar School', pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Report Card', pageWidth / 2, 28, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Student: ${studentData.studentName}`, 20, 45);
  doc.text(`Admission No: ${studentData.admissionNumber}`, 20, 52);
  doc.text(`Class: ${studentData.className}`, 20, 59);
  doc.text(`Academic Year: ${studentData.academicYear}`, pageWidth - 80, 45);

  const tableData = studentData.marks.map((mark: any) => [
    mark.subject,
    mark.totalMarks,
    mark.obtainedMarks,
    mark.percentage + '%',
    mark.grade,
    mark.status,
  ]);

  autoTable(doc, {
    startY: 70,
    head: [['Subject', 'Total Marks', 'Obtained', 'Percentage', 'Grade', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.text(`Total Marks: ${studentData.totalMarks}`, 20, finalY);
  doc.text(`Obtained Marks: ${studentData.obtainedMarks}`, 20, finalY + 7);
  doc.text(`Percentage: ${studentData.percentage}%`, 20, finalY + 14);
  doc.text(`Result: ${studentData.result}`, 20, finalY + 21);

  return doc;
}
