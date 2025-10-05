# Ghani Grammar School Management System (GG-SMS)

A comprehensive school management system built for **Ghani Grammar School**, operated by **Ghani Welfare Foundation**.

## Features

### Role-Based Access Control
- **Admin Portal**: Full system access and management
- **Teacher Portal**: Mark entry, attendance tracking, class management
- **Student Portal**: View results, attendance, certificates
- **Manager Portal**: Inventory and stationery management

### Core Modules
- Student Management (admission, profiles, promotions)
- Teacher/Staff Management (assignments, documents)
- Academic Management (classes, subjects, terms)
- Results Management (3-term system with auto-calculation)
- Attendance Tracking (students and teachers)
- Inventory & Stationery (stock management, distributions)
- Certificate Generation (leaving, character, experience letters)
- Announcements & Notifications
- Settings & Configuration

## Getting Started

### 1. Database Setup

The database schema has already been created automatically. You can verify by checking Supabase:

```bash
# View tables
supabase db list-tables
```

### 2. Create Initial Admin User

You need to create your first admin user to access the system:

**Option A: Using Supabase Dashboard**
1. Go to your Supabase Dashboard
2. Navigate to Authentication > Users
3. Click "Add User" and create an account
4. Copy the user ID

**Option B: Using SQL**
Run this in Supabase SQL Editor:

```sql
-- Create admin user profile (replace USER_ID with actual user ID from auth.users)
INSERT INTO user_profiles (id, role, email, full_name, status)
VALUES (
  'YOUR_USER_ID_HERE',
  'admin',
  'admin@ghanischool.edu',
  'Admin User',
  'active'
);
```

### 3. Add Sample Data (Optional)

To test the system, you can add sample data:

```sql
-- Add Classes
INSERT INTO classes (class_name, class_order) VALUES
  ('Class 1', 1),
  ('Class 2', 2),
  ('Class 3', 3),
  ('Class 4', 4),
  ('Class 5', 5),
  ('Class 6', 6),
  ('Class 7', 7),
  ('Class 8', 8),
  ('Class 9', 9),
  ('Class 10', 10);

-- Add Subjects
INSERT INTO subjects (subject_name, subject_code) VALUES
  ('English', 'ENG'),
  ('Mathematics', 'MATH'),
  ('Science', 'SCI'),
  ('Urdu', 'URD'),
  ('Islamiyat', 'ISL'),
  ('Social Studies', 'SST'),
  ('Computer Science', 'CS');

-- Add Academic Year
INSERT INTO academic_years (year_name, start_date, end_date, is_current) VALUES
  ('2024-2025', '2024-04-01', '2025-03-31', true);

-- Add Terms (get academic_year_id first)
INSERT INTO terms (academic_year_id, term_type, term_name, start_date, end_date, weightage)
SELECT
  id,
  'first',
  'First Term',
  '2024-04-01',
  '2024-08-31',
  33
FROM academic_years WHERE year_name = '2024-2025';

INSERT INTO terms (academic_year_id, term_type, term_name, start_date, end_date, weightage)
SELECT
  id,
  'second',
  'Second Term',
  '2024-09-01',
  '2024-12-31',
  33
FROM academic_years WHERE year_name = '2024-2025';

INSERT INTO terms (academic_year_id, term_type, term_name, start_date, end_date, weightage)
SELECT
  id,
  'third',
  'Third Term',
  '2025-01-01',
  '2025-03-31',
  34
FROM academic_years WHERE year_name = '2024-2025';
```

### 4. Login

Navigate to the application and login with your admin credentials.

## System Architecture

### Database Tables

**User Management**
- `user_profiles` - Extended user info with roles

**Academic Structure**
- `academic_years` - School years
- `classes` - Grade levels
- `sections` - Class divisions
- `subjects` - Subject master
- `class_subjects` - Subject mappings
- `terms` - Academic terms

**Student Management**
- `students` - Student records
- `parent_contacts` - Guardian info
- `student_promotions` - History

**Teacher Management**
- `teachers` - Staff records
- `teacher_assignments` - Class/subject assignments
- `teacher_documents` - Generated certificates

**Academic Records**
- `marks` - Subject marks per term
- `results` - Term results
- `final_results` - Annual results

**Attendance**
- `student_attendance`
- `teacher_attendance`

**Inventory**
- `inventory_categories`
- `inventory_items`
- `inventory_transactions`
- `student_distributions`

**Communication**
- `announcements`
- `notifications`
- `issued_certificates`

**Configuration**
- `school_settings`
- `permissions`

### Result Calculation Logic

The system uses a 3-term evaluation system:

**Pass/Fail Rules:**
- Pass if failed in 0-1 subjects
- Fail if failed in 2 or more subjects
- Configurable via Settings

**Final Result:**
- Combines all three terms
- Weighted average calculation
- Automatic grade assignment

## Security

The system implements:
- Row Level Security (RLS) on all tables
- Role-based access control
- Secure authentication via Supabase
- Permission matrix for fine-grained access

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck
```

## Future Enhancements

- PDF generation for certificates and reports
- SMS/Email notifications
- Biometric attendance integration
- Library management module
- Transport management
- Fee management
- Parent mobile app
- Automated backups

## Support

For issues or questions, contact the system administrator.

---

**Developed for Ghani Welfare Foundation**
