"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowUpRight, CheckCircle2, Clock, PlayCircle, XCircle, Loader2, Zap } from "lucide-react";
import Link from "next/link";
import { dashboardApi, executionsApi } from "@/lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentExecs, setRecentExecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsData, execs] = await Promise.all([
        dashboardApi.stats(),
        executionsApi.list(),
      ]);
      setStats(statsData);
      setRecentExecs(execs.slice(0, 5));
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: "Total Workflows", value: stats?.total_workflows || "0", icon: PlayCircle, color: "text-indigo-400" },
    { name: "Executions (24h)", value: stats?.executions_24h || "0", icon: Activity, color: "text-emerald-400" },
    { name: "Failed Tasks", value: stats?.failed_tasks || "0", icon: XCircle, color: "text-rose-400" },
    { name: "Avg. Latency", value: stats?.avg_latency || "0ms", icon: Clock, color: "text-amber-400" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "text-emerald-400 bg-emerald-400/10";
      case "RUNNING": return "text-amber-400 bg-amber-400/10";
      case "FAILED": return "text-rose-400 bg-rose-400/10";
      default: return "text-zinc-400 bg-zinc-400/10";
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Monitor your automated AI pipelines in real-time.</p>
        </div>
        <Link href="/workflows/new">
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <PlayCircle className="w-4 h-4" />
            New Workflow
          </button>
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-zinc-400">{stat.name}</p>
                {loading ? (
                  <div className="h-9 w-16 bg-white/5 animate-pulse rounded mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Recent Executions - Live Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Recent Executions</h2>
          </div>
          <Link href="/executions">
            <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </Link>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        ) : recentExecs.length === 0 ? (
          <div className="p-6 text-center py-12">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-medium text-white">No executions yet</h3>
            <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
              Head to the Simulation Portal to fire your first webhook and trigger the automation pipeline.
            </p>
            <Link href="/simulation">
              <button className="mt-4 text-sm text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-lg transition-colors">
                Open Simulation Portal
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentExecs.map((exec) => (
              <Link key={exec.id} href="/executions">
                <div className="px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Activity className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {exec.workflow?.name || "Workflow"}
                      </p>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">exec_{exec.id} · {new Date(exec.started_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusColor(exec.status)}`}>
                    {exec.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}


export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dashboardApi.stats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: "Total Workflows", value: stats?.total_workflows || "0", icon: PlayCircle, color: "text-indigo-400" },
    { name: "Executions (24h)", value: stats?.executions_24h || "0", icon: Activity, color: "text-emerald-400" },
    { name: "Failed Tasks", value: stats?.failed_tasks || "0", icon: XCircle, color: "text-rose-400" },
    { name: "Avg. Latency", value: stats?.avg_latency || "0ms", icon: Clock, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Monitor your automated AI pipelines in real-time.</p>
        </div>
        <Link href="/workflows/new">
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <PlayCircle className="w-4 h-4" />
            New Workflow
          </button>
        </Link>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-white/20 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-zinc-400">{stat.name}</p>
                {loading ? (
                  <div className="h-9 w-16 bg-white/5 animate-pulse rounded mt-2" />
                ) : (
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                )}
              </div>
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Recent Executions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Recent Executions</h2>
          <Link href="/executions">
            <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
        <div className="p-6 text-center py-12">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-lg font-medium text-white">All pipelines running smoothly</h3>
          <p className="text-sm text-zinc-400 mt-1 max-w-md mx-auto">
            No recent failures detected. Your AI processing tasks are operating within normal latency bounds.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
