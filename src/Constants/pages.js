// Single source of truth for grantable sidebar pages.
// Keys MUST match the sidebar `path` values in SuperAdminSidebar.jsx.
export const GRANTABLE_PAGES = [
  { key: "/contacts",                label: "Contacts" },
  { key: "/users",                   label: "Registration" },
  { key: "/accounts",                label: "Accounts" },
  { key: "/uploadfile",              label: "Upload" },
  { key: "/registerusers",           label: "Payrolls" },
  { key: "/ex-employees",            label: "Ex-Employees" },
  { key: "/students",                label: "Students" },
  { key: "/ojt",                     label: "OJT Trainees" },
  { key: "/view",                    label: "Attendance" },
  { key: "/policies",                label: "Policies" },
  { key: "/activities",              label: "Activities" },
  { key: "/profile",                 label: "Profile" },
  { key: "/smart-assets/dashboard",  label: "Smart Asset Dashboard" },
  { key: "/smart-assets/scan",       label: "Scan QR" },
  { key: "/techmire-academy",        label: "Techmire Academy" },
];

export const PAGE_KEYS = GRANTABLE_PAGES.map((p) => p.key);
