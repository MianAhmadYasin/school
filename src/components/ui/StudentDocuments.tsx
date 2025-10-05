import React, { useState, useEffect } from 'react';
import { Upload, Download, Trash2, File } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Table, TableRow, TableCell } from './Table';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type StudentDocument = Database['public']['Tables']['student_documents']['Row'];

interface StudentDocumentsProps {
  studentId: string;
}

export function StudentDocuments({ studentId }: StudentDocumentsProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [studentId]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;

    try {
      setUploading(true);
      const file = event.target.files[0];
      const documentType = event.target.getAttribute('data-document-type') || 'other';
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError, data } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase
        .from('student_documents')
        .insert([
          {
            student_id: studentId,
            document_type: documentType,
            document_url: data?.path || '',
            uploaded_by: user?.id || '',
          }
        ]);

      if (dbError) throw dbError;
      await loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, documentUrl: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('student-documents')
        .remove([documentUrl]);

      if (storageError) throw storageError;

      // Delete record from database
      const { error: dbError } = await supabase
        .from('student_documents')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
      await loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const handleDownload = async (documentUrl: string, documentType: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('student-documents')
        .download(documentUrl);

      if (error) throw error;

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentType}_${new Date().toISOString().split('T')[0]}.${documentUrl.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  return (
    <Card title="Student Documents">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {['birth_certificate', 'cnic', 'school_leaving', 'medical', 'other'].map((type) => (
            <div key={type} className="relative">
              <input
                type="file"
                id={`upload_${type}`}
                onChange={handleUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                data-document-type={type}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={uploading}
              />
              <Button variant="outline" disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" />
                Upload {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </Button>
            </div>
          ))}
        </div>

        <Table headers={['Document Type', 'Upload Date', 'Actions']}>
          {documents.length === 0 ? (
            <TableRow>
              <TableCell className="text-center text-gray-500" colSpan={3}>
                No documents uploaded
              </TableCell>
            </TableRow>
          ) : (
            documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <File className="w-5 h-5 text-gray-400" />
                    <span className="capitalize">{doc.document_type.replace(/_/g, ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(doc.document_url, doc.document_type)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id, doc.document_url)}
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
    </Card>
  );
}