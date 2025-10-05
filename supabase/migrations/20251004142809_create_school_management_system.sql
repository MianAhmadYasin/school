/*
  # Ghani Grammar School Management System - Complete Database Schema

  ## Overview
  Complete database structure for a comprehensive school management system including:
  - User authentication and role-based access control
  - Student and teacher management
  - Academic results with 3-term system
  - Attendance tracking
  - Inventory and stationery management
  - Certificate generation tracking
  - Notifications and announcements

  ## New Tables

  ### 1. User Management
    - `user_profiles` - Extended user information with roles
      - Links to auth.users
      - Stores role (admin, teacher, student, manager)
      - Contact information and status

  ### 2. Student Management
    - `classes` - Class definitions (1-10, etc.)
    - `sections` - Section divisions (A, B, C, etc.)
    - `students` - Complete student records
      - Personal information
      - Admission details
      - Parent contact
      - Current status (active, promoted, transferred, alumni)
    - `student_promotions` - Historical promotion records

  ### 3. Teacher/Staff Management
    - `teachers` - Teacher and staff records
      - Personal and professional details
      - Qualifications and specializations
      - Employment dates
    - `teacher_assignments` - Class and subject assignments
    - `teacher_documents` - Generated certificates and letters

  ### 4. Academic System
    - `subjects` - Subject master list
    - `class_subjects` - Subjects per class
    - `terms` - Academic term definitions (First, Second, Third)
    - `marks` - Student marks per subject per term
    - `results` - Consolidated results per term
    - `final_results` - Combined final results across all terms

  ### 5. Attendance
    - `student_attendance` - Daily student attendance
    - `teacher_attendance` - Daily teacher/staff attendance

  ### 6. Inventory & Stationery
    - `inventory_categories` - Categories (books, stationery, etc.)
    - `inventory_items` - Item master with stock levels
    - `inventory_transactions` - Stock in/out movements
    - `student_distributions` - Items issued to students
    - `stock_alerts` - Low stock alert configurations

  ### 7. Certificates & Documents
    - `certificate_templates` - Template configurations
    - `issued_certificates` - Certificate issuance records

  ### 8. Communication
    - `announcements` - School-wide announcements
    - `notifications` - User-specific notifications
    - `parent_contacts` - Parent/guardian contact details

  ### 9. System Configuration
    - `academic_years` - Academic year settings
    - `school_settings` - Global system settings
    - `permissions` - Role-based permission matrix

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Role-based access policies for admin, teacher, student, manager
  - Audit fields (created_at, updated_at) on all tables
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER MANAGEMENT
-- =====================================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'manager');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Extended user profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  avatar_url text,
  status user_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ACADEMIC STRUCTURE
-- =====================================================

-- Academic years
CREATE TABLE IF NOT EXISTS academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year_name text NOT NULL UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

-- Classes
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL UNIQUE,
  class_order integer NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Sections
CREATE TABLE IF NOT EXISTS sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  section_name text NOT NULL,
  capacity integer DEFAULT 40,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, section_name)
);

ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name text NOT NULL UNIQUE,
  subject_code text UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- Class subjects (which subjects are taught in which class)
CREATE TABLE IF NOT EXISTS class_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  total_marks integer DEFAULT 100,
  passing_marks integer DEFAULT 33,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, subject_id)
);

ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;

-- Terms
CREATE TYPE term_type AS ENUM ('first', 'second', 'third');

CREATE TABLE IF NOT EXISTS terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid REFERENCES academic_years(id) ON DELETE CASCADE,
  term_type term_type NOT NULL,
  term_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  weightage integer DEFAULT 33,
  created_at timestamptz DEFAULT now(),
  UNIQUE(academic_year_id, term_type)
);

ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. STUDENT MANAGEMENT
-- =====================================================

CREATE TYPE student_status AS ENUM ('active', 'promoted', 'transferred', 'alumni', 'discontinued');

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  admission_number text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  father_name text NOT NULL,
  mother_name text,
  date_of_birth date NOT NULL,
  gender text NOT NULL,
  cnic text,
  
  -- Academic info
  current_class_id uuid REFERENCES classes(id),
  current_section_id uuid REFERENCES sections(id),
  admission_date date NOT NULL,
  admission_class_id uuid REFERENCES classes(id),
  
  -- Contact info
  address text,
  phone text,
  email text,
  
  -- Status
  status student_status DEFAULT 'active',
  
  -- Metadata
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Parent/Guardian contacts
CREATE TABLE IF NOT EXISTS parent_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  relation text NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  cnic text,
  occupation text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parent_contacts ENABLE ROW LEVEL SECURITY;

-- Student promotions history
CREATE TABLE IF NOT EXISTS student_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  from_class_id uuid REFERENCES classes(id),
  from_section_id uuid REFERENCES sections(id),
  to_class_id uuid REFERENCES classes(id),
  to_section_id uuid REFERENCES sections(id),
  academic_year_id uuid REFERENCES academic_years(id),
  promotion_date date NOT NULL,
  remarks text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_promotions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. TEACHER/STAFF MANAGEMENT
-- =====================================================

CREATE TYPE teacher_status AS ENUM ('active', 'on_leave', 'resigned', 'terminated');

CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  employee_number text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  father_name text,
  date_of_birth date,
  gender text NOT NULL,
  cnic text UNIQUE NOT NULL,
  
  -- Professional info
  qualification text NOT NULL,
  specialization text,
  experience_years integer DEFAULT 0,
  
  -- Employment
  joining_date date NOT NULL,
  designation text NOT NULL,
  department text,
  salary numeric(10, 2),
  
  -- Contact
  phone text NOT NULL,
  email text,
  address text,
  
  -- Status
  status teacher_status DEFAULT 'active',
  leaving_date date,
  
  -- Metadata
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Teacher class and subject assignments
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES academic_years(id),
  is_class_teacher boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, class_id, section_id, subject_id, academic_year_id)
);

ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Teacher documents (certificates, letters)
CREATE TYPE document_type AS ENUM ('joining_letter', 'experience_letter', 'leaving_letter', 'other');

CREATE TABLE IF NOT EXISTS teacher_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_url text,
  issued_date date NOT NULL,
  issued_by uuid REFERENCES user_profiles(id),
  remarks text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teacher_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. MARKS AND RESULTS
-- =====================================================

-- Individual marks per subject per term
CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id),
  section_id uuid REFERENCES sections(id),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  term_id uuid REFERENCES terms(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES academic_years(id),
  
  obtained_marks numeric(5, 2) NOT NULL,
  total_marks numeric(5, 2) NOT NULL,
  passing_marks numeric(5, 2) NOT NULL,
  is_absent boolean DEFAULT false,
  
  entered_by uuid REFERENCES user_profiles(id),
  entered_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(student_id, subject_id, term_id)
);

ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Results per term
CREATE TYPE result_status AS ENUM ('pass', 'fail', 'promoted', 'detained');

CREATE TABLE IF NOT EXISTS results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id),
  section_id uuid REFERENCES sections(id),
  term_id uuid REFERENCES terms(id) ON DELETE CASCADE,
  academic_year_id uuid REFERENCES academic_years(id),
  
  total_marks numeric(8, 2) NOT NULL,
  obtained_marks numeric(8, 2) NOT NULL,
  percentage numeric(5, 2) NOT NULL,
  grade text,
  
  subjects_failed integer DEFAULT 0,
  result_status result_status NOT NULL,
  
  remarks text,
  generated_at timestamptz DEFAULT now(),
  
  UNIQUE(student_id, term_id)
);

ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Final results (combined all terms)
CREATE TABLE IF NOT EXISTS final_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id),
  section_id uuid REFERENCES sections(id),
  academic_year_id uuid REFERENCES academic_years(id),
  
  term1_percentage numeric(5, 2),
  term2_percentage numeric(5, 2),
  term3_percentage numeric(5, 2),
  
  total_marks numeric(10, 2) NOT NULL,
  obtained_marks numeric(10, 2) NOT NULL,
  final_percentage numeric(5, 2) NOT NULL,
  final_grade text,
  
  result_status result_status NOT NULL,
  
  remarks text,
  generated_at timestamptz DEFAULT now(),
  
  UNIQUE(student_id, academic_year_id)
);

ALTER TABLE final_results ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. ATTENDANCE
-- =====================================================

CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half_day', 'leave');

-- Student attendance
CREATE TABLE IF NOT EXISTS student_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id),
  section_id uuid REFERENCES sections(id),
  attendance_date date NOT NULL,
  status attendance_status NOT NULL,
  check_in_time time,
  remarks text,
  marked_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, attendance_date)
);

ALTER TABLE student_attendance ENABLE ROW LEVEL SECURITY;

-- Teacher attendance
CREATE TABLE IF NOT EXISTS teacher_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status attendance_status NOT NULL,
  check_in_time time,
  check_out_time time,
  remarks text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, attendance_date)
);

ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. INVENTORY & STATIONERY
-- =====================================================

CREATE TABLE IF NOT EXISTS inventory_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES inventory_categories(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  item_code text UNIQUE,
  description text,
  unit text NOT NULL,
  
  current_stock numeric(10, 2) DEFAULT 0,
  minimum_stock numeric(10, 2) DEFAULT 0,
  unit_price numeric(10, 2),
  
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE TYPE transaction_type AS ENUM ('in', 'out', 'adjustment', 'return');

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  quantity numeric(10, 2) NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  
  reference_number text,
  supplier_name text,
  remarks text,
  
  performed_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Items distributed to students
CREATE TABLE IF NOT EXISTS student_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity numeric(10, 2) NOT NULL,
  distribution_date date NOT NULL DEFAULT CURRENT_DATE,
  academic_year_id uuid REFERENCES academic_years(id),
  
  remarks text,
  distributed_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_distributions ENABLE ROW LEVEL SECURITY;

-- Stock alerts
CREATE TABLE IF NOT EXISTS stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  alert_date date DEFAULT CURRENT_DATE,
  current_stock numeric(10, 2),
  minimum_stock numeric(10, 2),
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CERTIFICATES
-- =====================================================

CREATE TYPE certificate_type AS ENUM (
  'leaving_certificate', 
  'character_certificate',
  'joining_letter',
  'experience_letter',
  'leaving_letter'
);

CREATE TABLE IF NOT EXISTS certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_type certificate_type NOT NULL UNIQUE,
  template_name text NOT NULL,
  template_content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS issued_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_type certificate_type NOT NULL,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  
  certificate_number text UNIQUE NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  
  certificate_data jsonb,
  pdf_url text,
  
  issued_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT check_subject CHECK (
    (student_id IS NOT NULL AND teacher_id IS NULL) OR
    (student_id IS NULL AND teacher_id IS NOT NULL)
  )
);

ALTER TABLE issued_certificates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. COMMUNICATION
-- =====================================================

CREATE TYPE announcement_type AS ENUM ('general', 'urgent', 'academic', 'event', 'holiday');

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  announcement_type announcement_type DEFAULT 'general',
  
  target_roles user_role[] DEFAULT ARRAY['admin', 'teacher', 'student', 'manager']::user_role[],
  target_classes uuid[],
  
  is_active boolean DEFAULT true,
  publish_date date DEFAULT CURRENT_DATE,
  expiry_date date,
  
  created_by uuid REFERENCES user_profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text DEFAULT 'info',
  
  is_read boolean DEFAULT false,
  read_at timestamptz,
  
  link text,
  metadata jsonb,
  
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. SYSTEM CONFIGURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS school_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  module text NOT NULL,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role, module)
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- User Profiles: Users can view their own profile, admins can view all
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students: Admins and teachers can view, students can view own record
CREATE POLICY "Admins and teachers can view students"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Students can view own record"
  ON students FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teachers: Admins can manage, teachers can view all
CREATE POLICY "Admins and teachers can view teachers"
  ON teachers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admins can insert teachers"
  ON teachers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update teachers"
  ON teachers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Marks: Teachers can enter/edit, students can view own, admins can view all
CREATE POLICY "Teachers can manage marks"
  ON marks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Students can view own marks"
  ON marks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id = marks.student_id AND user_id = auth.uid()
    )
  );

-- Results: Similar to marks
CREATE POLICY "Teachers and admins can view results"
  ON results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Students can view own results"
  ON results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id = results.student_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage results"
  ON results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Attendance: Teachers can manage, students can view own
CREATE POLICY "Teachers and admins can manage student attendance"
  ON student_attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Students can view own attendance"
  ON student_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE id = student_attendance.student_id AND user_id = auth.uid()
    )
  );

-- Inventory: Admins and managers can manage
CREATE POLICY "Admins and managers can view inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can manage inventory"
  ON inventory_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can manage transactions"
  ON inventory_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Announcements: All authenticated can view active announcements
CREATE POLICY "Users can view announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = ANY(target_roles)
    )
  );

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications: Users can view own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- General policies for reference tables (classes, subjects, etc.)
-- Allow all authenticated users to read, only admins to modify

CREATE POLICY "All can view classes"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All can view sections"
  ON sections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sections"
  ON sections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All can view academic years"
  ON academic_years FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage academic years"
  ON academic_years FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "All can view terms"
  ON terms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage terms"
  ON terms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(current_class_id, current_section_id);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(status);
CREATE INDEX IF NOT EXISTS idx_marks_student_term ON marks(student_id, term_id);
CREATE INDEX IF NOT EXISTS idx_results_student_term ON results(student_id, term_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON student_attendance(student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_date ON teacher_attendance(teacher_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, publish_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert school settings
INSERT INTO school_settings (setting_key, setting_value, description) VALUES
  ('school_name', '"Ghani Grammar School"', 'Official school name'),
  ('school_address', '"Address Line Here"', 'School address'),
  ('school_phone', '"+92-XXX-XXXXXXX"', 'Contact number'),
  ('school_email', '"info@ghanischool.edu"', 'Official email'),
  ('organization_name', '"Ghani Welfare Foundation"', 'Parent organization'),
  ('logo_url', '""', 'School logo URL'),
  ('pass_percentage', '33', 'Minimum passing percentage'),
  ('max_fail_subjects', '1', 'Maximum subjects allowed to fail for promotion')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (role, module, can_view, can_create, can_edit, can_delete) VALUES
  -- Admin permissions
  ('admin', 'students', true, true, true, true),
  ('admin', 'teachers', true, true, true, true),
  ('admin', 'marks', true, true, true, true),
  ('admin', 'results', true, true, true, true),
  ('admin', 'attendance', true, true, true, true),
  ('admin', 'inventory', true, true, true, true),
  ('admin', 'certificates', true, true, true, true),
  ('admin', 'announcements', true, true, true, true),
  ('admin', 'settings', true, true, true, true),
  
  -- Teacher permissions
  ('teacher', 'students', true, false, false, false),
  ('teacher', 'teachers', true, false, false, false),
  ('teacher', 'marks', true, true, true, false),
  ('teacher', 'results', true, false, false, false),
  ('teacher', 'attendance', true, true, true, false),
  ('teacher', 'announcements', true, false, false, false),
  
  -- Student permissions
  ('student', 'marks', true, false, false, false),
  ('student', 'results', true, false, false, false),
  ('student', 'attendance', true, false, false, false),
  ('student', 'certificates', true, false, false, false),
  ('student', 'announcements', true, false, false, false),
  
  -- Manager permissions
  ('manager', 'inventory', true, true, true, true),
  ('manager', 'announcements', true, false, false, false)
ON CONFLICT (role, module) DO NOTHING;

-- Insert default inventory categories
INSERT INTO inventory_categories (category_name, description) VALUES
  ('Books', 'Textbooks and notebooks'),
  ('Stationery', 'Pens, pencils, and other stationery items'),
  ('Uniforms', 'School uniforms and accessories'),
  ('Sports Equipment', 'Sports and physical education items'),
  ('Other', 'Miscellaneous items')
ON CONFLICT (category_name) DO NOTHING;