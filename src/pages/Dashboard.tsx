import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, Package, Calendar, Bell, Megaphone, Star } from 'lucide-react';
import { Database } from '../lib/database.types';

type Announcement = Database['public']['Tables']['announcements']['Row'];

interface Activity {
  title: string;
  time: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface StatsCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  bgColor: string;
  iconColor: string;
}

export function Dashboard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

  const getAnnouncementStyles = (type: 'general' | 'urgent' | 'academic' | 'event' | 'holiday') => {
    switch (type) {
      case 'urgent':
        return {
          bgColor: 'bg-red-100',
          icon: <Bell className="w-5 h-5 text-red-600" />
        };
      case 'event':
        return {
          bgColor: 'bg-amber-100',
          icon: <Calendar className="w-5 h-5 text-amber-600" />
        };
      case 'academic':
        return {
          bgColor: 'bg-blue-100',
          icon: <BookOpen className="w-5 h-5 text-blue-600" />
        };
      case 'holiday':
        return {
          bgColor: 'bg-green-100',
          icon: <Star className="w-5 h-5 text-green-600" />
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          icon: <Megaphone className="w-5 h-5 text-gray-600" />
        };
    }
  };

  const loadAnnouncements = async () => {
    try {
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('publish_date', { ascending: false })
        .limit(5);

      if (announcements) {
        setAnnouncements(announcements);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const loadActivity = async () => {
    // Load recent activities from various tables
    try {
      const today = new Date().toISOString().split('T')[0];
      const [newStudents, recentResults] = await Promise.all([
        supabase
          .from('students')
          .select('first_name, last_name, created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('results')
          .select('student_id, created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(3)
      ]);

      const activities: Activity[] = [];

      if (newStudents.data) {
        activities.push(
          ...newStudents.data.map(student => ({
            title: `New student enrolled: ${student.first_name} ${student.last_name}`,
            time: new Date(student.created_at).toLocaleDateString(),
            icon: <Users className="w-5 h-5 text-blue-600" />,
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600'
          }))
        );
      }

      if (recentResults.data) {
        activities.push(
          ...recentResults.data.map(result => ({
            title: 'Result published',
            time: new Date(result.created_at).toLocaleDateString(),
            icon: <BookOpen className="w-5 h-5 text-green-600" />,
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600'
          }))
        );
      }

      setRecentActivity(activities.sort((a, b) => 
        new Date(b.time).getTime() - new Date(a.time).getTime()
      ).slice(0, 5));
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    loadActivity();
  }, []);
  const { profile } = useAuth();
  interface Stats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    inventoryItems: number;
    todayAttendance: {
      students: number;
      teachers: number;
      percentage: number;
    };
    lowStock: number;
  }
  
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    inventoryItems: 0,
    todayAttendance: {
      students: 0,
      teachers: 0,
      percentage: 0,
    },
    lowStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [profile]);

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [
        studentsRes, 
        teachersRes, 
        classesRes, 
        inventoryRes,
        studentAttendanceRes,
        teacherAttendanceRes,
        lowStockRes
      ] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('inventory_items').select('id', { count: 'exact', head: true }),
        supabase.from('student_attendance')
          .select('id', { count: 'exact', head: true })
          .eq('attendance_date', today)
          .eq('status', 'present'),
        supabase.from('teacher_attendance')
          .select('id', { count: 'exact', head: true })
          .eq('attendance_date', today)
          .eq('status', 'present'),
        supabase.from('inventory_items')
          .select('id', { count: 'exact', head: true })
          .filter('current_stock', 'lt', 'minimum_stock')
      ]);

      const totalStudents = studentsRes.count || 0;
      const totalTeachers = teachersRes.count || 0;
      const presentStudents = studentAttendanceRes.count || 0;
      const presentTeachers = teacherAttendanceRes.count || 0;
      const attendancePercentage = totalStudents > 0 
        ? Math.round((presentStudents / totalStudents) * 100) 
        : 0;

      setStats({
        totalStudents,
        totalTeachers,
        totalClasses: classesRes.count || 0,
        inventoryItems: inventoryRes.count || 0,
        todayAttendance: {
          students: presentStudents,
          teachers: presentTeachers,
          percentage: attendancePercentage,
        },
        lowStock: lowStockRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards: StatsCard[] = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: <Users className="w-6 h-6" />,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: `${stats.todayAttendance.percentage}% present today`,
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: <GraduationCap className="w-6 h-6" />,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      change: `${stats.todayAttendance.teachers} present today`,
    },
    {
      title: 'Active Classes',
      value: stats.totalClasses,
      icon: <BookOpen className="w-6 h-6" />,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Inventory Items',
      value: stats.inventoryItems,
      icon: <Package className="w-6 h-6" />,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      change: stats.lowStock > 0 ? `${stats.lowStock} items low on stock` : undefined,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.full_name}
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your school today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <span className={stat.iconColor}>{stat.icon}</span>
                </div>
              </div>
              {stat.change && (
                <p className="text-sm text-gray-600">{stat.change}</p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Activity">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`${activity.bgColor} p-2 rounded-lg`}>
                  <span className={activity.iconColor}>{activity.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </Card>

        <Card title="Announcements & Events">
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`${getAnnouncementStyles(announcement.announcement_type).bgColor} p-2 rounded-lg`}>
                  <span className="text-gray-600">
                    {getAnnouncementStyles(announcement.announcement_type).icon}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{announcement.content}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {announcement.expiry_date
                      ? `Until ${new Date(announcement.expiry_date).toLocaleDateString()}`
                      : new Date(announcement.publish_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No announcements</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
