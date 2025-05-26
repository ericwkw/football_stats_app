'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/UI/PageHeader';

export default function AdminSettingsPage() {
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Football Stats App',
    logoUrl: '',
    enableRegistration: true,
    requireEmailVerification: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newMatchAlert: true,
    statsUpdateAlert: false,
    adminNotifications: true,
  });

  const [displaySettings, setDisplaySettings] = useState({
    defaultTheme: 'light',
    showPlayerImages: true,
    enableDarkMode: true,
    showTeamLogos: true,
    matchesPerPage: 10,
  });

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setGeneralSettings({
      ...generalSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationSettings({
      ...notificationSettings,
      [name]: checked,
    });
  };

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setDisplaySettings({
      ...displaySettings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would save to the database
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Settings" 
        description="Configure application settings" 
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin" className="text-indigo-600 hover:text-indigo-900">
            ← Back to Admin Home
          </Link>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Placeholder Page:</strong> This is a placeholder for the Settings functionality which will be implemented in a future update.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSaveSettings}>
            {/* General Settings */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">General Settings</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                    Site Name
                  </label>
                  <input
                    type="text"
                    id="siteName"
                    name="siteName"
                    value={generalSettings.siteName}
                    onChange={handleGeneralChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Logo URL
                  </label>
                  <input
                    type="text"
                    id="logoUrl"
                    name="logoUrl"
                    value={generalSettings.logoUrl}
                    onChange={handleGeneralChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableRegistration"
                    name="enableRegistration"
                    checked={generalSettings.enableRegistration}
                    onChange={handleGeneralChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="enableRegistration" className="ml-2 block text-sm text-gray-700">
                    Enable User Registration
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireEmailVerification"
                    name="requireEmailVerification"
                    checked={generalSettings.requireEmailVerification}
                    onChange={handleGeneralChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-700">
                    Require Email Verification
                  </label>
                </div>
              </div>
            </div>
            
            {/* Notification Settings */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Notification Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    name="emailNotifications"
                    checked={notificationSettings.emailNotifications}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
                    Enable Email Notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="newMatchAlert"
                    name="newMatchAlert"
                    checked={notificationSettings.newMatchAlert}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="newMatchAlert" className="ml-2 block text-sm text-gray-700">
                    New Match Alerts
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="statsUpdateAlert"
                    name="statsUpdateAlert"
                    checked={notificationSettings.statsUpdateAlert}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="statsUpdateAlert" className="ml-2 block text-sm text-gray-700">
                    Stats Update Alerts
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="adminNotifications"
                    name="adminNotifications"
                    checked={notificationSettings.adminNotifications}
                    onChange={handleNotificationChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="adminNotifications" className="ml-2 block text-sm text-gray-700">
                    Admin Notifications
                  </label>
                </div>
              </div>
            </div>
            
            {/* Display Settings */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Display Settings</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="defaultTheme" className="block text-sm font-medium text-gray-700 mb-1">
                    Default Theme
                  </label>
                  <select
                    id="defaultTheme"
                    name="defaultTheme"
                    value={displaySettings.defaultTheme}
                    onChange={handleDisplayChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="matchesPerPage" className="block text-sm font-medium text-gray-700 mb-1">
                    Matches Per Page
                  </label>
                  <select
                    id="matchesPerPage"
                    name="matchesPerPage"
                    value={displaySettings.matchesPerPage}
                    onChange={handleDisplayChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showPlayerImages"
                    name="showPlayerImages"
                    checked={displaySettings.showPlayerImages}
                    onChange={handleDisplayChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="showPlayerImages" className="ml-2 block text-sm text-gray-700">
                    Show Player Images
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableDarkMode"
                    name="enableDarkMode"
                    checked={displaySettings.enableDarkMode}
                    onChange={handleDisplayChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="enableDarkMode" className="ml-2 block text-sm text-gray-700">
                    Enable Dark Mode Option
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showTeamLogos"
                    name="showTeamLogos"
                    checked={displaySettings.showTeamLogos}
                    onChange={handleDisplayChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="showTeamLogos" className="ml-2 block text-sm text-gray-700">
                    Show Team Logos
                  </label>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 