"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Users, Activity, Mail, LayoutDashboard, Loader2, Key, Shield, Save, Check, Trash2 } from "lucide-react";
import { usersApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"users" | "config">("users");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Platform Config State
  const [groqKey, setGroqKey] = useState("");
  const [rateLimit, setRateLimit] = useState(100);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  const [currentAdminId, setCurrentAdminId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Verify Superuser privileges
      const me = await usersApi.me();
      if (!me.is_superuser) {
        router.push("/");
        return;
      }
      setCurrentAdminId(me.id);
      
      // Fetch user list
      const data = await usersApi.list();
      setUsers(data);
      
      // Fetch system configs
      const config = await usersApi.getConfig();
      setGroqKey(config.groq_api_key);
      setRateLimit(config.global_rate_limit);
      
      setError(null);
    } catch (err: any) {
      if (err.message?.includes("403")) {
        router.push("/");
      } else {
        setError("Failed to load admin management data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!confirm(`Are you absolutely sure you want to permanently delete the user account "${email}"?\n\nThis will cascade delete all of their workflows, steps, and Celery execution logs.`)) {
      return;
    }
    try {
      setDeletingId(userId);
      await usersApi.deleteUser(userId);
      // Reload user list
      const data = await usersApi.list();
      setUsers(data);
    } catch (err: any) {
      alert(err.message || "Failed to delete user account.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setConfigSaving(true);
      await usersApi.saveConfig({
        groq_api_key: groqKey,
        global_rate_limit: Number(rateLimit)
      });
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 2500);
    } catch (err) {
      alert("Failed to save configuration settings.");
    } finally {
      setConfigSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-zinc-400 animate-pulse">Verifying privileges and loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-4xl">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
          </div>
          <p className="text-zinc-400">Global user management, platform limit controls, and configurations.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "users" 
                ? "bg-indigo-500 text-white shadow-lg" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "config" 
                ? "bg-indigo-500 text-white shadow-lg" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            Platform Config
          </button>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "users" ? (
          <motion.div
            key="users-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-panel rounded-xl p-6 border border-white/10 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Total Registered Users</p>
                    <p className="text-3xl font-bold text-white mt-2">{users.length}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </div>
              
              <div className="glass-panel rounded-xl p-6 border border-white/10 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Total Workflows Created</p>
                    <p className="text-3xl font-bold text-white mt-2">
                      {users.reduce((acc, curr) => acc + (curr.workflows_count || 0), 0)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="glass-panel rounded-xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-lg font-semibold text-white">Platform Users</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-white/[0.01] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4 font-medium text-zinc-300">User ID</th>
                      <th className="px-6 py-4 font-medium text-zinc-300">Email Address</th>
                      <th className="px-6 py-4 font-medium text-zinc-300">Status</th>
                      <th className="px-6 py-4 font-medium text-zinc-300">Role</th>
                      <th className="px-6 py-4 font-medium text-zinc-300 text-right">Workflows</th>
                      <th className="px-6 py-4 font-medium text-zinc-300 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-white font-mono">#{user.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-zinc-500" />
                            <span className="text-white font-medium">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-400" : "bg-rose-400"}`} />
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.is_superuser ? (
                            <span className="inline-flex items-center gap-1 text-indigo-400 font-medium">
                              <ShieldCheck className="w-4 h-4" /> Admin
                            </span>
                          ) : (
                            <span className="text-zinc-500">Standard User</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-md bg-white/5 text-white font-mono text-xs">
                            {user.workflows_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {user.id !== currentAdminId && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              disabled={deletingId === user.id}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all border border-rose-500/20 disabled:opacity-50"
                              title="Delete user and all associated data"
                            >
                              {deletingId === user.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center">
                          <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                          <p>No users found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="config-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <div className="glass-panel rounded-xl p-6 border border-white/10 space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Shield className="w-6 h-6 text-indigo-400" />
                <div>
                  <h2 className="text-lg font-semibold text-white font-sans">Global Platform Configuration</h2>
                  <p className="text-xs text-zinc-500">Configure parameters that affect all users on the platform.</p>
                </div>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-6">
                {/* Master Groq API Key */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Key className="w-4 h-4 text-zinc-500" />
                    Master Groq API Key
                  </label>
                  <input
                    type="password"
                    placeholder="Enter platform fallback Llama-3 key (gsk_...)"
                    value={groqKey}
                    onChange={e => setGroqKey(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                  <p className="text-xs text-zinc-500">
                    If empty, workflows will fallback to the default Groq key set in the backend `.env` variables.
                  </p>
                </div>

                {/* Global API Rate Limiting */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-zinc-500" />
                    Global API Rate Limit (requests/min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={rateLimit}
                    onChange={e => setRateLimit(Number(e.target.value))}
                    className="w-40 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                  <p className="text-xs text-zinc-500">
                    Maximum requests per minute allowed per user IP to prevent server degradation.
                  </p>
                </div>

                {configSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Platform configuration successfully updated and loaded into database.
                  </div>
                )}

                <div className="border-t border-white/5 pt-4">
                  <button
                    type="submit"
                    disabled={configSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    {configSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
