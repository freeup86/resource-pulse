import React, { useState, useEffect } from 'react';
import { getUserNotificationSettings, updateUserNotificationSettings } from '../../services/notificationService';
import MainLayout from '../layout/MainLayout';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getUserNotificationSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError('Failed to load notification settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggle = (typeId, channel) => {
    setSettings(settings.map(setting => {
      if (setting.notification_type_id === typeId) {
        return {
          ...setting,
          [channel]: !setting[channel]
        };
      }
      return setting;
    }));
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      await updateUserNotificationSettings(settings);
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save notification settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
          
          {error && <ErrorMessage message={error} />}
          
          {success && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
              Settings saved successfully
            </div>
          )}
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Select how you would like to receive notifications for each type of alert.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left font-medium">Notification Type</th>
                    <th className="p-3 text-center font-medium">In-App</th>
                    <th className="p-3 text-center font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map(setting => (
                    <tr key={setting.notification_type_id} className="border-b">
                      <td className="p-3">
                        <div className="font-medium">{setting.type_name}</div>
                        <div className="text-sm text-gray-500">{setting.description}</div>
                      </td>
                      <td className="p-3 text-center">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            checked={setting.in_app}
                            onChange={() => handleToggle(setting.notification_type_id, 'in_app')}
                          />
                        </label>
                      </td>
                      <td className="p-3 text-center">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600"
                            checked={setting.email}
                            onChange={() => handleToggle(setting.notification_type_id, 'email')}
                          />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotificationSettingsPage;