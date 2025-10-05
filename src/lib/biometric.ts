import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type StudentAttendance = Tables['student_attendance']['Row'];
type TeacherAttendance = Tables['teacher_attendance']['Row'];

export interface BiometricDevice {
  id: string;
  name: string;
  location: string;
  deviceType: 'fingerprint' | 'face' | 'card' | 'iris';
  isActive: boolean;
  lastSync: string;
  ipAddress: string;
  port: number;
}

export interface BiometricRecord {
  id: string;
  deviceId: string;
  userId: string;
  userType: 'student' | 'teacher';
  timestamp: string;
  status: 'success' | 'failed' | 'duplicate';
  biometricData?: string; // Encrypted biometric template
}

export interface AttendanceSyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  errors: string[];
}

// Mock biometric device management (in real implementation, this would connect to actual devices)
export class BiometricManager {
  private devices: BiometricDevice[] = [];
  private isConnected = false;

  constructor() {
    this.initializeDevices();
  }

  private initializeDevices() {
    // Mock devices - in real implementation, these would be discovered from network
    this.devices = [
      {
        id: 'device-001',
        name: 'Main Gate Scanner',
        location: 'Main Entrance',
        deviceType: 'fingerprint',
        isActive: true,
        lastSync: new Date().toISOString(),
        ipAddress: '192.168.1.100',
        port: 8080
      },
      {
        id: 'device-002',
        name: 'Library Scanner',
        location: 'Library',
        deviceType: 'face',
        isActive: true,
        lastSync: new Date().toISOString(),
        ipAddress: '192.168.1.101',
        port: 8080
      },
      {
        id: 'device-003',
        name: 'Staff Room Scanner',
        location: 'Staff Room',
        deviceType: 'card',
        isActive: false,
        lastSync: new Date().toISOString(),
        ipAddress: '192.168.1.102',
        port: 8080
      }
    ];
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    try {
      // Mock connection - in real implementation, this would establish TCP/IP connection
      await this.mockConnection(device);
      device.isActive = true;
      device.lastSync = new Date().toISOString();
      this.isConnected = true;
      return true;
    } catch (error) {
      device.isActive = false;
      throw new Error(`Failed to connect to device: ${error}`);
    }
  }

  private async mockConnection(device: BiometricDevice): Promise<void> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock connection failure for device-003
    if (device.id === 'device-003') {
      throw new Error('Connection timeout');
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    device.isActive = false;
    this.isConnected = false;
    return true;
  }

  async getDevices(): Promise<BiometricDevice[]> {
    return this.devices;
  }

  async getDeviceStatus(deviceId: string): Promise<BiometricDevice | null> {
    return this.devices.find(d => d.id === deviceId) || null;
  }

