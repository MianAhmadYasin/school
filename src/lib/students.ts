import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type Student = Tables['students']['Row'];
type StudentInsert = Tables['students']['Insert'];
type StudentUpdate = Tables['students']['Update'];
type ParentContact = Tables['parent_contacts']['Row'];
type ParentContactInsert = Tables['parent_contacts']['Insert'];

export type StudentWithDetails = Student & {
  current_class?: { class_name: string };
  current_section?: { section_name: string };
  parent_contacts?: ParentContact[];
};

export async function getStudents(filters?: {
  classId?: string;
  sectionId?: string;
  status?: string;
  search?: string;
}) {
  let query = supabase
    .from('students')
    .select(`
      *,
      current_class:current_class_id(class_name),
      current_section:current_section_id(section_name),
      parent_contacts(*)
    `)
    .order('admission_number');

  if (filters?.classId) {
    query = query.eq('current_class_id', filters.classId);
  }

  if (filters?.sectionId) {
    query = query.eq('current_section_id', filters.sectionId);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,admission_number.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as StudentWithDetails[];
}

export async function getStudent(id: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      current_class:current_class_id(class_name),
      current_section:current_section_id(section_name),
      parent_contacts(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as StudentWithDetails;
}

export async function createStudent(studentData: StudentInsert, parentContacts?: ParentContactInsert[]) {
  const { data: student, error: studentError } = await supabase
    .from('students')
    .insert(studentData)
    .select()
    .single();

  if (studentError) throw studentError;

  if (parentContacts && parentContacts.length > 0) {
    const contactsWithStudentId = parentContacts.map(contact => ({
      ...contact,
      student_id: student.id
    }));

    const { error: contactsError } = await supabase
      .from('parent_contacts')
      .insert(contactsWithStudentId);

    if (contactsError) {
      // Rollback student creation if parent contacts fail
      await supabase.from('students').delete().eq('id', student.id);
      throw contactsError;
    }
  }

  return student;
}

export async function updateStudent(id: string, studentData: StudentUpdate) {
  const { data, error } = await supabase
    .from('students')
    .update(studentData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStudent(id: string) {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function promoteStudent(studentId: string, toClassId: string, toSectionId: string, academicYearId: string) {
  const { data: student } = await getStudent(studentId);
  if (!student) throw new Error('Student not found');

  const { data: promotion, error: promotionError } = await supabase
    .from('student_promotions')
    .insert({
      student_id: studentId,
      from_class_id: student.current_class_id,
      from_section_id: student.current_section_id,
      to_class_id: toClassId,
      to_section_id: toSectionId,
      academic_year_id: academicYearId,
      promotion_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (promotionError) throw promotionError;

  const { error: updateError } = await supabase
    .from('students')
    .update({
      current_class_id: toClassId,
      current_section_id: toSectionId,
      status: 'promoted'
    })
    .eq('id', studentId);

  if (updateError) throw updateError;

  return promotion;
}

export async function getStudentStats() {
  const { data, error } = await supabase
    .from('students')
    .select('status')
    .then(({ data }) => {
      if (!data) return { total: 0, active: 0, promoted: 0, transferred: 0, alumni: 0, discontinued: 0 };
      
      const stats = data.reduce((acc, student) => {
        acc.total++;
        acc[student.status as keyof typeof acc]++;
        return acc;
      }, { total: 0, active: 0, promoted: 0, transferred: 0, alumni: 0, discontinued: 0 });

      return stats;
    });

  if (error) throw error;
  return data;
}

export async function getStudentsByClass(classId: string, sectionId?: string) {
  let query = supabase
    .from('students')
    .select(`
      *,
      current_class:current_class_id(class_name),
      current_section:current_section_id(section_name)
    `)
    .eq('current_class_id', classId)
    .eq('status', 'active')
    .order('admission_number');

  if (sectionId) {
    query = query.eq('current_section_id', sectionId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as StudentWithDetails[];
}

