export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      inventory_items: {
        Row: {
          id: string
          name: string
          category: 'stationery' | 'books' | 'electronics' | 'furniture' | 'supplies'
          quantity: number
          minimum_quantity: number
          unit_price: number
          location: string
          last_restocked: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'stationery' | 'books' | 'electronics' | 'furniture' | 'supplies'
          quantity?: number
          minimum_quantity?: number
          unit_price: number
          location: string
          last_restocked?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'stationery' | 'books' | 'electronics' | 'furniture' | 'supplies'
          quantity?: number
          minimum_quantity?: number
          unit_price?: number
          location?: string
          last_restocked?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      request_items: {
        Row: {
          id: string
          request_id: string
          item_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          request_id: string
          item_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          item_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      stationery_requests: {
        Row: {
          id: string
          requester_id: string
          department: string
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          request_date: string
          approval_date: string | null
          remarks: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          department: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          request_date?: string
          approval_date?: string | null
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          department?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          request_date?: string
          approval_date?: string | null
          remarks?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_documents: {
        Row: {
          id: string;
          student_id: string;
          document_type: string;
          document_url: string;
          uploaded_at: string;
          uploaded_by: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          document_type: string;
          document_url: string;
          uploaded_at?: string;
          uploaded_by: string;
        };
        Update: {
          document_type?: string;
          document_url?: string;
        };
      };
      
      parent_contacts: {
        Row: {
          id: string;
          student_id: string;
          relation: string;
          full_name: string;
          phone: string;
          email: string | null;
          cnic: string | null;
          occupation: string | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          relation: string;
          full_name: string;
          phone: string;
          email?: string | null;
          cnic?: string | null;
          occupation?: string | null;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          relation?: string;
          full_name?: string;
          phone?: string;
          email?: string | null;
          cnic?: string | null;
          occupation?: string | null;
          is_primary?: boolean;
        };
      };
      
      fee_records: {
        Row: {
          id: string;
          student_id: string;
          academic_year_id: string;
          month: string;
          amount: number;
          paid_amount: number;
          due_date: string;
          payment_date: string | null;
          payment_method: string | null;
          receipt_number: string | null;
          status: 'pending' | 'paid' | 'partial' | 'overdue';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          academic_year_id: string;
          month: string;
          amount: number;
          paid_amount?: number;
          due_date: string;
          payment_date?: string | null;
          payment_method?: string | null;
          receipt_number?: string | null;
          status?: 'pending' | 'paid' | 'partial' | 'overdue';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          paid_amount?: number;
          payment_date?: string | null;
          payment_method?: string | null;
          receipt_number?: string | null;
          status?: 'pending' | 'paid' | 'partial' | 'overdue';
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string
          role: 'admin' | 'teacher' | 'student' | 'manager'
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'teacher' | 'student' | 'manager'
          email: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'teacher' | 'student' | 'manager'
          email?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          status?: 'active' | 'inactive' | 'suspended'
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          announcement_type: 'general' | 'urgent' | 'academic' | 'event' | 'holiday'
          target_roles: ('admin' | 'teacher' | 'student' | 'manager')[]
          target_classes: string[] | null
          is_active: boolean
          publish_date: string
          expiry_date: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          announcement_type?: 'general' | 'urgent' | 'academic' | 'event' | 'holiday'
          target_roles?: ('admin' | 'teacher' | 'student' | 'manager')[]
          target_classes?: string[] | null
          is_active?: boolean
          publish_date?: string
          expiry_date?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          title?: string
          content?: string
          announcement_type?: 'general' | 'urgent' | 'academic' | 'event' | 'holiday'
          target_roles?: ('admin' | 'teacher' | 'student' | 'manager')[]
          target_classes?: string[] | null
          is_active?: boolean
          publish_date?: string
          expiry_date?: string | null
        }
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          admission_number: string
          first_name: string
          last_name: string
          father_name: string
          mother_name: string | null
          date_of_birth: string
          gender: string
          cnic: string | null
          current_class_id: string | null
          current_section_id: string | null
          admission_date: string
          admission_class_id: string | null
          address: string | null
          phone: string | null
          email: string | null
          status: 'active' | 'promoted' | 'transferred' | 'alumni' | 'discontinued'
          photo_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          admission_number: string
          first_name: string
          last_name: string
          father_name: string
          mother_name?: string | null
          date_of_birth: string
          gender: string
          cnic?: string | null
          current_class_id?: string | null
          current_section_id?: string | null
          admission_date: string
          admission_class_id?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          status?: 'active' | 'promoted' | 'transferred' | 'alumni' | 'discontinued'
          photo_url?: string | null
          notes?: string | null
        }
        Update: {
          user_id?: string | null
          admission_number?: string
          first_name?: string
          last_name?: string
          father_name?: string
          mother_name?: string | null
          date_of_birth?: string
          gender?: string
          cnic?: string | null
          current_class_id?: string | null
          current_section_id?: string | null
          status?: 'active' | 'promoted' | 'transferred' | 'alumni' | 'discontinued'
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {
      get_inventory_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_items: number
          low_stock_items: number
          total_value: number
          pending_requests: number
        }
      }
      process_stationery_request: {
        Args: {
          p_request_id: string
        }
        Returns: void
      }
    }
    Enums: {
      inventory_category: 'stationery' | 'books' | 'electronics' | 'furniture' | 'supplies'
      request_status: 'pending' | 'approved' | 'rejected' | 'completed'
      user_role: 'admin' | 'teacher' | 'student' | 'manager'
      user_status: 'active' | 'inactive' | 'suspended'
      student_status: 'active' | 'promoted' | 'transferred' | 'alumni' | 'discontinued'
    }
  }
}
