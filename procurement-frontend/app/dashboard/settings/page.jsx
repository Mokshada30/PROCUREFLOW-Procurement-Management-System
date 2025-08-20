"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { useUserRole } from '@/hooks/useUserRole';
// import { useTheme } from '@/contexts/ThemeContext'; // Removed useTheme import

export default function SettingsPage() {
  const { role, loading: roleLoading } = useUserRole();
  const router = useRouter();
  // const { theme, toggleTheme } = useTheme(); // Removed theme and toggleTheme
  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [fullName, setFullName] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [language, setLanguage] = useState("en"); // Default language

  useEffect(() => {
    if (!roleLoading && !role) {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, [role, roleLoading, router]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoadingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error.message);
          setStatusMessage("Error loading profile.");
        } else if (profile) {
          setUserProfile(profile);
          setFullName(profile.full_name || "");
        }
      }
      setLoadingProfile(false);
    };

    if (!roleLoading && role) {
      fetchUserProfile();
    }
  }, [role, roleLoading]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    if (!fullName.trim()) {
      setStatusMessage("Full name cannot be empty.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatusMessage("User not authenticated.");
      router.push("/login");
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError.message);
      setStatusMessage(`Error updating profile: ${profileError.message}`);
    } else {
      setStatusMessage("Profile updated successfully!");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setStatusMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setStatusMessage("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setStatusMessage("New password must be at least 6 characters long.");
      return;
    }

    // Note: Supabase client-side does not directly support changing password with old password for security reasons.
    // This would typically be handled via a server-side API route that calls `admin.updateUserById`
    // or by initiating a password reset flow.
    // For demonstration, we will simplify and only check new password constraints and call updateUser.
    // In a real application, implement a secure server-side endpoint for this.

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Error changing password:", error.message);
      setStatusMessage(`Error changing password: ${error.message}`);
    } else {
      setStatusMessage("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (role !== "admin") {
      setStatusMessage("Only administrators can change user roles.");
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMessage(`Successfully updated role for user ${userId} to ${newRole}.`);
        // Ideally, re-fetch user list or update local state for the affected user
      } else {
        setStatusMessage(`Error: ${data.message || "Failed to update role"}`);
      }
    } catch (apiError) {
      console.error("API call error:", apiError);
      setStatusMessage("Network error or server issue.");
    }
  };

  const handleEmailPreferencesChange = (preference) => {
    // This would typically involve updating user preferences in the database
    setStatusMessage(`Email preference for '${preference}' toggled.`);
    console.log(`Toggling email preference for: ${preference}`);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    // In a real app, you would load translations based on this selection
    setStatusMessage(`Language changed to ${e.target.value.toUpperCase()}.`);
  };

  if (roleLoading || loadingProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Settings...</div>;
  }

  if (!role) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Access Denied</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">Settings</h1>

        {statusMessage && (
          <p className={`mb-4 text-center text-sm font-medium ${statusMessage.includes("Error") ? "text-red-600" : "text-green-600"}`}>
            {statusMessage}
          </p>
        )}

        {/* User Profile Management */}
        <div className="mb-8 p-6 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">User Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input
                type="text"
                id="fullName"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Update Profile
            </button>
          </form>

          <h3 className="text-xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Old Password</label>
              <input
                type="password"
                id="oldPassword"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
              <input
                type="password"
                id="newPassword"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
              <input
                type="password"
                id="confirmNewPassword"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Change Password
            </button>
          </form>
        </div>
        {/* Removed Theme Toggle section as per user request */}
        {/* Role-Specific Settings (Admin only example) */}
        {role === 'admin' && (
          <div className="mb-8 p-6 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Administrator Settings</h2>
            <div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Manage Roles</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Update user roles. This typically requires a secure backend API call.</p>
              {/* Example: A simple button to trigger a role change for a dummy user */}
              <button
                onClick={() => handleRoleChange("some-user-id", "procurement_officer")}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Change User Role to Procurement Officer (Example)
              </button>
              {/* In a real app, this would be a UI with user search/selection */}
            </div>

            <h3 className="text-xl font-bold mt-8 mb-2 text-gray-900 dark:text-white">Team Management</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Manage teams, assign team leads, etc. (Link to Teams page?)</p>
            {/* Link to actual team management page */}
            <button
              onClick={() => router.push("/dashboard/teams")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Go to Team Management
            </button>

            <h3 className="text-xl font-bold mt-8 mb-2 text-gray-900 dark:text-white">Approval Thresholds</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Set or adjust financial approval limits for different roles.</p>
            {/* Placeholder for approval threshold settings */}
            <div className="flex items-center space-x-2">
              <label htmlFor="threshold" className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Lead Threshold:</label>
              <input type="number" id="threshold" defaultValue="1000" className="border rounded-md p-1 w-24 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
              <span className="text-sm text-gray-500 dark:text-gray-400">USD</span>
              <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-xs">Save</button>
            </div>
          </div>
        )}

        {/* Email Preferences/Notification Settings */}
        <div className="mb-8 p-6 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Notification Settings</h2>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" onChange={() => handleEmailPreferencesChange("request_updates")} defaultChecked />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Receive updates on my requests</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" onChange={() => handleEmailPreferencesChange("approval_needed")} defaultChecked={role === 'team_lead' || role === 'admin' || role === 'procurement_officer'} />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Notify me of requests awaiting approval</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="form-checkbox bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" onChange={() => handleEmailPreferencesChange("new_features")} />
              <span className="ml-2 text-gray-700 dark:text-gray-300">Receive marketing emails for new features</span>
            </label>
          </div>
        </div>

        {/* Language Selection */}
        <div className="p-6 border rounded-lg shadow-sm bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Language Settings</h2>
          <div>
            <label htmlFor="languageSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Language</label>
            <select
              id="languageSelect"
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={language}
              onChange={handleLanguageChange}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