  async syncAttendanceFromDevice(deviceId: string): Promise<AttendanceSyncResult> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device || !device.isActive) {
      throw new Error('Device not found or not active');
    }

    try {
      // Mock biometric records from device
      const mockRecords = await this.getMockBiometricRecords(deviceId);
      
      const result: AttendanceSyncResult = {
        success: true,
        recordsProcessed: mockRecords.length,
        recordsAdded: 0,
        recordsUpdated: 0,
        errors: []
      };

      // Process each biometric record
      for (const record of mockRecords) {
        try {
          await this.processBiometricRecord(record);
          result.recordsAdded++;
        } catch (error) {
          result.errors.push(`Failed to process record ${record.id}: ${error}`);
        }
      }

      // Update device sync time
      device.lastSync = new Date().toISOString();

      return result;
    } catch (error) {
      return {
        success: false,
        recordsProcessed: 0,
        recordsAdded: 0,
        recordsUpdated: 0,
        errors: [`Sync failed: ${error}`]
      };
    }
  }

  private async getMockBiometricRecords(deviceId: string): Promise<BiometricRecord[]> {
    // Mock data - in real implementation, this would fetch from the device
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return [
      {
        id: 'record-001',
        deviceId,
        userId: 'student-001',
        userType: 'student',
        timestamp: `${today}T08:30:00Z`,
        status: 'success'
      },
      {
        id: 'record-002',
        deviceId,
        userId: 'student-002',
        userType: 'student',
        timestamp: `${today}T08:32:00Z`,
        status: 'success'
      },
      {
        id: 'record-003',
        deviceId,
        userId: 'teacher-001',
        userType: 'teacher',
        timestamp: `${today}T08:00:00Z`,
        status: 'success'
      }
    ];
  }

  private async processBiometricRecord(record: BiometricRecord): Promise<void> {
    const attendanceDate = record.timestamp.split('T')[0];
    const attendanceTime = record.timestamp.split('T')[1].split('.')[0];

    if (record.userType === 'student') {
      // Check if attendance already exists
      const { data: existing } = await supabase
        .from('student_attendance')
        .select('id')
        .eq('student_id', record.userId)
        .eq('attendance_date', attendanceDate)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from('student_attendance')
          .update({
            status: 'present',
            check_in_time: attendanceTime,
            remarks: 'Biometric attendance'
          })
          .eq('id', existing.id);
      } else {
        // Create new record
        await supabase
          .from('student_attendance')
          .insert({
            student_id: record.userId,
            attendance_date: attendanceDate,
            status: 'present',
            check_in_time: attendanceTime,
            remarks: 'Biometric attendance'
          });
      }
    } else if (record.userType === 'teacher') {
      // Check if attendance already exists
      const { data: existing } = await supabase
        .from('teacher_attendance')
        .select('id')
        .eq('teacher_id', record.userId)
        .eq('attendance_date', attendanceDate)
        .single();

      if (existing) {
        // Update existing record
        await supabase
          .from('teacher_attendance')
          .update({
            status: 'present',
            check_in_time: attendanceTime,
            remarks: 'Biometric attendance'
          })
          .eq('id', existing.id);
      } else {
        // Create new record
        await supabase
          .from('teacher_attendance')
          .insert({
            teacher_id: record.userId,
            attendance_date: attendanceDate,
            status: 'present',
            check_in_time: attendanceTime,
            remarks: 'Biometric attendance'
          });
      }
    }
  }

  async syncAllDevices(): Promise<AttendanceSyncResult[]> {
    const results: AttendanceSyncResult[] = [];
    
    for (const device of this.devices) {
      if (device.isActive) {
        try {
          const result = await this.syncAttendanceFromDevice(device.id);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            recordsProcessed: 0,
            recordsAdded: 0,
            recordsUpdated: 0,
            errors: [`Device ${device.name}: ${error}`]
          });
        }
      }
    }

    return results;
  }

  async getAttendanceSummary(deviceId: string, date: string): Promise<{
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    duplicateRecords: number;
  }> {
    // Mock summary - in real implementation, this would query the device
    return {
      totalRecords: 150,
      successfulRecords: 145,
      failedRecords: 3,
      duplicateRecords: 2
    };
  }

  async configureDevice(deviceId: string, config: Partial<BiometricDevice>): Promise<boolean> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    // Update device configuration
    Object.assign(device, config);
    device.lastSync = new Date().toISOString();

    return true;
  }

  async testDeviceConnection(deviceId: string): Promise<boolean> {
    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      return false;
    }

    try {
      await this.mockConnection(device);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const biometricManager = new BiometricManager();

// Utility functions for biometric attendance
export async function getBiometricAttendanceStats(date: string) {
  const { data: studentAttendance } = await supabase
    .from('student_attendance')
    .select('status')
    .eq('attendance_date', date)
    .ilike('remarks', '%biometric%');

  const { data: teacherAttendance } = await supabase
    .from('teacher_attendance')
    .select('status')
    .eq('attendance_date', date)
    .ilike('remarks', '%biometric%');

  const studentStats = studentAttendance?.reduce((acc, record) => {
    acc.total++;
    if (record.status === 'present') acc.present++;
    return acc;
  }, { total: 0, present: 0 }) || { total: 0, present: 0 };

  const teacherStats = teacherAttendance?.reduce((acc, record) => {
    acc.total++;
    if (record.status === 'present') acc.present++;
    return acc;
  }, { total: 0, present: 0 }) || { total: 0, present: 0 };

  return {
    students: {
      ...studentStats,
      percentage: studentStats.total > 0 ? (studentStats.present / studentStats.total) * 100 : 0
    },
    teachers: {
      ...teacherStats,
      percentage: teacherStats.total > 0 ? (teacherStats.present / teacherStats.total) * 100 : 0
    }
  };
}

export async function getBiometricAttendanceHistory(deviceId: string, startDate: string, endDate: string) {
  // This would typically query a biometric_records table
  // For now, we'll return mock data
  return [
    {
      date: startDate,
      totalRecords: 45,
      successfulRecords: 43,
      failedRecords: 2
    },
    {
      date: endDate,
      totalRecords: 48,
      successfulRecords: 46,
      failedRecords: 2
    }
  ];
}

export async function exportBiometricData(deviceId: string, startDate: string, endDate: string) {
  const device = await biometricManager.getDeviceStatus(deviceId);
  if (!device) {
    throw new Error('Device not found');
  }

  // Mock export - in real implementation, this would generate a CSV/Excel file
  const data = await getBiometricAttendanceHistory(deviceId, startDate, endDate);
  
  return {
    deviceName: device.name,
    exportDate: new Date().toISOString(),
    dateRange: { startDate, endDate },
    records: data
  };
}

