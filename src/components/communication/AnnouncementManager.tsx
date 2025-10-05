import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AnnouncementWithDetails
} from '../../lib/announcements';
import { getClasses } from '../../lib/academic';

export function AnnouncementManager() {
  const { hasPermission, user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementWithDetails[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageAnnouncements = hasPermission('manage_announcements');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [announcementsData, classesData] = await Promise.all([
        getAnnouncements(),
        getClasses()
      ]);
      
      setAnnouncements(announcementsData);
      setClasses(classesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    }
  };

  const handleCreateAnnouncement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const form = event.currentTarget;
      const formData = {
        title: (form.elements.namedItem('title') as HTMLInputElement).value,
        content: (form.elements.namedItem('content') as HTMLTextAreaElement).value,
        announcement_type: (form.elements.namedItem('announcement_type') as HTMLSelectElement).value,
        target_roles: Array.from((form.elements.namedItem('target_roles') as HTMLSelectElement).selectedOptions).map(option => option.value),
        target_classes: Array.from((form.elements.namedItem('target_classes') as HTMLSelectElement).selectedOptions).map(option => option.value),
        publish_date: (form.elements.namedItem('publish_date') as HTMLInputElement).value,
        expiry_date: (form.elements.namedItem('expiry_date') as HTMLInputElement).value || null,
        created_by: user?.id
      };

      const newAnnouncement = await createAnnouncement(formData);
      setAnnouncements(prev => [newAnnouncement, ...prev]);
      setIsCreateModalOpen(false);
      
      // Reset form
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAnnouncement = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAnnouncement) return;

    setLoading(true);
    setError(null);

    try {
      const form = event.currentTarget;
      const formData = {
        title: (form.elements.namedItem('title') as HTMLInputElement).value,
        content: (form.elements.namedItem('content') as HTMLTextAreaElement).value,
        announcement_type: (form.elements.namedItem('announcement_type') as HTMLSelectElement).value,
        target_roles: Array.from((form.elements.namedItem('target_roles') as HTMLSelectElement).selectedOptions).map(option => option.value),
        target_classes: Array.from((form.elements.namedItem('target_classes') as HTMLSelectElement).selectedOptions).map(option => option.value),
        publish_date: (form.elements.namedItem('publish_date') as HTMLInputElement).value,
        expiry_date: (form.elements.namedItem('expiry_date') as HTMLInputElement).value || null
      };

      const updatedAnnouncement = await updateAnnouncement(selectedAnnouncement.id, formData);
      setAnnouncements(prev => prev.map(a => a.id === selectedAnnouncement.id ? updatedAnnouncement : a));
      setIsEditModalOpen(false);
      setSelectedAnnouncement(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      await deleteAnnouncement(announcementId);
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement');
    }
  };

  const handleEditAnnouncement = (announcement: AnnouncementWithDetails) => {
    setSelectedAnnouncement(announcement);
    setIsEditModalOpen(true);
  };

  const getAnnouncementTypeColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'academic':
        return 'bg-blue-100 text-blue-800';
      case 'event':
        return 'bg-green-100 text-green-800';
      case 'holiday':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canManageAnnouncements) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-600">
          You don't have permission to manage announcements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Announcement Manager</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Create Announcement
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {announcement.title}
                  </h3>
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${getAnnouncementTypeColor(announcement.announcement_type)}`}>
                    {announcement.announcement_type}
                  </span>
                  {!announcement.is_active && (
                    <span className="inline-flex rounded-full px-2 text-xs font-semibold bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-3">
                  {announcement.content}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Target: {announcement.target_roles.join(', ')}</span>
                  <span>Published: {new Date(announcement.publish_date).toLocaleDateString()}</span>
                  {announcement.expiry_date && (
                    <span>Expires: {new Date(announcement.expiry_date).toLocaleDateString()}</span>
                  )}
                  <span>By: {announcement.created_by_user?.full_name}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEditAnnouncement(announcement)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDeleteAnnouncement(announcement.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        {announcements.length === 0 && (
          <Card className="p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No announcements</h3>
            <p className="mt-2 text-sm text-gray-600">
              Create your first announcement to get started.
            </p>
          </Card>
        )}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Announcement"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <Input
              name="title"
              type="text"
              required
              placeholder="Enter announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              name="content"
              rows={4}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter announcement content"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              name="announcement_type"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="academic">Academic</option>
              <option value="event">Event</option>
              <option value="holiday">Holiday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Roles
            </label>
            <select
              name="target_roles"
              multiple
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="manager">Manager</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple roles</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Target Classes (Optional)
            </label>
            <select
              name="target_classes"
              multiple
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">Leave empty to target all classes</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Publish Date
              </label>
              <Input
                name="publish_date"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expiry Date (Optional)
              </label>
              <Input
                name="expiry_date"
                type="date"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Announcement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Announcement Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAnnouncement(null);
        }}
        title="Edit Announcement"
      >
        {selectedAnnouncement && (
          <form onSubmit={handleUpdateAnnouncement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <Input
                name="title"
                type="text"
                required
                defaultValue={selectedAnnouncement.title}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Content
              </label>
              <textarea
                name="content"
                rows={4}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                defaultValue={selectedAnnouncement.content}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                name="announcement_type"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                defaultValue={selectedAnnouncement.announcement_type}
              >
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="academic">Academic</option>
                <option value="event">Event</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Target Roles
              </label>
              <select
                name="target_roles"
                multiple
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                defaultValue={selectedAnnouncement.target_roles}
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Publish Date
                </label>
                <Input
                  name="publish_date"
                  type="date"
                  required
                  defaultValue={selectedAnnouncement.publish_date}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry Date (Optional)
                </label>
                <Input
                  name="expiry_date"
                  type="date"
                  defaultValue={selectedAnnouncement.expiry_date || ''}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedAnnouncement(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Announcement'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

