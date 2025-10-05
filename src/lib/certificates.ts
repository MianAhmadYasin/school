import { supabase } from './supabase';
import type { Database } from './database.types';
import jsPDF from 'jspdf';

type Tables = Database['public']['Tables'];
type CertificateTemplate = Tables['certificate_templates']['Row'];
type IssuedCertificate = Tables['issued_certificates']['Row'];
type IssuedCertificateInsert = Tables['issued_certificates']['Insert'];

export type IssuedCertificateWithDetails = IssuedCertificate & {
  student?: { first_name: string; last_name: string; admission_number: string };
  teacher?: { first_name: string; last_name: string; employee_number: string };
};

export async function getCertificateTemplates() {
  const { data, error } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('is_active', true)
    .order('certificate_type');

  if (error) throw error;
  return data as CertificateTemplate[];
}

export async function getCertificateTemplate(certificateType: string) {
  const { data, error } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('certificate_type', certificateType)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data as CertificateTemplate;
}

export async function createCertificateTemplate(templateData: Tables['certificate_templates']['Insert']) {
  const { data, error } = await supabase
    .from('certificate_templates')
    .insert(templateData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCertificateTemplate(id: string, templateData: Tables['certificate_templates']['Update']) {
  const { data, error } = await supabase
    .from('certificate_templates')
    .update(templateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getIssuedCertificates(filters?: {
  studentId?: string;
  teacherId?: string;
  certificateType?: string;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase
    .from('issued_certificates')
    .select(`
      *,
      student:student_id(first_name, last_name, admission_number),
      teacher:teacher_id(first_name, last_name, employee_number)
    `)
    .order('issue_date', { ascending: false });

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }

  if (filters?.teacherId) {
    query = query.eq('teacher_id', filters.teacherId);
  }

  if (filters?.certificateType) {
    query = query.eq('certificate_type', filters.certificateType);
  }

  if (filters?.startDate) {
    query = query.gte('issue_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('issue_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as IssuedCertificateWithDetails[];
}

export async function issueCertificate(certificateData: IssuedCertificateInsert) {
  // Generate certificate number
  const certificateNumber = await generateCertificateNumber(certificateData.certificate_type);

  const certificateWithNumber = {
    ...certificateData,
    certificate_number: certificateNumber
  };

  const { data, error } = await supabase
    .from('issued_certificates')
    .insert(certificateWithNumber)
    .select()
    .single();

  if (error) throw error;

  // Generate PDF
  const pdfUrl = await generateCertificatePDF(data);

  // Update certificate with PDF URL
  const { data: updatedCertificate, error: updateError } = await supabase
    .from('issued_certificates')
    .update({ pdf_url: pdfUrl })
    .eq('id', data.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return updatedCertificate;
}

export async function generateCertificatePDF(certificate: IssuedCertificateWithDetails): Promise<string> {
  const template = await getCertificateTemplate(certificate.certificate_type);
  
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

  // Add certificate title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(template.template_name.toUpperCase(), pageWidth / 2, 60, { align: 'center' });

  // Add certificate content
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  let content = template.template_content;
  
  // Replace placeholders with actual data
  if (certificate.student) {
    content = content.replace(/\{STUDENT_NAME\}/g, `${certificate.student.first_name} ${certificate.student.last_name}`);
    content = content.replace(/\{ADMISSION_NUMBER\}/g, certificate.student.admission_number);
  }
  
  if (certificate.teacher) {
    content = content.replace(/\{TEACHER_NAME\}/g, `${certificate.teacher.first_name} ${certificate.teacher.last_name}`);
    content = content.replace(/\{EMPLOYEE_NUMBER\}/g, certificate.teacher.employee_number);
  }
  
  content = content.replace(/\{ISSUE_DATE\}/g, new Date(certificate.issue_date).toLocaleDateString());
  content = content.replace(/\{CERTIFICATE_NUMBER\}/g, certificate.certificate_number);

  // Split content into lines and add to PDF
  const lines = doc.splitTextToSize(content, pageWidth - 40);
  let yPosition = 80;
  
  lines.forEach((line: string) => {
    doc.text(line, 20, yPosition);
    yPosition += 7;
  });

  // Add signature section
  yPosition += 20;
  doc.text('Principal', pageWidth - 60, yPosition);
  doc.text('Date: ___________', 20, yPosition);

  // Add certificate number at bottom
  doc.setFontSize(10);
  doc.text(`Certificate No: ${certificate.certificate_number}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

  // Generate PDF blob URL
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  return pdfUrl;
}

export async function generateCertificateNumber(certificateType: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = getCertificatePrefix(certificateType);
  
  // Get count of certificates issued this year
  const { data, error } = await supabase
    .from('issued_certificates')
    .select('id')
    .eq('certificate_type', certificateType)
    .gte('issue_date', `${year}-01-01`)
    .lt('issue_date', `${year + 1}-01-01`);

  if (error) throw error;

  const count = (data?.length || 0) + 1;
  return `${prefix}${year}${count.toString().padStart(4, '0')}`;
}

function getCertificatePrefix(certificateType: string): string {
  switch (certificateType) {
    case 'leaving_certificate':
      return 'LC';
    case 'character_certificate':
      return 'CC';
    case 'joining_letter':
      return 'JL';
    case 'experience_letter':
      return 'EL';
    case 'leaving_letter':
      return 'LL';
    default:
      return 'CERT';
  }
}

export async function getCertificateStats() {
  const { data, error } = await supabase
    .from('issued_certificates')
    .select('certificate_type, issue_date')
    .gte('issue_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);

  if (error) throw error;

  const stats = data.reduce((acc, cert) => {
    acc.total++;
    acc[cert.certificate_type as keyof typeof acc]++;
    return acc;
  }, { 
    total: 0, 
    leaving_certificate: 0, 
    character_certificate: 0, 
    joining_letter: 0, 
    experience_letter: 0, 
    leaving_letter: 0 
  });

  return stats;
}

export async function downloadCertificate(certificateId: string) {
  const { data: certificate, error } = await supabase
    .from('issued_certificates')
    .select('*')
    .eq('id', certificateId)
    .single();

  if (error) throw error;

  if (certificate.pdf_url) {
    // Download existing PDF
    const link = document.createElement('a');
    link.href = certificate.pdf_url;
    link.download = `${certificate.certificate_type}_${certificate.certificate_number}.pdf`;
    link.click();
  } else {
    // Generate new PDF
    const pdfUrl = await generateCertificatePDF(certificate as IssuedCertificateWithDetails);
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${certificate.certificate_type}_${certificate.certificate_number}.pdf`;
    link.click();
  }
}

export async function verifyCertificate(certificateNumber: string) {
  const { data, error } = await supabase
    .from('issued_certificates')
    .select(`
      *,
      student:student_id(first_name, last_name, admission_number),
      teacher:teacher_id(first_name, last_name, employee_number)
    `)
    .eq('certificate_number', certificateNumber)
    .single();

  if (error) throw error;
  return data as IssuedCertificateWithDetails;
}

