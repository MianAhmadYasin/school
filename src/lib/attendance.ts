import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type StudentAttendance = Tables['student_attendance']['Row'];
type StudentAttendanceInsert = Tables['student_attendance']['Insert'];
type StudentAttendanceUpdate = Tables['student_attendance']['Update'];
type TeacherAttendance = Tables['teacher_attendance']['Row'];
type TeacherAttendanceInsert = Tables['teacher_attendance']['Insert'];

export type StudentAttendanceWithDetails = StudentAttendance & {
  student?: { first_name: string; last_name: string; admission_number: string };
  class?: { class_name: string };
  section?: { section_name: string };
};

export type TeacherAttendanceWithDetails = TeacherAttendance & {
  teacher?: { first_name: string; last_name: string; employee_number: string };
};

export async function getStudentAttendance(filters?: {
  studentId?: string;
  classId?: string;
  sectionId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  let query = supabase
    .from('student_attendance')
    .select(`
      *,
      student:student_id(first_name, last_name, admission_number),
      class:class_id(class_name),
      section:section_id(section_name)
    `)
    .order('attendance_date', { ascending: false });

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }

  if (filters?.classId) {
    query = query.eq('class_id', filters.classId);
  }

  if (filters?.sectionId) {
    query = query.eq('section_id', filters.sectionId);
  }

  if (filters?.date) {
    query = query.eq('attendance_date', filters.date);
  }

  if (filters?.startDate) {
    query = query.gte('attendance_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('attendance_date', filters.endDate);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as StudentAttendanceWithDetails[];
}

export async function markStudentAttendance(attendanceData: StudentAttendanceInsert) {
  // Check if attendance already exists for this student on this date
  const { data: existing } = await supabase
    .from('student_attendance')
    .select('id')
    .eq('student_id', attendanceData.student_id)
    .eq('attendance_date', attendanceData.attendance_date)
    .single();

  if (existing) {
    // Update existing attendance
    const { data, error } = await supabase
      .from('student_attendance')
      .update(attendanceData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new attendance record
    const { data, error } = await supabase
      .from('student_attendance')
      .insert(attendanceData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function markBulkStudentAttendance(attendanceRecords: StudentAttendanceInsert[]) {
  const { data, error } = await supabase
    .from('student_attendance')
    .upsert(attendanceRecords, { onConflict: 'student_id,attendance_date' })
    .select();

  if (error) throw error;
  return data;
}

export async function getTeacherAttendance(filters?: {
  teacherId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}) {
  let query = supabase
    .from('teacher_attendance')
    .select(`
      *,
      teacher:teacher_id(first_name, last_name, employee_number)
    `)
    .order('attendance_date', { ascending: false });

  if (filters?.teacherId) {
    query = query.eq('teacher_id', filters.teacherId);
  }

  if (filters?.date) {
    query = query.eq('attendance_date', filters.date);
  }

  if (filters?.startDate) {
    query = query.gte('attendance_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('attendance_date', filters.endDate);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as TeacherAttendanceWithDetails[];
}

export async function markTeacherAttendance(attendanceData: TeacherAttendanceInsert) {
  // Check if attendance already exists for this teacher on this date
  const { data: existing } = await supabase
    .from('teacher_attendance')
    .select('id')
    .eq('teacher_id', attendanceData.teacher_id)
    .eq('attendance_date', attendanceData.attendance_date)
    .single();

  if (existing) {
    // Update existing attendance
    const { data, error } = await supabase
      .from('teacher_attendance')
      .update(attendanceData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Create new attendance record
    const { data, error } = await supabase
      .from('teacher_attendance')
      .insert(attendanceData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function getAttendanceStats(filters?: {
  classId?: string;
  sectionId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const startDate = filters?.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const endDate = filters?.endDate || new Date().toISOString().split('T')[0];

  let query = supabase
    .from('student_attendance')
    .select('status')
    .gte('attendance_date', startDate)
    .lte('attendance_date', endDate);

  if (filters?.classId) {
    query = query.eq('class_id', filters.classId);
  }

  if (filters?.sectionId) {
    query = query.eq('section_id', filters.sectionId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const stats = data.reduce((acc, record) => {
    acc.total++;
    acc[record.status as keyof typeof acc]++;
    return acc;
  }, { total: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0 });

  const attendancePercentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;

  return {
    ...stats,
    attendancePercentage: Math.round(attendancePercentage * 100) / 100
  };
}

export async function getStudentAttendanceSummary(studentId: string, startDate?: string, endDate?: string) {
  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('student_attendance')
    .select('status')
    .eq('student_id', studentId)
    .gte('attendance_date', start)
    .lte('attendance_date', end);

  if (error) throw error;

  const stats = data.reduce((acc, record) => {
    acc.total++;
    acc[record.status as keyof typeof acc]++;
    return acc;
  }, { total: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0 });

  const attendancePercentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;

  return {
    ...stats,
    attendancePercentage: Math.round(attendancePercentage * 100) / 100
  };
}

export async function getTeacherAttendanceSummary(teacherId: string, startDate?: string, endDate?: string) {
  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const end = endDate || new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('teacher_attendance')
    .select('status')
    .eq('teacher_id', teacherId)
    .gte('attendance_date', start)
    .lte('attendance_date', end);

  if (error) throw error;

  const stats = data.reduce((acc, record) => {
    acc.total++;
    acc[record.status as keyof typeof acc]++;
    return acc;
  }, { total: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0 });

  const attendancePercentage = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;

  return {
    ...stats,
    attendancePercentage: Math.round(attendancePercentage * 100) / 100
  };
}

export async function getDailyAttendanceReport(date: string, classId?: string, sectionId?: string) {
  let query = supabase
    .from('student_attendance')
    .select(`
      *,
      student:student_id(first_name, last_name, admission_number),
      class:class_id(class_name),
      section:section_id(section_name)
    `)
    .eq('attendance_date', date);

  if (classId) {
    query = query.eq('class_id', classId);
  }

  if (sectionId) {
    query = query.eq('section_id', sectionId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as StudentAttendanceWithDetails[];
}

export async function getMonthlyAttendanceReport(month: string, year: string, classId?: string, sectionId?: string) {
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

  return getStudentAttendance({
    startDate,
    endDate,
    classId,
    sectionId
  });
}

export async function getAbsentStudents(date: string, classId?: string, sectionId?: string) {
  let query = supabase
    .from('student_attendance')
    .select(`
      *,
      student:student_id(first_name, last_name, admission_number),
      class:class_id(class_name),
      section:section_id(section_name)
    `)
    .eq('attendance_date', date)
    .eq('status', 'absent');

  if (classId) {
    query = query.eq('class_id', classId);
  }

  if (sectionId) {
    query = query.eq('section_id', sectionId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as StudentAttendanceWithDetails[];
}

