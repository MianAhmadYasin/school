import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type Class = Tables['classes']['Row'];
type Section = Tables['sections']['Row'];
type Subject = Tables['subjects']['Row'];
type ClassSubject = Tables['class_subjects']['Row'];
type Term = Tables['terms']['Row'];
type AcademicYear = Tables['academic_years']['Row'];

export type ClassWithSections = Class & {
  sections?: Section[];
};

export type SubjectWithDetails = Subject & {
  class_subjects?: ClassSubject[];
};

export async function getAcademicYears() {
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .order('year_name', { ascending: false });

  if (error) throw error;
  return data as AcademicYear[];
}

export async function getCurrentAcademicYear() {
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .eq('is_current', true)
    .single();

  if (error) throw error;
  return data as AcademicYear;
}

export async function createAcademicYear(yearData: Tables['academic_years']['Insert']) {
  // First, set all other years as not current
  if (yearData.is_current) {
    await supabase
      .from('academic_years')
      .update({ is_current: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This will update all records
  }

  const { data, error } = await supabase
    .from('academic_years')
    .insert(yearData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      sections(*)
    `)
    .eq('is_active', true)
    .order('class_order');

  if (error) throw error;
  return data as ClassWithSections[];
}

export async function createClass(classData: Tables['classes']['Insert']) {
  const { data, error } = await supabase
    .from('classes')
    .insert(classData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createSection(sectionData: Tables['sections']['Insert']) {
  const { data, error } = await supabase
    .from('sections')
    .insert(sectionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSubjects() {
  const { data, error } = await supabase
    .from('subjects')
    .select(`
      *,
      class_subjects(*)
    `)
    .eq('is_active', true)
    .order('subject_name');

  if (error) throw error;
  return data as SubjectWithDetails[];
}

export async function createSubject(subjectData: Tables['subjects']['Insert']) {
  const { data, error } = await supabase
    .from('subjects')
    .insert(subjectData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function assignSubjectToClass(classId: string, subjectId: string, totalMarks = 100, passingMarks = 33) {
  const { data, error } = await supabase
    .from('class_subjects')
    .insert({
      class_id: classId,
      subject_id: subjectId,
      total_marks: totalMarks,
      passing_marks: passingMarks
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTerms(academicYearId?: string) {
  let query = supabase
    .from('terms')
    .select('*')
    .order('start_date');

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Term[];
}

export async function createTerm(termData: Tables['terms']['Insert']) {
  const { data, error } = await supabase
    .from('terms')
    .insert(termData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCurrentTerm(academicYearId?: string) {
  const currentDate = new Date().toISOString().split('T')[0];
  
  let query = supabase
    .from('terms')
    .select('*')
    .lte('start_date', currentDate)
    .gte('end_date', currentDate)
    .order('start_date', { ascending: false })
    .limit(1);

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data?.[0] as Term | null;
}

export async function getClassSubjects(classId: string) {
  const { data, error } = await supabase
    .from('class_subjects')
    .select(`
      *,
      subject:subject_id(*)
    `)
    .eq('class_id', classId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

export async function getAcademicStats() {
  const [classesResult, subjectsResult, academicYearsResult] = await Promise.all([
    supabase.from('classes').select('id').eq('is_active', true),
    supabase.from('subjects').select('id').eq('is_active', true),
    supabase.from('academic_years').select('id')
  ]);

  if (classesResult.error) throw classesResult.error;
  if (subjectsResult.error) throw subjectsResult.error;
  if (academicYearsResult.error) throw academicYearsResult.error;

  return {
    totalClasses: classesResult.data.length,
    totalSubjects: subjectsResult.data.length,
    totalAcademicYears: academicYearsResult.data.length
  };
}

