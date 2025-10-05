import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Table, TableRow, TableCell } from '../ui/Table';
import { useAuth } from '../../contexts/AuthContext';
import { biometricManager, getBiometricAttendanceStats, type BiometricDevice, type AttendanceSyncResult } from '../../lib/biometric';

export function BiometricAttendance() {
  const { hasPermission } = useAuth();
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [syncResults, setSyncResults] = useState<AttendanceSyncResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const canManageAttendance = hasPermission('manage_attendance');

  useEffect(() => {
    loadDevices();
    loadTodayStats();
  }, []);

  const loadDevices = async () => {
    try {
      const deviceList = await biometricManager.getDevices();
      setDevices(deviceList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    }
  };

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceStats = await getBiometricAttendanceStats(today);
      setStats(attendanceStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleConnectDevice = async (deviceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const success = await biometricManager.connectToDevice(deviceId);
      if (success) {
        await loadDevices();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to device');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectDevice = async (deviceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const success = await biometricManager.disconnectFromDevice(deviceId);
      if (success) {
        await loadDevices();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect from device');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDevice = async (deviceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await biometricManager.syncAttendanceFromDevice(deviceId);
      setSyncResults(prev => [...prev, result]);
      await loadTodayStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync device');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAllDevices = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await biometricManager.syncAllDevices();
      setSyncResults(results);
      await loadTodayStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync all devices');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (deviceId: string) => {
    setLoading(true);
    setError(null);

    try {
      const success = await biometricManager.testDeviceConnection(deviceId);
      if (success) {
        alert('Connection test successful!');
      } else {
        alert('Connection test failed!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  if (!canManageAttendance) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-600">
          You don't have permission to manage biometric attendance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Biometric Attendance</h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleSyncAllDevices}
            disabled={loading}
            variant="secondary"
          >
            {loading ? 'Syncing...' : 'Sync All Devices'}
          </Button>
        </div>
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

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Student Attendance</h3>
            <p className="mt-2 text-3xl font-semibold text-blue-600">
              {Math.round(stats.students.percentage)}%
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {stats.students.present}/{stats.students.total} present
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Teacher Attendance</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {Math.round(stats.teachers.percentage)}%
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {stats.teachers.present}/{stats.teachers.total} present
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Active Devices</h3>
            <p className="mt-2 text-3xl font-semibold text-purple-600">
              {devices.filter(d => d.isActive).length}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {devices.length} total devices
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Last Sync</h3>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {devices.length > 0 ? new Date(devices[0].lastSync).toLocaleTimeString() : 'N/A'}
            </p>
            <p className="mt-1 text-sm text-gray-600">Most recent</p>
          </Card>
        </div>
      )}

      {/* Devices Table */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Biometric Devices</h3>
        <div className="rounded-lg border bg-white">
          <Table
            headers={[
              'Device Name',
              'Location',
              'Type',
              'Status',
              'Last Sync',
              'Actions',
            ]}
          >
            {devices.map((device) => (
              <TableRow key={device.id}>
                <TableCell>{device.name}</TableCell>
                <TableCell>{device.location}</TableCell>
                <TableCell className="capitalize">{device.deviceType}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                      device.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {device.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(device.lastSync).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {device.isActive ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSyncDevice(device.id)}
                          disabled={loading}
                        >
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleDisconnectDevice(device.id)}
                          disabled={loading}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnectDevice(device.id)}
                        disabled={loading}
                      >
                        Connect
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleTestConnection(device.id)}
                      disabled={loading}
                    >
                      Test
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      </Card>

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Sync Results</h3>
          <div className="space-y-4">
            {syncResults.map((result, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 ${
                  result.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">
                      {result.success ? 'Sync Successful' : 'Sync Failed'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Processed: {result.recordsProcessed} | Added: {result.recordsAdded} | Updated: {result.recordsUpdated}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                      result.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-sm font-medium text-red-800">Errors:</h5>
                    <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                      {result.errors.map((error, errorIndex) => (
                        <li key={errorIndex}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

