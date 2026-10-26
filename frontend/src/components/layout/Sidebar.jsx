import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  HelpCircle,
  CalendarCheck,
  Bot,
  Sparkles,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function Sidebar() {
  const { isTeacher } = useAuth();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/courses', label: 'Courses', icon: BookOpen },
    { to: '/assignments', label: 'Assignments', icon: FileCheck2 },
    { to: '/assessments', label: 'Assessments', icon: HelpCircle },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/ai/study', label: 'AI Study Assistant', icon: Bot, badge: 'RAG' },
  ];

  if (isTeacher) {
    links.push({
      to: '/ai/generator',
      label: 'AI Question Bank',
      icon: Sparkles,
      badge: 'AI',
    });
  }

  links.push({
    to: '/live',
    label: 'Live Classroom',
    icon: Radio,
    badge: 'Live',
    highlight: true,
  });

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        {/* Navigation Category */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 shadow-sm shadow-brand-500/10'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    } ${item.highlight ? 'border border-rose-100 bg-rose-50/40 text-rose-700' : ''}`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        item.highlight
                          ? 'bg-rose-500 text-white'
                          : 'bg-brand-100 text-brand-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Spring Boot Live Classroom Integration Box */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
            <h4 className="text-xs font-bold tracking-tight">Live Classroom</h4>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            Wooclap-style polls, word clouds, brainstorming & timers powered by Spring Boot.
          </p>
          <NavLink
            to="/live"
            className="inline-flex items-center justify-center space-x-1.5 w-full py-1.5 px-3 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold shadow-sm transition-colors"
          >
            <span>Launch / Join Room</span>
            <ExternalLink className="w-3 h-3" />
          </NavLink>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-100 px-2">
        <p className="text-[10px] text-slate-400 font-medium">ClassPulse Learning Platform</p>
        <p className="text-[10px] text-slate-500 font-semibold">MERN + Spring Boot Architecture</p>
      </div>
    </aside>
  );
}
