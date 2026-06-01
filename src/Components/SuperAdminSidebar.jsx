import React, { useState, useEffect } from "react";
import axios from "axios";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../Store/authStore";

const API = import.meta.env.VITE_API_BASE_URL;
import logo from "../assets/TMS-LOGO.webp";
import {
  Upload, Eye, UserPlus, Users, DollarSign, UserX,
  GraduationCap, Briefcase, FileText, Layers, User,
  LayoutDashboard, LogOut, Menu, X, ChevronLeft, ChevronRight, ChevronDown, Contact, Shield, BookOpen, Lock, BarChart2,
} from "lucide-react";
import { PROJECT_TRACKER_VIEW_KEY, PROJECT_TRACKER_EDIT_KEY } from "../Constants/pages";

// ── Nav config (groups + direct links) ──────────────────────────────────────
const navConfig = {
  superadmin: [
    { path: "/contacts",          label: "Contacts",      icon: Contact,  roles: ["superadmin", "hr"] },
    { path: "/registration/forms", label: "Registration", icon: Users,    roles: ["superadmin", "hr"] },
    { path: "/users",             label: "Employees",     icon: UserPlus, roles: ["superadmin", "hr"] },
    { path: "/accounts",          label: "Accounts",      icon: DollarSign, roles: ["superadmin", "hr"] },
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
    { path: "/project-tracker", label: "Project Progress Tracker", icon: BarChart2, roles: ["superadmin", "hr"] },
    { path: "/permissions", label: "Permissions", icon: Shield, roles: ["superadmin"] },
    { path: "/roles", label: "Roles", icon: Shield, roles: ["superadmin"] },
    {
      path: "/techmire-academy",
      label: "Techmire Academy",
      icon: BookOpen,
      // Visible to everyone, but only Super Admin can actually enter
      // (route is protected). Non-Super-Admin sees a lock icon.
      roles: ["superadmin", "hr", "employee", "ojt", "student"],
      lockedFor: ["superadmin", "hr", "employee", "ojt", "student"],
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

  // Fetch the dynamic list of custom roles so the sidebar can show each one
  // as a sub-item under "Roles". Re-fetched whenever the sidebar mounts.
  const [customRoles, setCustomRoles] = useState([]);
  useEffect(() => {
    let alive = true;
    const load = () => {
      axios.get(`${API}roles`).then((r) => {
        if (alive) setCustomRoles(r.data.roles || []);
      }).catch(() => {});
    };
    load();
    // Listen for a "roles-updated" event from the Roles page so creating a new
    // role updates the sidebar without a full page reload.
    const handler = () => load();
    window.addEventListener("roles-updated", handler);
    return () => { alive = false; window.removeEventListener("roles-updated", handler); };
  }, []);

  // Super Admin sees everything. For others, first filter by role, then
  // (if a per-user allowedPages list is set) further restrict to those paths.
  const isPathAllowed = (path) => {
    if (activeRole === "superadmin") return true;
    if (!allowedPages) return true; // no custom permissions = default role behavior
    // Project Tracker grants entry on either view or edit key.
    if (path === "/project-tracker") {
      return allowedPages.includes(PROJECT_TRACKER_EDIT_KEY) || allowedPages.includes(PROJECT_TRACKER_VIEW_KEY);
    }
    return allowedPages.includes(path);
  };

  // Custom-role users see only the pages in their allowedPages list —
  // ignore the menu item's hard-coded roles array.
  const passesRoleFilter = (item) => {
    if (activeRole === "role") {
      if (!Array.isArray(allowedPages)) return false;
      if (item.children) {
        return item.children.some((c) => allowedPages.includes(c.path));
      }
      if (item.path === "/project-tracker") {
        return allowedPages.includes(PROJECT_TRACKER_EDIT_KEY) || allowedPages.includes(PROJECT_TRACKER_VIEW_KEY);
      }
      return allowedPages.includes(item.path);
    }
    return item.roles?.includes(activeRole);
  };

  // Inject custom roles as children under the "Roles" menu entry.
  const filteredItems = allItems
    .filter(passesRoleFilter)
    .map((item) => {
      // Convert the flat "Roles" link into a group when there are custom roles.
      if (item.path === "/roles" && customRoles.length > 0) {
        return {
          ...item,
          children: [
            { path: "/roles", label: "Manage roles", icon: Shield },
            ...customRoles.map((r) => ({
              path: `/roles?role=${r.id}`,
              label: r.name,
              icon: Shield,
              _customRole: true,
            })),
          ],
        };
      }
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
    const isLocked = Array.isArray(item.lockedFor) && item.lockedFor.includes(activeRole);
    return (
      <NavLink
        to={isLocked ? "#" : item.path}
        onClick={(e) => {
          if (isLocked) { e.preventDefault(); return; }
          setMobileOpen(false);
        }}
        title={isLocked ? "Locked — Super Admin only" : undefined}
        className={({ isActive }) =>
          `flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 group
          ${indent ? "px-3 mx-3" : "px-4 mx-2"} mb-0.5
          ${isLocked
            ? "text-gray-500 cursor-not-allowed opacity-70"
            : isActive
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
                className={`flex-shrink-0 ${isLocked ? "text-gray-500" : isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}
              />
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-sm font-medium overflow-hidden whitespace-nowrap flex-1"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {isLocked && !collapsed && (
              <Lock size={12} className="text-gray-400 flex-shrink-0" />
            )}
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
                {user?.customRole?.name
                  ? user.customRole.name
                  : role === "superadmin"
                  ? "Super Admin"
                  : role}
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
