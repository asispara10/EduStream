import React, { useState, useEffect } from "react";
import api from "../api/axios.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { User, Lock, Bell, Check, Camera } from "lucide-react";
import { motion } from "framer-motion";

const Settings = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || ""
  });

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [notifs, setNotifs] = useState<any>({
    notif_comments_on_posts: user?.notif_comments_on_posts === 1,
    notif_mentions: user?.notif_mentions === 1,
    notif_private_comments: user?.notif_private_comments === 1,
    notif_teacher_posts: user?.notif_teacher_posts === 1,
    notif_teacher_announcements: user?.notif_teacher_announcements === 1,
    notif_new_assignments: user?.notif_new_assignments === 1,
    notif_returned_work: user?.notif_returned_work === 1,
    notif_invitations: user?.notif_invitations === 1,
    notif_due_reminders: user?.notif_due_reminders === 1,
    notif_late_submissions: user?.notif_late_submissions === 1,
    notif_resubmissions: user?.notif_resubmissions === 1,
    notif_co_teach: user?.notif_co_teach === 1,
    notif_scheduled_posts: user?.notif_scheduled_posts === 1,
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/auth/profile", profile);
      setUser(res.data.user);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return alert("Passwords do not match");
    setLoading(true);
    try {
      await api.put("/auth/password", passwords);
      setPasswords({ current: "", new: "", confirm: "" });
      setSuccess("Password changed successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      alert("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const toggleNotif = async (key: string) => {
    const newValue = !notifs[key];
    setNotifs(prev => ({ ...prev, [key]: newValue }));
    try {
      await api.put("/auth/notifications", { [key]: newValue ? 1 : 0 });
    } catch (err) {
      setNotifs(prev => ({ ...prev, [key]: !newValue })); // Rollback
      alert("Failed to update notification setting");
    }
  };

  const studentNotifs = [
    { key: "notif_comments_on_posts", label: "Comments on your posts" },
    { key: "notif_mentions", label: "Comments that mention you" },
    { key: "notif_private_comments", label: "Private comments on work" },
    { key: "notif_teacher_announcements", label: "Teacher announcements" },
    { key: "notif_new_assignments", label: "New assignments" },
    { key: "notif_returned_work", label: "Returned work and marks" },
    { key: "notif_invitations", label: "Invitations to join classes" },
    { key: "notif_due_reminders", label: "Due-date reminders" },
  ];

  const teacherNotifs = [
    { key: "notif_late_submissions", label: "Late submissions" },
    { key: "notif_resubmissions", label: "Resubmissions" },
    { key: "notif_co_teach", label: "Invitations to co-teach" },
    { key: "notif_scheduled_posts", label: "Scheduled post published or failed" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and notifications</p>
      </header>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 text-green-600 p-4 rounded-2xl border border-green-100 flex items-center gap-3 font-bold text-sm"
        >
          <Check className="w-5 h-5" />
          {success}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            Profile
          </h2>
          <p className="text-sm text-slate-500">Update your personal information and profile picture.</p>
        </div>
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group">
                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 text-2xl font-bold overflow-hidden border-2 border-white shadow-md">
                  {profile.avatar ? <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" /> : (profile.name?.charAt(0) || "?")}
                </div>
                <button type="button" className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-slate-600 hover:text-indigo-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{profile.name}</h3>
                <p className="text-sm text-slate-500">{profile.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed text-slate-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              Save Changes
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            Security
          </h2>
          <p className="text-sm text-slate-500">Change your password to keep your account secure.</p>
        </div>
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                  <input
                    type="password"
                    required
                    value={passwords.new}
                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg disabled:opacity-50"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            Notifications
          </h2>
          <p className="text-sm text-slate-500">Control which email notifications you receive.</p>
        </div>
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Email Notifications</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {(user?.role === "student" ? studentNotifs : teacherNotifs).map((item) => (
              <div key={item.key} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
                <button
                  onClick={() => toggleNotif(item.key)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    notifs[item.key] ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifs[item.key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
