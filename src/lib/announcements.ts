import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type Announcement = Tables['announcements']['Row'];
type AnnouncementInsert = Tables['announcements']['Insert'];
type AnnouncementUpdate = Tables['announcements']['Update'];
type Notification = Tables['notifications']['Row'];
type NotificationInsert = Tables['notifications']['Insert'];

export type AnnouncementWithDetails = Announcement & {
  created_by_user?: { full_name: string; role: string };
};

export async function getAnnouncements(filters?: {
  targetRoles?: string[];
  targetClasses?: string[];
  announcementType?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase
    .from('announcements')
    .select(`
      *,
      created_by_user:created_by(full_name, role)
    `)
    .order('publish_date', { ascending: false });

  if (filters?.targetRoles && filters.targetRoles.length > 0) {
    query = query.overlaps('target_roles', filters.targetRoles);
  }

  if (filters?.targetClasses && filters.targetClasses.length > 0) {
    query = query.overlaps('target_classes', filters.targetClasses);
  }

  if (filters?.announcementType) {
    query = query.eq('announcement_type', filters.announcementType);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  if (filters?.startDate) {
    query = query.gte('publish_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('publish_date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as AnnouncementWithDetails[];
}

export async function getAnnouncement(id: string) {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      *,
      created_by_user:created_by(full_name, role)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as AnnouncementWithDetails;
}

export async function createAnnouncement(announcementData: AnnouncementInsert) {
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcementData)
    .select()
    .single();

  if (error) throw error;

  // Create notifications for target users
  await createAnnouncementNotifications(data);

  return data;
}

export async function updateAnnouncement(id: string, announcementData: AnnouncementUpdate) {
  const { data, error } = await supabase
    .from('announcements')
    .update(announcementData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createAnnouncementNotifications(announcement: Announcement) {
  // Get users based on target roles and classes
  let userQuery = supabase
    .from('user_profiles')
    .select('id, role');

  if (announcement.target_roles && announcement.target_roles.length > 0) {
    userQuery = userQuery.in('role', announcement.target_roles);
  }

  const { data: users, error: usersError } = await userQuery;

  if (usersError) throw usersError;

  if (!users || users.length === 0) return;

  // Create notifications for each user
  const notifications: NotificationInsert[] = users.map(user => ({
    user_id: user.id,
    title: announcement.title,
    message: announcement.content,
    notification_type: announcement.announcement_type,
    link: `/announcements/${announcement.id}`,
    metadata: {
      announcement_id: announcement.id,
      announcement_type: announcement.announcement_type
    }
  }));

  const { error: notificationsError } = await supabase
    .from('notifications')
    .insert(notifications);

  if (notificationsError) throw notificationsError;
}

export async function getNotifications(userId: string, filters?: {
  isRead?: boolean;
  notificationType?: string;
  limit?: number;
}) {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.isRead !== undefined) {
    query = query.eq('is_read', filters.isRead);
  }

  if (filters?.notificationType) {
    query = query.eq('notification_type', filters.notificationType);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Notification[];
}

export async function markNotificationAsRead(notificationId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}

export async function getUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

export async function getAnnouncementStats() {
  const { data, error } = await supabase
    .from('announcements')
    .select('announcement_type, is_active, publish_date')
    .gte('publish_date', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);

  if (error) throw error;

  const stats = data.reduce((acc, announcement) => {
    acc.total++;
    acc[announcement.announcement_type as keyof typeof acc]++;
    if (announcement.is_active) acc.active++;
    return acc;
  }, { 
    total: 0, 
    active: 0,
    general: 0, 
    urgent: 0, 
    academic: 0, 
    event: 0, 
    holiday: 0 
  });

  return stats;
}

export async function getActiveAnnouncementsForUser(userRole: string, userClassId?: string) {
  let query = supabase
    .from('announcements')
    .select(`
      *,
      created_by_user:created_by(full_name, role)
    `)
    .eq('is_active', true)
    .lte('publish_date', new Date().toISOString().split('T')[0])
    .order('publish_date', { ascending: false });

  // Filter by user role
  query = query.contains('target_roles', [userRole]);

  // Filter by class if specified
  if (userClassId) {
    query = query.or(`target_classes.is.null,target_classes.cs.{${userClassId}}`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as AnnouncementWithDetails[];
}

export async function createNotification(notificationData: NotificationInsert) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function sendBulkNotification(userIds: string[], title: string, message: string, notificationType = 'info', link?: string) {
  const notifications: NotificationInsert[] = userIds.map(userId => ({
    user_id: userId,
    title,
    message,
    notification_type: notificationType,
    link
  }));

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (error) throw error;
  return data;
}

