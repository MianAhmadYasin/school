import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import {
  getDashboardStats,
  getRecentActivity,
  getUpcomingEvents,
  getAttendanceTrends,
  getClassPerformanceStats,
  getTeacherWorkloadStats,
  getStudentPerformanceStats,
  getTopPerformers,
  getLowPerformers,
  getMonthlyStats
} from '../../lib/dashboard';

export function AnalyticsDashboard() {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);
  const [classPerformance, setClassPerformance] = useState<any[]>([]);
  const [teacherWorkload, setTeacherWorkload] = useState<any[]>([]);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [lowPerformers, setLowPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const canViewAnalytics = hasPermission('view_reports');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedMonth, selectedYear]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [
        statsData,
        activityData,
        eventsData,
        trendsData,
        performanceData,
        workloadData,
        perfStatsData,
        topPerformersData,
        lowPerformersData,
        monthlyData
      ] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(),
        getUpcomingEvents(),
        getAttendanceTrends(),
        getClassPerformanceStats(),
        getTeacherWorkloadStats(),
        getStudentPerformanceStats(),
        getTopPerformers(),
        getLowPerformers(),
        getMonthlyStats(selectedMonth, selectedYear)
      ]);

      setStats(statsData);
      setRecentActivity(activityData);
      setUpcomingEvents(eventsData);
      setAttendanceTrends(trendsData);
      setClassPerformance(performanceData);
      setTeacherWorkload(workloadData);
      setPerformanceStats(perfStatsData);
      setTopPerformers(topPerformersData);
      setLowPerformers(lowPerformersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (!canViewAnalytics) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-600">
          You don't have permission to view analytics.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600">Error</h3>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button onClick={loadAnalyticsData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-gray-600">Comprehensive school performance insights</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="rounded-md border-gray-300"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-md border-gray-300"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
          <Button onClick={loadAnalyticsData} variant="secondary">
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Students</h3>
            <p className="mt-2 text-3xl font-semibold text-blue-600">
              {stats.students.total}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {stats.students.active} active
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Teachers</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {stats.teachers.total}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {stats.teachers.active} active
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Average Attendance</h3>
            <p className="mt-2 text-3xl font-semibold text-purple-600">
              {Math.round(stats.attendance.attendancePercentage)}%
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {stats.attendance.present}/{stats.attendance.total} present
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Inventory Value</h3>
            <p className="mt-2 text-3xl font-semibold text-orange-600">
              ${stats.inventory.total_value.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {stats.inventory.total_items} items
            </p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attendance Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Attendance Trends (Last 30 Days)</h3>
          <div className="space-y-2">
            {attendanceTrends.slice(-7).map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(trend.date).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${trend.attendancePercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {Math.round(trend.attendancePercentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Class Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Class Performance</h3>
          <div className="space-y-3">
            {classPerformance.slice(0, 5).map((cls, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {cls.className}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${cls.averagePercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {Math.round(cls.averagePercentage)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performers */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Top Performers</h3>
          <div className="space-y-3">
            {topPerformers.slice(0, 5).map((student, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {student.student?.first_name} {student.student?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {student.class?.class_name}-{student.section?.section_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    {student.final_percentage}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {student.final_grade}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Teacher Workload */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Teacher Workload</h3>
          <div className="space-y-3">
            {teacherWorkload.slice(0, 5).map((teacher, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {teacher.teacherName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {teacher.subjectCount} subjects, {teacher.classCount} classes
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">
                    {teacher.totalAssignments}
                  </p>
                  <p className="text-xs text-gray-500">
                    assignments
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Performance Distribution */}
      {performanceStats && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Student Performance Distribution</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(performanceStats).map(([range, count]) => (
              <div key={range} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-semibold text-gray-900">{count as number}</p>
                <p className="text-sm text-gray-600">{range}%</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Activity & Upcoming Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.publish_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map((event, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.publish_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Low Performers Alert */}
      {lowPerformers.length > 0 && (
        <Card className="p-6 border-l-4 border-red-400">
          <h3 className="text-lg font-medium mb-4 text-red-800">Students Needing Attention</h3>
          <div className="space-y-3">
            {lowPerformers.slice(0, 5).map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-red-900">
                    {student.student?.first_name} {student.student?.last_name}
                  </p>
                  <p className="text-xs text-red-600">
                    {student.class?.class_name}-{student.section?.section_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    {student.final_percentage}%
                  </p>
                  <p className="text-xs text-red-500">
                    {student.final_grade}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

