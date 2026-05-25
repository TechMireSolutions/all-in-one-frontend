import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../Store/authStore";
import logo from "../assets/TMS-LOGO.webp";
import {
  Upload, Eye, UserPlus, Users, DollarSign, UserX,
  GraduationCap, Briefcase, FileText, Layers, User,
  LayoutDashboard, LogOut, Menu, X, ChevronLeft, ChevronRight, ChevronDown, Contact, Shield, BookOpen,
} from "lucide-react";

// ── Nav config (groups + direct links) ──────────────────────────────────────
const navConfig = {
  superadmin: [
    { path: "/contacts",      label: "Contacts",     icon: Contact,  roles: ["superadmin", "hr"] },
    { path: "/users",         label: "Registration", icon: Users,    roles: ["superadmin", "hr"] },
    { path: "/accounts",      label: "Accounts",     icon: DollarSign, roles: ["superadmin", "hr"] },
    {
      label: "Management",
      icon: Users,
      roles: ["superadmin", "hr"],
      children: [
        { path: "/uploadfile",    label: "Upload",       icon: Upload },
        { path: "/registerusers", label: "Payrolls",     icon: DollarSign },
      ],
    },
    {
      label: "Records",
      icon: UserX,
      roles: ["superadmin", "hr"],
      children: [
        { path: "/ex-employees", label: "Ex-Employees",  icon: UserX },
        { path: "/students",     label: "Students",      icon: GraduationCap },
        { path: "/ojt",          label: "OJT Trainees",  icon: Briefcase },
      ],
    },
    { path: "/view",      label: "Attendance", icon: Eye,      roles: ["superadmin", "hr", "employee", "ojt", "student"] },
    { path: "/policies",  label: "Policies",   icon: FileText, roles: ["superadmin", "hr", "employee", "ojt", "student"] },
    { path: "/activities",label: "Activities", icon: LayoutDashboard, roles: ["ojt", "student"] },
    { path: "/profile",   label: "Profile",    icon: User,     roles: ["employee", "ojt", "student"] },
    {
      label: "Smart Asset",
      icon: Layers,
      roles: ["superadmin", "hr"],
      children: [
        { path: "/smart-assets/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/smart-assets/scan", label: "Scan QR", icon: Eye },
      ],
    },
    { path: "/permissions", label: "Permissions", icon: Shield, roles: ["superadmin"] },
    { path: "/roles", label: "Roles", icon: Shield, roles: ["superadmin"] },
    {
      path: "/techmire-academy",
      label: "Techmire Academy",
      icon: BookOpen,
      roles: ["superadmin", "hr", "employee", "ojt", "student"],
    },
  ],
};

// flat list of all items (used to filter by role)
const allItems = navConfig.superadmin;

// ── Sidebar component ────────────────────────────────────────────────────────
const SuperAdminSidebar = () => {
  const { role, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({});

  const activeRole = role?.toLowerCase();
  const allowedPages = Array.isArray(user?.allowedPages) ? user.allowedPages : null;

  // Super Admin sees everything. For others, first filter by role, then
  // (if a per-user allowedPages list is set) further restrict to those paths.
  const isPathAllowed = (path) => {
    if (activeRole === "superadmin") return true;
    if (!allowedPages) return true; // no custom permissions = default role behavior
    return allowedPages.includes(path);
  };

  const filteredItems = allItems
    .filter((item) => item.roles?.includes(activeRole))
    .map((item) => {
      if (item.children) {
        const kids = item.children.filter((c) => c.isExternal || isPathAllowed(c.path));
        return kids.length ? { ...item, children: kids } : null;
      }
      if (item.isExternal) return item;
      return isPathAllowed(item.path) ? item : null;
    })
    .filter(Boolean);

  const toggleGroup = (label) =>
    setOpenGroups((p) => ({ ...p, [label]: !p[label] }));

  const handleLogout = () => { logout(); navigate("/"); };

  // ── Render a single nav item (direct link) ─────────────────────────────
  const NavItem = ({ item, indent = false }) => {
    if (item.isExternal) {
      return (
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 group text-gray-400 hover:bg-white/10 hover:text-white ${indent ? "px-3 mx-3" : "px-4 mx-2"}`}
        >
          {item.icon && <item.icon size={16} className="flex-shrink-0 text-gray-500 group-hover:text-white" />}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm font-medium overflow-hidden whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
        </a>
      );
    }
    return (
      <NavLink
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 group
          ${indent ? "px-3 mx-3" : "px-4 mx-2"} mb-0.5
          ${isActive
            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
            : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {item.icon && (
              <item.icon
                size={16}
                className={`flex-shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}
              />
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-medium overflow-hidden whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}
      </NavLink>
    );
  };

  // ── Render a group (accordion dropdown) ───────────────────────────────
  const GroupItem = ({ item }) => {
    const isOpen = openGroups[item.label];
    const Icon = item.icon;
    return (
      <div className="mb-0.5">
        {/* Group header button */}
        <button
          onClick={() => !collapsed && toggleGroup(item.label)}
          title={collapsed ? item.label : undefined}
          className={`w-full flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 group
            ${isOpen && !collapsed ? "bg-white/5 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"}`}
          style={{ width: "calc(100% - 16px)" }}
        >
          <Icon
            size={16}
            className={`flex-shrink-0 ${isOpen ? "text-orange-400" : "text-gray-400 group-hover:text-white"}`}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 text-sm font-medium overflow-hidden whitespace-nowrap text-left"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {!collapsed && (
            <ChevronDown
              size={14}
              className={`flex-shrink-0 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180 text-orange-400" : ""}`}
            />
          )}
        </button>

        {/* Accordion children */}
        <AnimatePresence>
          {isOpen && !collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-3 pl-3 border-l border-white/10 mt-1 mb-1 flex flex-col gap-0.5">
                {item.children.map((child) => (
                  <NavItem key={child.path} item={child} indent />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed tooltip flyout */}
        {collapsed && (
          <div className="group/flyout relative">
            {/* flyout panel on hover when collapsed */}
          </div>
        )}
      </div>
    );
  };

  // ── Sidebar content ────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 flex-shrink-0 ${collapsed ? "justify-center" : ""}`}>
        <img src={logo} alt="logo" className="w-9 h-9 flex-shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="text-white font-bold text-sm leading-tight">Techmire Solutions</p>
              <p className="text-orange-400 text-xs capitalize">
                {role === "superadmin" ? "Super Admin" : role}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {filteredItems.map((item) =>
          item.children ? (
            <GroupItem key={item.label} item={item} />
          ) : (
            <NavItem key={item.path} item={item} />
          )
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={16} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium overflow-hidden whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 230 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:flex flex-col bg-[#111827] h-screen sticky top-0 flex-shrink-0 shadow-xl border-r border-white/5 z-50"
      >
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 bg-orange-500 text-white rounded-full p-1 shadow-lg z-40 hover:bg-orange-600 transition"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <SidebarContent />
      </motion.aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#111827] px-4 py-3 flex items-center justify-between shadow-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <img src={logo} alt="logo" className="w-8 h-8" />
          <span className="text-white font-bold text-sm">Techmire</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ duration: 0.25 }}
              className="md:hidden fixed top-0 left-0 w-64 h-full bg-[#111827] z-50 shadow-2xl border-r border-white/5"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SuperAdminSidebar;
