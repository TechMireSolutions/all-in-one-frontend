import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../Store/authStore";
import logo from "../assets/TMS-LOGO.webp";
import {
  Upload, Eye, UserPlus, Users, DollarSign, UserX,
  GraduationCap, Briefcase, FileText, Layers, User,
  LayoutDashboard, LogOut, Menu, X, ChevronDown, Contact,
} from "lucide-react";

// ── Nav config ──────────────────────────────────────────────────────────────
const navConfig = {
  superadmin: [
    { path: "/contacts",      label: "Contacts",      icon: Contact },
    { path: "/users",         label: "Registration",  icon: Users },
    {
      label: "Management",
      children: [
        { path: "/uploadfile",    label: "Upload",        icon: Upload },
        { path: "/registerusers", label: "Payrolls",      icon: DollarSign },
      ],
    },
    {
      label: "Records",
      children: [
        { path: "/ex-employees",  label: "Ex-Employees",  icon: UserX },
        { path: "/students",      label: "Students",      icon: GraduationCap },
        { path: "/ojt",           label: "OJT Trainees",  icon: Briefcase },
      ],
    },
    { path: "/view",      label: "Attendance", icon: Eye },
    { path: "/policies",  label: "Policies",   icon: FileText },
    {
      label: "Smart Asset",
      icon: Layers,
      children: [
        { path: "https://smartasset-frontend.vercel.app/", label: "Login Page", isExternal: true },
      ],
    },
  ],
  hr: [
    { path: "/contacts",      label: "Contacts",     icon: Contact },
    { path: "/users",         label: "Registration", icon: Users },
    {
      label: "Management",
      children: [
        { path: "/uploadfile",    label: "Upload",       icon: Upload },
        { path: "/registerusers", label: "Payrolls",     icon: DollarSign },
      ],
    },
    { path: "/view",      label: "Attendance", icon: Eye },
    { path: "/policies",  label: "Policies",   icon: FileText },
    {
      label: "Smart Asset",
      icon: Layers,
      children: [
        { path: "https://smartasset-frontend.vercel.app/", label: "Login Page", isExternal: true },
      ],
    },
  ],
  employee: [
    { path: "/view",      label: "Attendance", icon: Eye },
    { path: "/policies",  label: "Policies",   icon: FileText },
    { path: "/profile",   label: "Profile",    icon: User },
  ],
  ojt: [
    { path: "/view",       label: "Attendance", icon: Eye },
    { path: "/policies",   label: "Policies",   icon: FileText },
    { path: "/activities", label: "Activities", icon: LayoutDashboard },
    { path: "/profile",    label: "Profile",    icon: User },
  ],
  student: [
    { path: "/view",       label: "Attendance", icon: Eye },
    { path: "/policies",   label: "Policies",   icon: FileText },
    { path: "/activities", label: "Activities", icon: LayoutDashboard },
    { path: "/profile",    label: "Profile",    icon: User },
  ],
};

// ── Dropdown Item ────────────────────────────────────────────────────────────
const DropdownMenu = ({ item, onClose }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${open ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}
      >
        {item.icon && <item.icon size={15} />}
        {item.label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 min-w-[180px] bg-[#1f2937] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {item.children.map((child) =>
              child.isExternal ? (
                <a
                  key={child.path}
                  href={child.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { setOpen(false); onClose?.(); }}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-orange-500 hover:text-white transition-all duration-150"
                >
                  {child.icon && <child.icon size={15} />}
                  {child.label}
                </a>
              ) : (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={() => { setOpen(false); onClose?.(); }}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-4 py-3 text-sm transition-all duration-150
                    ${isActive ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`
                  }
                >
                  {child.icon && <child.icon size={15} />}
                  {child.label}
                </NavLink>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Main Navbar ──────────────────────────────────────────────────────────────
const TopNavbar = () => {
  const { role, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDropdowns, setMobileDropdowns] = useState({});

  const activeRole = role?.toLowerCase();
  const items = navConfig[activeRole] || [];

  const handleLogout = () => { logout(); navigate("/"); };

  const toggleMobileDropdown = (label) =>
    setMobileDropdowns((p) => ({ ...p, [label]: !p[label] }));

  return (
    <header className="bg-[#111827] border-b border-white/5 shadow-xl sticky top-0 z-40">
      <div className="px-4 md:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src={logo} alt="logo" className="w-9 h-9" />
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-tight">Techmire Solutions</p>
            <p className="text-orange-400 text-xs capitalize">
              {role === "superadmin" ? "Super Admin" : role}
            </p>
          </div>
        </NavLink>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center flex-wrap">
          {items.map((item) =>
            item.children ? (
              <DropdownMenu key={item.label} item={item} />
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-gray-300 hover:bg-white/10 hover:text-white"}`
                }
              >
                {item.icon && <item.icon size={15} />}
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        {/* Right: Logout + Mobile Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut size={15} />
            Logout
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-white/10 bg-[#111827]"
          >
            <nav className="flex flex-col p-3 gap-1">
              {items.map((item) =>
                item.children ? (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleMobileDropdown(item.label)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <span className="flex items-center gap-2">
                        {item.icon && <item.icon size={15} />}
                        {item.label}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${mobileDropdowns[item.label] ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {mobileDropdowns[item.label] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden ml-4 flex flex-col"
                        >
                          {item.children.map((child) =>
                            child.isExternal ? (
                              <a
                                key={child.path}
                                href={child.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setMobileOpen(false)}
                                className="px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                              >
                                {child.label}
                              </a>
                            ) : (
                              <NavLink
                                key={child.path}
                                to={child.path}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                  `px-4 py-2.5 text-sm rounded-xl transition-all
                                  ${isActive ? "text-orange-400 font-medium" : "text-gray-400 hover:text-white hover:bg-white/10"}`
                                }
                              >
                                {child.label}
                              </NavLink>
                            )
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${isActive ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`
                    }
                  >
                    {item.icon && <item.icon size={15} />}
                    {item.label}
                  </NavLink>
                )
              )}

              {/* Mobile Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-3 mt-1 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all border-t border-white/10 pt-3"
              >
                <LogOut size={15} />
                Logout
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default TopNavbar;
