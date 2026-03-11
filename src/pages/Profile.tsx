import React from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { User, Mail, Shield, Calendar, Camera } from "lucide-react";
import ProfileAvatar from "../components/ProfileAvatar.tsx";

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
        <p className="text-slate-500 mt-1">Manage your personal information and account settings</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600" />
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-6 flex items-end justify-between">
            <div className="relative group">
              <ProfileAvatar size="xl" editable={true} />
              <div className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-slate-100 pointer-events-none">
                <Camera className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <User className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-900 font-medium">{user?.name}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-900 font-medium">{user?.email}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Account Role</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <Shield className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-900 font-medium capitalize">{user?.role}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Member Since</label>
                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-900 font-medium">March 2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
