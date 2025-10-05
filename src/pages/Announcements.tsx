import React, { useEffect, useState } from 'react';
import { Plus, Bell, AlertCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  announcement_type: string;
  publish_date: string;
  created_at: string;
}

export function Announcements() {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('publish_date', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'academic':
        return 'bg-blue-100 text-blue-800';
      case 'event':
        return 'bg-purple-100 text-purple-800';
      case 'holiday':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'urgent') {
      return <AlertCircle className="w-5 h-5" />;
    }
    return <Bell className="w-5 h-5" />;
  };

  if (loading) {
    return <div>Loading announcements...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">School news and updates</p>
        </div>
        {profile?.role === 'admin' && (
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No announcements yet</p>
            </div>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-full ${getTypeColor(
                    announcement.announcement_type
                  )}`}
                >
                  {getTypeIcon(announcement.announcement_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {announcement.title}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(
                        announcement.announcement_type
                      )}`}
                    >
                      {announcement.announcement_type}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{announcement.content}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(announcement.publish_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
