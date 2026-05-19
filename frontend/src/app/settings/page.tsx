"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Save, Check, User, Trash2, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { usersApi, authApi } from "@/lib/api";

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ id: number; email: string; is_superuser: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Password Change State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Danger Zone State
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await usersApi.me();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPwdMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    try {
      setPwdLoading(true);
      setPwdMessage(null);
      await usersApi.changePassword(newPassword);
      setPwdMessage({ type: "success", text: "Password changed successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdMessage({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    try {
      setDelLoading(true);
      await usersApi.deleteAccount();
      // Account deleted successfully, trigger logout
      authApi.logout();
    } catch (err) {
      alert("Failed to delete account. Please try again.");
      setConfirmDelete(false);
    } finally {
      setDelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-zinc-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl pb-20">
      <header className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your personal profile, credentials, and account status.</p>
      </header>

      {/* Profile Information */}
      {profile && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel rounded-xl p-6 space-y-4 border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Account Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Account ID</p>
              <p className="text-sm font-mono text-white mt-1">#{profile.id}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Email Address</p>
              <p className="text-sm text-white mt-1">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Role</p>
              <p className="text-sm mt-1 inline-flex items-center gap-1 text-indigo-400 font-medium">
                {profile.is_superuser ? (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Platform Admin
                  </>
                ) : (
                  "Standard User"
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Change Password Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-panel rounded-xl p-6 space-y-4 border border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <Key className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Change Password</h2>
        </div>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
          </div>

          {pwdMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              pwdMessage.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
            }`}>
              {pwdMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pwdLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
          >
            {pwdLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Password
          </button>
        </form>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-panel rounded-xl p-6 space-y-4 border border-rose-500/10 bg-rose-500/[0.01]">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-semibold text-rose-400">Danger Zone</h2>
        </div>
        <p className="text-sm text-zinc-400">
          Permanently delete your account and wipe all your workflows, tasks, and historical runs. 
          This action is absolute and cannot be undone.
        </p>
        
        <div className="pt-2">
          <button
            onClick={handleDeleteAccount}
            disabled={delLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              confirmDelete 
                ? "bg-rose-600 hover:bg-rose-700 text-white" 
                : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
            }`}
          >
            {delLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {confirmDelete ? "Click again to confirm PERMANENT DELETION" : "Delete Account"}
          </button>
          {confirmDelete && (
            <button 
              onClick={() => setConfirmDelete(false)} 
              className="text-xs text-zinc-500 hover:text-zinc-400 mt-2 block"
            >
              Cancel Deletion
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
