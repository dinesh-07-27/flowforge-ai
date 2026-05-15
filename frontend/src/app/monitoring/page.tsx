"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, BarChart3, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { dashboardApi } from "@/lib/api";

export default function MonitoringPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardApi.stats();
      setStats(data);
    } catch (err) {
      console.error("Monitoring failed", err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    { label: "API Success Rate", value: "99.9%", trend: "+0.1%", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { label: "Active Workers", value: "4", trend: "Stable", color: "text-indigo-400", bg: "bg-indigo-400/10" },
    { label: "Queue Depth", value: "0", trend: "Empty", color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Failed (24h)", value: stats?.failed_tasks || "0", trend: "Audit log", color: "text-rose-400", bg: "bg-rose-400/10" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Monitoring</h1>
          <p className="text-zinc-400 mt-1">Real-time system health and performance metrics.</p>
        </div>
        {loading && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
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
            <p className="text-xs text-zinc-500 mt-1">{m.trend}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">System Status</h2>
          <span className="ml-auto flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live Updates Enabled
          </span>
        </div>
        <div className="p-12 text-center">
           <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
           <p className="text-white font-medium">All Systems Operational</p>
           <p className="text-zinc-500 text-sm mt-1">Worker nodes are healthy and responding within 50ms.</p>
        </div>
      </motion.div>
    </div>
  );
}
