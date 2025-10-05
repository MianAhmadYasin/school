import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type Teacher = Tables['teachers']['Row'];
type TeacherInsert = Tables['teachers']['Insert'];
type TeacherUpdate = Tables['teachers']['Update'];
type TeacherAssignment = Tables['teacher_assignments']['Row'];
type TeacherAssignmentInsert = Tables['teacher_assignments']['Insert'];

export type TeacherWithDetails = Teacher & {
  user_profile?: { full_name: string; email: string };
  assignments?: (TeacherAssignment & {
    class?: { class_name: string };
    section?: { section_name: string };
    subject?: { subject_name: string };
  })[];
};

export async function getTeachers(filters?: {
  status?: string;
  department?: string;
  search?: string;
}) {
  let query = supabase
    .from('teachers')
    .select(`
      *,
      user_profile:user_id(full_name, email),
      assignments:teacher_assignments(
        *,
        class:class_id(class_name),
        section:section_id(section_name),
        subject:subject_id(subject_name)
      )
    `)
    .order('first_name');

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.department) {
    query = query.eq('department', filters.department);
  }

  if (filters?.search) {
    query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,employee_number.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as TeacherWithDetails[];
}

export async function getTeacher(id: string) {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      user_profile:user_id(full_name, email),
      assignments:teacher_assignments(
        *,
        class:class_id(class_name),
        section:section_id(section_name),
        subject:subject_id(subject_name)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as TeacherWithDetails;
}

export async function createTeacher(teacherData: TeacherInsert, assignments?: TeacherAssignmentInsert[]) {
  const { data: teacher, error: teacherError } = await supabase
    .from('teachers')
    .insert(teacherData)
    .select()
    .single();

  if (teacherError) throw teacherError;

  if (assignments && assignments.length > 0) {
    const assignmentsWithTeacherId = assignments.map(assignment => ({
      ...assignment,
      teacher_id: teacher.id
    }));

    const { error: assignmentsError } = await supabase
      .from('teacher_assignments')
      .insert(assignmentsWithTeacherId);

    if (assignmentsError) {
      // Rollback teacher creation if assignments fail
      await supabase.from('teachers').delete().eq('id', teacher.id);
      throw assignmentsError;
    }
  }

  return teacher;
}

export async function updateTeacher(id: string, teacherData: TeacherUpdate) {
  const { data, error } = await supabase
    .from('teachers')
    .update(teacherData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTeacher(id: string) {
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function assignTeacherToClass(teacherId: string, classId: string, sectionId: string, subjectId: string, academicYearId: string, isClassTeacher = false) {
  const { data, error } = await supabase
    .from('teacher_assignments')
    .insert({
      teacher_id: teacherId,
      class_id: classId,
      section_id: sectionId,
      subject_id: subjectId,
      academic_year_id: academicYearId,
      is_class_teacher: isClassTeacher
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeTeacherAssignment(assignmentId: string) {
  const { error } = await supabase
    .from('teacher_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) throw error;
}

export async function getTeacherStats() {
  const { data, error } = await supabase
    .from('teachers')
    .select('status')
    .then(({ data }) => {
      if (!data) return { total: 0, active: 0, on_leave: 0, resigned: 0, terminated: 0 };
      
      const stats = data.reduce((acc, teacher) => {
        acc.total++;
        acc[teacher.status as keyof typeof acc]++;
        return acc;
      }, { total: 0, active: 0, on_leave: 0, resigned: 0, terminated: 0 });

      return stats;
    });

  if (error) throw error;
  return data;
}

export async function getTeachersBySubject(subjectId: string) {
  const { data, error } = await supabase
    .from('teacher_assignments')
    .select(`
      *,
      teacher:teacher_id(*),
      class:class_id(class_name),
      section:section_id(section_name),
      subject:subject_id(subject_name)
    `)
    .eq('subject_id', subjectId)
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

export async function getClassTeachers(classId: string, sectionId?: string) {
  let query = supabase
    .from('teacher_assignments')
    .select(`
      *,
      teacher:teacher_id(*),
      class:class_id(class_name),
      section:section_id(section_name),
      subject:subject_id(subject_name)
    `)
    .eq('class_id', classId)
    .eq('is_class_teacher', true)
    .eq('is_active', true);

  if (sectionId) {
    query = query.eq('section_id', sectionId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

