import React, { useEffect, useState } from 'react';
import { Save, Building, Mail, Phone, MapPin } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';

export function Settings() {
  const [settings, setSettings] = useState({
    school_name: '',
    school_address: '',
    school_phone: '',
    school_email: '',
    organization_name: '',
    pass_percentage: '33',
    max_fail_subjects: '1',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      data?.forEach((item) => {
        settingsMap[item.setting_key] = item.setting_value;
      });

      setSettings({
        school_name: settingsMap.school_name || '',
        school_address: settingsMap.school_address || '',
        school_phone: settingsMap.school_phone || '',
        school_email: settingsMap.school_email || '',
        organization_name: settingsMap.organization_name || '',
        pass_percentage: settingsMap.pass_percentage || '33',
        max_fail_subjects: settingsMap.max_fail_subjects || '1',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase
          .from('school_settings')
          .upsert({ setting_key: key, setting_value: value });
      }
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure school settings and preferences</p>
        </div>
      </div>

      <Card title="School Information">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">
                  School Name
                </label>
              </div>
              <Input
                value={settings.school_name}
                onChange={(e) =>
                  setSettings({ ...settings, school_name: e.target.value })
                }
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">
                  Organization Name
                </label>
              </div>
              <Input
                value={settings.organization_name}
                onChange={(e) =>
                  setSettings({ ...settings, organization_name: e.target.value })
                }
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Phone</label>
              </div>
              <Input
                value={settings.school_phone}
                onChange={(e) =>
                  setSettings({ ...settings, school_phone: e.target.value })
                }
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Email</label>
              </div>
              <Input
                type="email"
                value={settings.school_email}
                onChange={(e) =>
                  setSettings({ ...settings, school_email: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700">Address</label>
            </div>
            <textarea
              value={settings.school_address}
              onChange={(e) =>
                setSettings({ ...settings, school_address: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      <Card title="Academic Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Passing Percentage"
            type="number"
            value={settings.pass_percentage}
            onChange={(e) =>
              setSettings({ ...settings, pass_percentage: e.target.value })
            }
          />
          <Input
            label="Maximum Subjects Allowed to Fail"
            type="number"
            value={settings.max_fail_subjects}
            onChange={(e) =>
              setSettings({ ...settings, max_fail_subjects: e.target.value })
            }
          />
        </div>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Students will be promoted if they fail in maximum{' '}
            {settings.max_fail_subjects} subject(s). If they fail in more subjects, they
            will be detained.
          </p>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
