"use client";

import { motion } from "framer-motion";
import { Activity, ArrowUpRight, CheckCircle2, Clock, PlayCircle, XCircle } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { name: "Total Workflows", value: "24", icon: PlayCircle, color: "text-indigo-400" },
    { name: "Executions (24h)", value: "1,432", icon: Activity, color: "text-emerald-400" },
    { name: "Failed Tasks", value: "3", icon: XCircle, color: "text-rose-400" },
    { name: "Avg. Latency", value: "124ms", icon: Clock, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Monitor your automated AI pipelines in real-time.</p>
        </div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <PlayCircle className="w-4 h-4" />
          New Workflow
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
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
                <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      {/* Recent Executions Table Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Recent Executions</h2>
          <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View All <ArrowUpRight className="w-4 h-4" />
          </button>
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
