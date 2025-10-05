import { supabase } from './supabase';
import type { Database } from './database.types';
import { calculateSubjectResult, calculateTermResult, calculateFinalResult } from '../utils/resultCalculator';

type Tables = Database['public']['Tables'];
type Mark = Tables['marks']['Row'];
type MarkInsert = Tables['marks']['Insert'];
type MarkUpdate = Tables['marks']['Update'];
type Result = Tables['results']['Row'];
type FinalResult = Tables['final_results']['Row'];

export type MarkWithDetails = Mark & {
  student?: { first_name: string; last_name: string; admission_number: string };
  subject?: { subject_name: string };
  class?: { class_name: string };
  section?: { section_name: string };
  term?: { term_name: string; term_type: string };
};

export type ResultWithDetails = Result & {
  student?: { first_name: string; last_name: string; admission_number: string };
  class?: { class_name: string };
  section?: { section_name: string };
  term?: { term_name: string; term_type: string };
};

export async function getMarks(filters?: {
  studentId?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  termId?: string;
  academicYearId?: string;
}) {
  let query = supabase
    .from('marks')
    .select(`
      *,
      student:student_id(first_name, last_name, admission_number),
      subject:subject_id(subject_name),
      class:class_id(class_name),
      section:section_id(section_name),
      term:term_id(term_name, term_type)
    `)
    .order('created_at', { ascending: false });

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }

  if (filters?.classId) {
    query = query.eq('class_id', filters.classId);
  }

  if (filters?.sectionId) {
    query = query.eq('section_id', filters.sectionId);
  }

  if (filters?.subjectId) {
    query = query.eq('subject_id', filters.subjectId);
  }

  if (filters?.termId) {
    query = query.eq('term_id', filters.termId);
  }

  if (filters?.academicYearId) {
    query = query.eq('academic_year_id', filters.academicYearId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as MarkWithDetails[];
}

export async function getMark(id: string) {
  const { data, error } = await supabase
    .from('marks')
    .select(`
      *,
      student:student_id(first_name, last_name, admission_number),
      subject:subject_id(subject_name),
      class:class_id(class_name),
      section:section_id(section_name),
      term:term_id(term_name, term_type)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as MarkWithDetails;
}

export async function createMark(markData: MarkInsert) {
  const { data, error } = await supabase
    .from('marks')
    .insert(markData)
    .select()
    .single();

  if (error) throw error;

  // Auto-calculate and update term result
  await calculateAndUpdateTermResult(markData.student_id, markData.term_id);

  return data;
}

export async function updateMark(id: string, markData: MarkUpdate) {
  const { data, error } = await supabase
    .from('marks')
    .update(markData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Auto-calculate and update term result
  if (data.student_id && data.term_id) {
    await calculateAndUpdateTermResult(data.student_id, data.term_id);
  }

  return data;
}

export async function deleteMark(id: string) {
  const { data: mark } = await getMark(id);
  
  const { error } = await supabase
    .from('marks')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Recalculate term result after deletion
  if (mark?.student_id && mark?.term_id) {
    await calculateAndUpdateTermResult(mark.student_id, mark.term_id);
  }
}

export async function calculateAndUpdateTermResult(studentId: string, termId: string) {
  // Get all marks for the student in this term
  const marks = await getMarks({ studentId, termId });
  
  if (marks.length === 0) return;

  // Get term details
  const { data: term } = await supabase
    .from('terms')
    .select('*')
    .eq('id', termId)
    .single();

  if (!term) return;

  // Convert marks to the format expected by the calculator
  const subjectMarks = marks.map(mark => ({
    subjectName: mark.subject?.subject_name || '',
    totalMarks: mark.total_marks,
    obtainedMarks: mark.obtained_marks,
    passingMarks: mark.passing_marks,
    isAbsent: mark.is_absent
  }));

  // Calculate term result
  const termResult = calculateTermResult(subjectMarks);

  // Save or update the result
  const resultData = {
    student_id: studentId,
    class_id: marks[0].class_id,
    section_id: marks[0].section_id,
    term_id: termId,
    academic_year_id: marks[0].academic_year_id,
    total_marks: termResult.totalMarks,
    obtained_marks: termResult.obtainedMarks,
    percentage: termResult.percentage,
    grade: getGradeFromPercentage(termResult.percentage),
    subjects_failed: termResult.subjectsFailed,
    result_status: termResult.status === 'pass' ? 'pass' : 'fail',
    remarks: termResult.status === 'pass' ? 'Passed' : 'Failed'
  };

  // Check if result already exists
  const { data: existingResult } = await supabase
    .from('results')
    .select('id')
    .eq('student_id', studentId)
    .eq('term_id', termId)
    .single();

  if (existingResult) {
    // Update existing result
    await supabase
      .from('results')
      .update(resultData)
      .eq('id', existingResult.id);
  } else {
    // Create new result
    await supabase
      .from('results')
      .insert(resultData);
  }

  // Calculate final result if all terms are completed
  await calculateAndUpdateFinalResult(studentId, term.academic_year_id);
}

export async function calculateAndUpdateFinalResult(studentId: string, academicYearId: string) {
  // Get all term results for the student
  const { data: termResults } = await supabase
    .from('results')
    .select(`
      *,
      term:term_id(term_type)
    `)
    .eq('student_id', studentId)
    .eq('academic_year_id', academicYearId);

  if (!termResults || termResults.length === 0) return;

  // Get student details
  const { data: student } = await supabase
    .from('students')
    .select('current_class_id, current_section_id')
    .eq('id', studentId)
    .single();

  if (!student) return;

  // Organize results by term type
  const term1Result = termResults.find(r => r.term?.term_type === 'first');
  const term2Result = termResults.find(r => r.term?.term_type === 'second');
  const term3Result = termResults.find(r => r.term?.term_type === 'third');

  // Convert to the format expected by the calculator
  const term1 = term1Result ? {
    termName: 'First Term',
    marks: [], // We don't need individual marks for final calculation
    totalMarks: term1Result.total_marks,
    obtainedMarks: term1Result.obtained_marks,
    percentage: term1Result.percentage,
    subjectsFailed: term1Result.subjects_failed,
    status: term1Result.result_status as 'pass' | 'fail'
  } : null;

  const term2 = term2Result ? {
    termName: 'Second Term',
    marks: [],
    totalMarks: term2Result.total_marks,
    obtainedMarks: term2Result.obtained_marks,
    percentage: term2Result.percentage,
    subjectsFailed: term2Result.subjects_failed,
    status: term2Result.result_status as 'pass' | 'fail'
  } : null;

  const term3 = term3Result ? {
    termName: 'Third Term',
    marks: [],
    totalMarks: term3Result.total_marks,
    obtainedMarks: term3Result.obtained_marks,
    percentage: term3Result.percentage,
    subjectsFailed: term3Result.subjects_failed,
    status: term3Result.result_status as 'pass' | 'fail'
  } : null;

  // Calculate final result
  const finalResult = calculateFinalResult(term1, term2, term3);

  // Save or update the final result
  const finalResultData = {
    student_id: studentId,
    class_id: student.current_class_id,
    section_id: student.current_section_id,
    academic_year_id: academicYearId,
    term1_percentage: term1?.percentage || null,
    term2_percentage: term2?.percentage || null,
    term3_percentage: term3?.percentage || null,
    total_marks: finalResult.totalMarks,
    obtained_marks: finalResult.obtainedMarks,
    final_percentage: finalResult.finalPercentage,
    final_grade: finalResult.finalGrade,
    result_status: finalResult.status === 'promoted' ? 'promoted' : finalResult.status,
    remarks: finalResult.remarks
  };

  // Check if final result already exists
  const { data: existingFinalResult } = await supabase
    .from('final_results')
    .select('id')
    .eq('student_id', studentId)
    .eq('academic_year_id', academicYearId)
    .single();

  if (existingFinalResult) {
    // Update existing final result
    await supabase
      .from('final_results')
      .update(finalResultData)
      .eq('id', existingFinalResult.id);
  } else {
    // Create new final result
    await supabase
      .from('final_results')
      .insert(finalResultData);
  }
}

export async function getResults(filters?: {
  studentId?: string;
  classId?: string;
  sectionId?: string;
  termId?: string;
  academicYearId?: string;
}) {
  let query = supabase
    .from('results')
    .select(`
      *,
      student:student_id(first_name, last_name, admission_number),
      class:class_id(class_name),
      section:section_id(section_name),
      term:term_id(term_name, term_type)
    `)
    .order('created_at', { ascending: false });

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }

  if (filters?.classId) {
    query = query.eq('class_id', filters.classId);
  }

  if (filters?.sectionId) {
    query = query.eq('section_id', filters.sectionId);
  }

  if (filters?.termId) {
    query = query.eq('term_id', filters.termId);
  }

  if (filters?.academicYearId) {
    query = query.eq('academic_year_id', filters.academicYearId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as ResultWithDetails[];
}

export async function getFinalResults(filters?: {
  studentId?: string;
  classId?: string;
  sectionId?: string;
  academicYearId?: string;
}) {
  let query = supabase
    .from('final_results')
    .select(`
      *,
      student:student_id(first_name, last_name, admission_number),
      class:class_id(class_name),
      section:section_id(section_name)
    `)
    .order('created_at', { ascending: false });

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }

  if (filters?.classId) {
    query = query.eq('class_id', filters.classId);
  }

  if (filters?.sectionId) {
    query = query.eq('section_id', filters.sectionId);
  }

  if (filters?.academicYearId) {
    query = query.eq('academic_year_id', filters.academicYearId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getStudentResults(studentId: string, academicYearId?: string) {
  const [marks, results, finalResults] = await Promise.all([
    getMarks({ studentId, academicYearId }),
    getResults({ studentId, academicYearId }),
    getFinalResults({ studentId, academicYearId })
  ]);

  return {
    marks,
    results,
    finalResults: finalResults[0] || null
  };
}

function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= 33) return 'E';
  return 'F';
}

