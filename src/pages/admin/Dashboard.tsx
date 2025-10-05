import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  Plus,
  Eye
} from 'lucide-react';

interface StatsCard {
  title: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

interface RecentActivity {
  id: string;
  type: 'student' | 'teacher' | 'attendance' | 'announcement';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<StatsCard[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setStats([
        {
          title: 'Total Students',
          value: 1247,
          change: 8.2,
          icon: <Users className="w-6 h-6" />,
          color: 'text-blue-600 bg-blue-100'
        },
        {
          title: 'Active Teachers',
          value: 67,
          change: 3.1,
          icon: <GraduationCap className="w-6 h-6" />,
          color: 'text-green-600 bg-green-100'
        },
        {
          title: 'Classes & Sections',
          value: 42,
          change: 0,
          icon: <BookOpen className="w-6 h-6" />,
          color: 'text-purple-600 bg-purple-100'
        },
        {
          title: 'Today\'s Attendance',
          value: 94.2,
          change: 2.1,
          icon: <Calendar className="w-6 h-6" />,
          color: 'text-orange-600 bg-orange-100'
        }
      ]);

      setRecentActivities([
        {
          id: '1',
          type: 'student',
          message: 'New student registration: Ahmed Ali (Class 9-A)',
          timestamp: '2 minutes ago',
          status: 'success'
        },
        {
          id: '2',
          type: 'attendance',
          message: 'Attendance marked for Class 10-B (45/48 students present)',
          timestamp: '15 minutes ago',
          status: 'info'
        },
        {
          id: '3',
          type: 'teacher',
          message: 'Teacher profile updated: Ms. Sarah Khan',
          timestamp: '1 hour ago',
          status: 'success'
        },
        {
          id: '4',
          type: 'announcement',
          message: 'New announcement published: Parent-Teacher Meeting',
          timestamp: '2 hours ago',
          status: 'info'
        },
        {
          id: '5',
          type: 'student',
          message: 'Low attendance alert: Class 8-C (78% attendance)',
          timestamp: '3 hours ago',
          status: 'warning'
        }
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'teacher':
        return <GraduationCap className="w-4 h-4 text-green-500" />;
      case 'attendance':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'announcement':
        return <FileText className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back, {profile?.full_name || 'Admin'}
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening at your school today
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option>Current Term (2024-25)</option>
            <option>Previous Term (2023-24)</option>
          </select>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Quick Action
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}{stat.title.includes('Attendance') ? '%' : ''}
                  </p>
                  {stat.change !== undefined && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`w-4 h-4 ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                      <span className={`text-sm font-medium ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change >= 0 ? '+' : ''}{stat.change}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View All
              </Button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.type)}
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions & Analytics */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="secondary">
                <Plus className="w-4 h-4 mr-2" />
                Add New Student
              </Button>
              <Button className="w-full justify-start" variant="secondary">
                <Calendar className="w-4 h-4 mr-2" />
                Mark Attendance
              </Button>
              <Button className="w-full justify-start" variant="secondary">
                <FileText className="w-4 h-4 mr-2" />
                Create Announcement
              </Button>
              <Button className="w-full justify-start" variant="secondary">
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate Reports
              </Button>
            </div>
          </Card>

          {/* System Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Database</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Backup</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">Up to date</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-yellow-600">75% used</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}