// Mock authentication for development/testing
// This will be used when Supabase is not configured

export interface MockUser {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'manager' | 'parent' | 'accountant' | 'librarian';
  full_name: string;
  phone?: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  department?: string;
  designation?: string;
  joining_date?: string;
}

export const mockUsers: MockUser[] = [
  {
    id: '1',
    email: 'admin@school.com',
    role: 'admin',
    full_name: 'Admin User',
    phone: '+1234567890',
    status: 'active',
    department: 'Administration',
    designation: 'Principal',
    joining_date: '2020-01-01'
  },
  {
    id: '2',
    email: 'teacher@school.com',
    role: 'teacher',
    full_name: 'John Teacher',
    phone: '+1234567891',
    status: 'active',
    department: 'Academic',
    designation: 'Senior Teacher',
    joining_date: '2021-01-01'
  },
  {
    id: '3',
    email: 'student@school.com',
    role: 'student',
    full_name: 'Jane Student',
    phone: '+1234567892',
    status: 'active',
    department: 'Academic',
    joining_date: '2023-01-01'
  },
  {
    id: '4',
    email: 'manager@school.com',
    role: 'manager',
    full_name: 'Manager User',
    phone: '+1234567893',
    status: 'active',
    department: 'Management',
    designation: 'Operations Manager',
    joining_date: '2020-06-01'
  }
];

export function mockSignIn(email: string, password: string): Promise<{ user: MockUser | null; error: string | null }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email);
      
      if (!user) {
        resolve({ user: null, error: 'User not found' });
        return;
      }
      
      // Simple password check (in real app, this would be hashed)
      const expectedPassword = email.split('@')[0] + '123';
      if (password !== expectedPassword) {
        resolve({ user: null, error: 'Invalid password' });
        return;
      }
      
      resolve({ user, error: null });
    }, 1000); // Simulate network delay
  });
}

export function mockSignOut(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
}
