import { supabase } from './supabase';
import { getStudentStats } from './students';
import { getTeacherStats } from './teachers';
import { getAttendanceStats } from './attendance';
import { getInventoryStats } from './inventory';
import { getAnnouncementStats } from './announcements';
import { getCertificateStats } from './certificates';
import { getAcademicStats } from './academic';

export interface DashboardStats {
  students: {
    total: number;
    active: number;
    promoted: number;
    transferred: number;
    alumni: number;
    discontinued: number;
  };
  teachers: {
    total: number;
    active: number;
    on_leave: number;
    resigned: number;
    terminated: number;
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    half_day: number;
    leave: number;
    attendancePercentage: number;
  };
  inventory: {
    total_items: number;
    low_stock_items: number;
    total_value: number;
    pending_requests: number;
  };
  announcements: {
    total: number;
    active: number;
    general: number;
    urgent: number;
    academic: number;
    event: number;
    holiday: number;
  };
  certificates: {
    total: number;
    leaving_certificate: number;
    character_certificate: number;
    joining_letter: number;
    experience_letter: number;
    leaving_letter: number;
  };
  academic: {
    totalClasses: number;
    totalSubjects: number;
    totalAcademicYears: number;
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [
      studentStats,
      teacherStats,
      attendanceStats,
      inventoryStats,
      announcementStats,
      certificateStats,
      academicStats
    ] = await Promise.all([
      getStudentStats(),
      getTeacherStats(),
      getAttendanceStats(),
      getInventoryStats(),
      getAnnouncementStats(),
      getCertificateStats(),
      getAcademicStats()
    ]);

    return {
      students: studentStats,
      teachers: teacherStats,
      attendance: attendanceStats,
      inventory: inventoryStats,
      announcements: announcementStats,
      certificates: certificateStats,
      academic: academicStats
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

export async function getRecentActivity(limit = 10) {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id,
      title,
      announcement_type,
      publish_date,
      created_by_user:created_by(full_name)
    `)
    .eq('is_active', true)
    .order('publish_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getUpcomingEvents(limit = 5) {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id,
      title,
      content,
      publish_date,
      expiry_date
    `)
    .eq('announcement_type', 'event')
    .eq('is_active', true)
    .gte('publish_date', new Date().toISOString().split('T')[0])
    .order('publish_date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getAttendanceTrends(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('student_attendance')
    .select('attendance_date, status')
    .gte('attendance_date', startDateStr)
    .lte('attendance_date', endDateStr);

  if (error) throw error;

  // Group by date and calculate daily attendance percentage
  const dailyStats = data.reduce((acc, record) => {
    const date = record.attendance_date;
    if (!acc[date]) {
      acc[date] = { total: 0, present: 0 };
    }
    acc[date].total++;
    if (record.status === 'present') {
      acc[date].present++;
    }
    return acc;
  }, {} as Record<string, { total: number; present: number }>);

  const trends = Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    attendancePercentage: stats.total > 0 ? (stats.present / stats.total) * 100 : 0
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return trends;
}

export async function getClassPerformanceStats() {
  const { data, error } = await supabase
    .from('results')
    .select(`
      percentage,
      result_status,
      class:class_id(class_name)
    `)
    .eq('result_status', 'pass');

  if (error) throw error;

  // Group by class and calculate average performance
  const classStats = data.reduce((acc, result) => {
    const className = result.class?.class_name || 'Unknown';
    if (!acc[className]) {
      acc[className] = { total: 0, sum: 0, count: 0 };
    }
    acc[className].total++;
    acc[className].sum += result.percentage;
    acc[className].count++;
    return acc;
  }, {} as Record<string, { total: number; sum: number; count: number }>);

  const performance = Object.entries(classStats).map(([className, stats]) => ({
    className,
    averagePercentage: stats.count > 0 ? stats.sum / stats.count : 0,
    totalStudents: stats.total
  })).sort((a, b) => b.averagePercentage - a.averagePercentage);

  return performance;
}

export async function getTeacherWorkloadStats() {
  const { data, error } = await supabase
    .from('teacher_assignments')
    .select(`
      teacher_id,
      is_class_teacher,
      teacher:teacher_id(first_name, last_name),
      class:class_id(class_name),
      section:section_id(section_name),
      subject:subject_id(subject_name)
    `)
    .eq('is_active', true);

  if (error) throw error;

  // Group by teacher and calculate workload
  const teacherStats = data.reduce((acc, assignment) => {
    const teacherId = assignment.teacher_id;
    const teacherName = `${assignment.teacher?.first_name} ${assignment.teacher?.last_name}`;
    
    if (!acc[teacherId]) {
      acc[teacherId] = {
        teacherName,
        totalAssignments: 0,
        classTeacherCount: 0,
        subjects: new Set(),
        classes: new Set()
      };
    }
    
    acc[teacherId].totalAssignments++;
    if (assignment.is_class_teacher) {
      acc[teacherId].classTeacherCount++;
    }
    acc[teacherId].subjects.add(assignment.subject?.subject_name);
    acc[teacherId].classes.add(`${assignment.class?.class_name}-${assignment.section?.section_name}`);
    
    return acc;
  }, {} as Record<string, {
    teacherName: string;
    totalAssignments: number;
    classTeacherCount: number;
    subjects: Set<string>;
    classes: Set<string>;
  }>);

  const workload = Object.entries(teacherStats).map(([teacherId, stats]) => ({
    teacherId,
    teacherName: stats.teacherName,
    totalAssignments: stats.totalAssignments,
    classTeacherCount: stats.classTeacherCount,
    subjectCount: stats.subjects.size,
    classCount: stats.classes.size
  })).sort((a, b) => b.totalAssignments - a.totalAssignments);

  return workload;
}

export async function getStudentPerformanceStats() {
  const { data, error } = await supabase
    .from('final_results')
    .select(`
      final_percentage,
      result_status,
      student:student_id(first_name, last_name),
      class:class_id(class_name)
    `);

  if (error) throw error;

  // Calculate performance distribution
  const performanceRanges = {
    '90-100': 0,
    '80-89': 0,
    '70-79': 0,
    '60-69': 0,
    '50-59': 0,
    'Below 50': 0
  };

  data.forEach(result => {
    const percentage = result.final_percentage;
    if (percentage >= 90) performanceRanges['90-100']++;
    else if (percentage >= 80) performanceRanges['80-89']++;
    else if (percentage >= 70) performanceRanges['70-79']++;
    else if (percentage >= 60) performanceRanges['60-69']++;
    else if (percentage >= 50) performanceRanges['50-59']++;
    else performanceRanges['Below 50']++;
  });

  return performanceRanges;
}

export async function getTopPerformers(limit = 10) {
  const { data, error } = await supabase
    .from('final_results')
    .select(`
      final_percentage,
      final_grade,
      student:student_id(first_name, last_name, admission_number),
      class:class_id(class_name),
      section:section_id(section_name)
    `)
    .eq('result_status', 'promoted')
    .order('final_percentage', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getLowPerformers(limit = 10) {
  const { data, error } = await supabase
    .from('final_results')
    .select(`
      final_percentage,
      final_grade,
      student:student_id(first_name, last_name, admission_number),
      class:class_id(class_name),
      section:section_id(section_name)
    `)
    .eq('result_status', 'fail')
    .order('final_percentage', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getMonthlyStats(month: number, year: number) {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const [
    monthlyAttendance,
    monthlyAnnouncements,
    monthlyCertificates
  ] = await Promise.all([
    getAttendanceStats({ startDate, endDate }),
    supabase
      .from('announcements')
      .select('id')
      .gte('publish_date', startDate)
      .lte('publish_date', endDate)
      .then(({ data }) => data?.length || 0),
    supabase
      .from('issued_certificates')
      .select('id')
      .gte('issue_date', startDate)
      .lte('issue_date', endDate)
      .then(({ data }) => data?.length || 0)
  ]);

  return {
    attendance: monthlyAttendance,
    announcements: monthlyAnnouncements,
    certificates: monthlyCertificates
  };
}

