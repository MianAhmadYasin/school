# School Management System

A comprehensive web-based school management system for non-fee-based educational organizations (up to Matric level). Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### 🎯 Core Features
- **Role-Based Access Control**: Admin, Teacher, Student, Manager, and Parent portals
- **Student Management**: Complete CRUD operations for student records
- **Teacher Management**: Staff records, qualifications, and assignments
- **Academic Management**: Classes, subjects, terms, and curriculum
- **Results System**: Excel-based calculation logic with automated pass/fail rules
- **Attendance Management**: Biometric integration and tracking
- **Inventory Management**: Stationery, books, and equipment tracking
- **Certificate Generation**: Automated document creation (Leaving Certificates, Report Cards)
- **Communication**: Announcements and notifications
- **Analytics Dashboard**: Comprehensive reporting and insights

### 🔐 Security Features
- Supabase Authentication with Row Level Security (RLS)
- Role-based permissions and access control
- Secure data validation and sanitization

### 📊 Excel-Based Results System
- **Term-wise Calculations**: First, Second, and Third term results
- **Automated Pass/Fail Rules**:
  - 4+ subjects absent → Final Result = Absent
  - 2-3 subjects absent → Final Result = Fail
  - 2+ subjects failed → Final Result = Fail
  - 1 fail + 1 absent → Final Result = Fail
  - Else → Final Result = Pass
- **Promotion Logic**: Automatic promotion based on performance
- **Report Card Generation**: PDF export with detailed results

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Build Tool**: Vite
- **PDF Generation**: jsPDF, jsPDF-AutoTable
- **Excel Processing**: xlsx
- **Icons**: Lucide React
- **Routing**: React Router DOM

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL migrations in the `supabase/migrations/` directory
   - Enable Row Level Security (RLS) policies
   - Set up authentication providers

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

## Database Setup

The system includes comprehensive database migrations:

1. **Initial Schema** (`20251004142809_create_school_management_system.sql`)
   - User management and authentication
   - Academic structure (classes, subjects, terms)
   - Student and teacher management
   - Marks and results system
   - Attendance tracking
   - Inventory management
   - Certificates and documents
   - Communication system

2. **Inventory Management** (`20251004142810_create_inventory_management.sql`)
   - Inventory items and categories
   - Stationery requests
   - Stock tracking and alerts

3. **Functions** (`20251004142811_create_inventory_functions.sql`)
   - Database functions for inventory statistics
   - RPC functions for complex operations

## User Roles and Permissions

### Admin
- Full system access
- User management
- System configuration
- Analytics and reporting

### Teacher
- Student attendance management
- Grade input and management
- Class and subject assignments
- Student data access

### Student
- Personal academic records
- Results and grades
- Attendance history
- Announcements

### Manager
- Inventory management
- Stationery requests
- Stock tracking
- Financial reports

### Parent
- Child's academic progress
- Attendance monitoring
- Fee status
- Communication with school

## Key Components

### Pages
- **Dashboard**: Role-specific overview
- **Student Management**: CRUD operations for students
- **Teacher Management**: Staff records and assignments
- **Results**: Excel-based calculation system
- **Attendance**: Biometric integration
- **Inventory**: Stock management
- **Certificates**: Document generation
- **Analytics**: Reporting and insights

### Components
- **UI Components**: Button, Card, Input, Modal, Table
- **Layout Components**: DashboardLayout, AdminLayout, ManagerLayout
- **Feature Components**: BiometricAttendance, CertificateGenerator, AnalyticsDashboard

### Libraries
- **Database Operations**: Comprehensive CRUD functions
- **Result Calculator**: Excel-based logic implementation
- **PDF Generation**: Certificate and report card creation
- **Authentication**: Role-based access control

## Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   ├── layout/         # Layout components
│   ├── attendance/     # Attendance features
│   ├── certificates/   # Certificate generation
│   ├── communication/  # Announcements and notifications
│   └── analytics/      # Dashboard and reporting
├── contexts/           # React contexts (Auth)
├── lib/               # Database operations and utilities
├── pages/             # Application pages
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Roadmap

- [ ] Mobile app for parents
- [ ] Library management system
- [ ] Transport management
- [ ] Event scheduling
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Offline capabilities

---

**Note**: This system is designed for non-fee-based educational organizations and includes all necessary features for comprehensive school management up to Matric level.