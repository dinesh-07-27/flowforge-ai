"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, Settings, Workflow, History, LogOut, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { authApi, usersApi } from "@/lib/api";

const baseNavItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Simulation Portal", href: "/simulation", icon: Zap },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "Executions", href: "/executions", icon: History },
  { name: "Monitoring", href: "/monitoring", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [userProfile, setUserProfile] = useState<{ email: string } | null>(null);
  
  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/register") {
      usersApi.me()
        .then(data => {
          setUserProfile(data);
          setIsSuperuser(data.is_superuser);
        })
        .catch(() => {
          setUserProfile(null);
          setIsSuperuser(false);
        });
    }
  }, [pathname]);

  if (pathname === "/login" || pathname === "/register") return null;

  const navItems = [...baseNavItems];
  if (isSuperuser) {
    navItems.push({ name: "Admin Panel", href: "/admin", icon: ShieldCheck });
  }

  const getInitials = (email: string) => {
    if (!email) return "U";
    const parts = email.split("@")[0];
    return parts.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 border-r border-white/5 bg-[#09090b]/80 backdrop-blur-xl flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Workflow className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">FlowForge<span className="text-indigo-400">AI</span></span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={clsx(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive ? "text-white" : "text-zinc-400 hover:text-white hover:bg-white/5",
                  item.name === "Admin Panel" ? "text-indigo-300 hover:text-indigo-200" : ""
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-white/10 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <item.icon className={clsx("w-5 h-5 relative z-10", isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                <span className="relative z-10">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 space-y-4">
        {userProfile && (
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 select-none">
              {getInitials(userProfile.email)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate select-none">{userProfile.email.split("@")[0]}</p>
              <p className="text-[10px] text-zinc-500 truncate select-none">{userProfile.email}</p>
            </div>
          </div>
        )}

        <button 
          onClick={() => authApi.logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
        
        <div className="p-4 border-t border-white/5 pt-6">
          <div className="glass-panel rounded-xl p-4">
            <p className="text-xs font-semibold text-zinc-300">System Status</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-zinc-400">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
