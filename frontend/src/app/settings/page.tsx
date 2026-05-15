"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Bell, Shield, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [groqKey, setGroqKey] = useState("gsk_••••••••••••••••••••••••");
  const [notifications, setNotifications] = useState({ email: true, failures: true, weekly: false });
  const [rateLimit, setRateLimit] = useState("100");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Manage your platform configuration and API keys.</p>
      </header>

      {/* API Keys */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-panel rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Key className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">API Keys</h2>
        </div>
        <div>
          <label className="text-sm text-zinc-400 block mb-2">Groq API Key</label>
          <input
            type="password"
            value={groqKey}
            onChange={e => setGroqKey(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          />
          <p className="text-xs text-zinc-500 mt-1">Used for AI Summarize and AI Extract actions.</p>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-panel rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
        </div>
        {[
          { key: "email", label: "Email alerts on failures" },
          { key: "failures", label: "Notify on consecutive failures (3+)" },
          { key: "weekly", label: "Weekly execution summary digest" },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">{item.label}</span>
            <button
              onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key as keyof typeof n] }))}
              className={`w-11 h-6 rounded-full transition-colors relative ${notifications[item.key as keyof typeof notifications] ? "bg-indigo-500" : "bg-white/10"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifications[item.key as keyof typeof notifications] ? "left-6" : "left-1"}`} />
            </button>
          </div>
        ))}
      </motion.div>

      {/* Rate Limits */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-panel rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Rate Limiting</h2>
        </div>
        <div>
          <label className="text-sm text-zinc-400 block mb-2">Max requests per minute (per API key)</label>
          <input
            type="number"
            value={rateLimit}
            onChange={e => setRateLimit(e.target.value)}
            className="w-40 bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </motion.div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${saved ? "bg-emerald-500 text-white" : "bg-indigo-500 hover:bg-indigo-600 text-white"}`}
      >
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );
}
