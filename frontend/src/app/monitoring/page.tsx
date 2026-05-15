"use client";

import { motion } from "framer-motion";
import { Activity, BarChart3, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

const metrics = [
  { label: "API Success Rate", value: "99.2%", trend: "+0.3%", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { label: "Avg Response Time", value: "142ms", trend: "-12ms", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { label: "Queue Depth", value: "8", trend: "-3", color: "text-amber-400", bg: "bg-amber-400/10" },
  { label: "Error Rate", value: "0.8%", trend: "-0.1%", color: "text-rose-400", bg: "bg-rose-400/10" },
];

const alerts = [
  { id: 1, type: "warning", message: "Worker queue depth exceeded 50 for 2 mins", time: "5 mins ago" },
  { id: 2, type: "ok", message: "Database connections back to normal", time: "18 mins ago" },
  { id: 3, type: "ok", message: "All API endpoints healthy", time: "1 hour ago" },
];

export default function MonitoringPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Monitoring</h1>
        <p className="text-zinc-400 mt-1">Real-time system health and performance metrics.</p>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel rounded-xl p-6"
          >
            <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center mb-4`}>
              <BarChart3 className={`w-5 h-5 ${m.color}`} />
            </div>
            <p className="text-sm text-zinc-400">{m.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
            <p className="text-xs text-emerald-400 mt-1">↑ {m.trend} vs last hour</p>
          </motion.div>
        ))}
      </div>

      {/* Live Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">System Alerts</h2>
          <span className="ml-auto flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live
          </span>
        </div>
        <div className="divide-y divide-white/5">
          {alerts.map((alert) => (
            <div key={alert.id} className="px-6 py-4 flex items-center gap-4">
              {alert.type === "warning" ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <p className="text-sm text-zinc-300 flex-1">{alert.message}</p>
              <span className="text-xs text-zinc-500 flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" /> {alert.time}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
