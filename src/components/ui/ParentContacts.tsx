import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Phone, Mail } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { Table, TableRow, TableCell } from './Table';
import { Modal } from './Modal';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type ParentContact = Database['public']['Tables']['parent_contacts']['Row'];

interface ParentContactsProps {
  studentId: string;
}

export function ParentContacts({ studentId }: ParentContactsProps) {
  const [contacts, setContacts] = useState<ParentContact[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ParentContact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, [studentId]);

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('parent_contacts')
        .select('*')
        .eq('student_id', studentId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const { error } = await supabase
        .from('parent_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact');
    }
  };

  return (
    <Card title="Parent/Guardian Contacts">
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => { setSelectedContact(null); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        <Table headers={['Primary', 'Name', 'Relation', 'Contact Info', 'Actions']}>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500">
                No contacts added
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  {contact.is_primary && (
                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                      Primary
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{contact.full_name}</p>
                    {contact.occupation && (
                      <p className="text-sm text-gray-500">{contact.occupation}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{contact.relation}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{contact.phone}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{contact.email}</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedContact(contact); setShowModal(true); }}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition"
                      title="Edit"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </Table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedContact(null); }}
        title={selectedContact ? 'Edit Contact' : 'Add New Contact'}
      >
        <ContactForm
          contact={selectedContact}
          studentId={studentId}
          onClose={() => { setShowModal(false); setSelectedContact(null); loadContacts(); }}
        />
      </Modal>
    </Card>
  );
}

interface ContactFormProps {
  contact: ParentContact | null;
  studentId: string;
  onClose: () => void;
}

function ContactForm({ contact, studentId, onClose }: ContactFormProps) {
  const [formData, setFormData] = useState({
    relation: contact?.relation || '',
    full_name: contact?.full_name || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
    cnic: contact?.cnic || '',
    occupation: contact?.occupation || '',
    is_primary: contact?.is_primary || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (contact) {
        const { error } = await supabase
          .from('parent_contacts')
          .update(formData)
          .eq('id', contact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('parent_contacts')
          .insert([{
            ...formData,
            student_id: studentId,
          }]);
        if (error) throw error;
      }
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
          <select
            value={formData.relation}
            onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Relation</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Input
          label="Phone Number"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="CNIC"
          value={formData.cnic}
          onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
          placeholder="XXXXX-XXXXXXX-X"
        />
        <Input
          label="Occupation"
          value={formData.occupation}
          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_primary"
          checked={formData.is_primary}
          onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="is_primary" className="text-sm font-medium text-gray-700">
          Set as primary contact
        </label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
        </Button>
      </div>
    </form>
  );
}