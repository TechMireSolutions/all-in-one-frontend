// frontend/src/Pages/Contacts.jsx
import React, { useEffect, useState } from "react";
import { useContactStore } from "../Store/contactStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Grid, List, MapPin, Check, Phone, Mail, User, Activity,
  AlertTriangle, X, Upload, Trash2, Edit2, RotateCcw, UserCheck, ShieldAlert,
  Trello, MessageCircle, Send, Users as UsersIcon,
} from "lucide-react";

const Contacts = () => {
  const {
    contacts, mergeLogs, loading, error, fetchContacts, createContact,
    updateContact, deleteContact, checkDuplicates, mergeContacts, undoMerge, fetchMergeLogs
  } = useContactStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMergeOpen, setIsMergeOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("contacts");
  const [selectedIds, setSelectedIds] = useState([]);
  const [waOpen, setWaOpen] = useState(false);
  const [waBody, setWaBody] = useState("Assalamu alaikum {{name}} 👋, this is Techmire Solutions reaching out. We'd love to share more about our programs.");
  const [genderFilter, setGenderFilter] = useState("all");
  const [activeFormTab, setActiveFormTab] = useState("identity");

  // 1:Many child arrays — each tab holds a list of rows now (not a single object).
  // Empty rows are stripped client-side before submit.
  const [emergencies, setEmergencies] = useState([]);   // { name, relation, phone_number, email, address, is_primary }
  const [educations,  setEducations]  = useState([]);   // { degree, field_of_study, institute, grade, start_year, end_year, is_current }
  const [experiences, setExperiences] = useState([]);   // { organization, post, experience_type, start_date, end_date, is_current, responsibilities }
  const [offices,     setOffices]     = useState([]);   // { employee_id, joining_date, leaving_date, post, department, employment_type, status, reporting_to }
  const [healths,     setHealths]     = useState([]);   // { disease, severity, diagnosed_on, medication, notes, is_active }

  const EMPTY_ROW = {
    emergency:  { name: "", relation: "Father", phone_number: "", email: "", address: "", is_primary: false },
    education:  { degree: "", field_of_study: "", institute: "", grade: "", start_year: "", end_year: "", is_current: false },
    experience: { organization: "", post: "", experience_type: "Professional", start_date: "", end_date: "", is_current: false, responsibilities: "" },
    office:     { employee_id: "", joining_date: "", leaving_date: "", post: "", department: "", employment_type: "Full-time", status: "Active", reporting_to: "" },
    health:     { disease: "", severity: "Mild", diagnosed_on: "", medication: "", notes: "", is_active: true },
  };

  // Helpers for repeatable-row sections.
  const addRow    = (setter, kind) => setter((rows) => [...rows, { ...EMPTY_ROW[kind] }]);
  const removeRow = (setter, idx)  => setter((rows) => rows.filter((_, i) => i !== idx));
  const updateRow = (setter, idx, key, val) => setter((rows) => rows.map((r, i) => i === idx ? { ...r, [key]: val } : r));

  const [duplicatesMap, setDuplicatesMap] = useState([]);
  const [activeDuplicatePair, setActiveDuplicatePair] = useState(null);
  const [mergeConflictChoices, setMergeConflictChoices] = useState({});

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    cnic: "",
    gender: "Male",
    dob: "",
    is_syed: false,
    phoneNumbers: [{ phone_number: "", phone_type: "Mobile" }],
    emails: [{ email_address: "", email_type: "Personal" }],
    addresses: [{ address_line1: "", address_line2: "", city: "", state: "", country: "Pakistan", postal_code: "", address_type: "Home" }],
    socials: [{ platform: "LinkedIn", url: "" }]
  });

  const [formErrors, setFormErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchContacts();
    fetchMergeLogs();
    refreshDuplicates();
  }, []);

  const refreshDuplicates = async () => {
    const dupes = await checkDuplicates();
    setDuplicatesMap(dupes);
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getInitials = (first, last) =>
    `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();

  const addListField = (key, defaultValue) => {
    setFormData(prev => ({ ...prev, [key]: [...prev[key], defaultValue] }));
  };

  const removeListField = (key, index) => {
    if (formData[key].length === 1) return;
    setFormData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== index) }));
  };

  const updateListField = (key, index, field, value) => {
    setFormData(prev => {
      const list = [...prev[key]];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [key]: list };
    });
  };

  const checkCnicLuhn = (digits) => {
    let sum = 0, shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let val = parseInt(digits[i], 10);
      if (shouldDouble) { val *= 2; if (val > 9) val -= 9; }
      sum += val;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  const validateCnic = (cnic, gender) => {
    const regex = /^\d{5}-\d{7}-\d{1}$/;
    if (!regex.test(cnic)) return "CNIC must match XXXXX-XXXXXXX-X format.";
    const digits = cnic.replace(/\D/g, "");
    const lastDigit = parseInt(digits[12], 10);
    if (gender === "Male" && lastDigit % 2 === 0) return "Last digit of CNIC for Male must be odd.";
    if (gender === "Female" && lastDigit % 2 !== 0) return "Last digit of CNIC for Female must be even.";
    // Note: NADRA CNICs do not use a Luhn checksum — the previous Luhn check
    // wrongly rejected valid real-world CNICs. We only enforce the format
    // (XXXXX-XXXXXXX-X) and the gender parity rule on the last digit.
    return null;
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.first_name.trim()) errors.first_name = "First name is required.";
    if (!formData.last_name.trim()) errors.last_name = "Last name is required.";
    if (!formData.dob) errors.dob = "Date of Birth is required.";
    const cnicErr = validateCnic(formData.cnic, formData.gender);
    if (cnicErr) errors.cnic = cnicErr;
    formData.emails.forEach((e, idx) => {
      if (e.email_address && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email_address))
        errors[`email_${idx}`] = "Invalid email format.";
    });
    formData.phoneNumbers.forEach((p, idx) => {
      if (p.phone_number && !/^\+?[1-9]\d{1,14}$/.test(p.phone_number))
        errors[`phone_${idx}`] = "Invalid E.164 phone format.";
    });
    setFormErrors(errors);
    // Return the errors object too (not just bool) so callers can inspect it
    // synchronously without waiting for React state to flush.
    return { ok: Object.keys(errors).length === 0, errors };
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const { ok, errors } = validateForm();
    if (!ok) {
      const firstErrTab = (() => {
        if (errors.first_name || errors.last_name || errors.cnic || errors.dob) return "identity";
        if (Object.keys(errors).some((k) => k.startsWith("phone_"))) return "phones";
        if (Object.keys(errors).some((k) => k.startsWith("email_"))) return "emails";
        return "identity";
      })();
      setActiveFormTab(firstErrTab);
      const firstMsg = Object.values(errors)[0];
      showToast(firstMsg || "Please check errors in the form.", "error");
      return;
    }

    const payload = new FormData();
    payload.append("first_name", formData.first_name);
    payload.append("last_name", formData.last_name);
    payload.append("cnic", formData.cnic);
    payload.append("gender", formData.gender);
    payload.append("dob", formData.dob);
    payload.append("is_syed", formData.is_syed);

    const finalPhones = formData.phoneNumbers.filter(p => p.phone_number.trim());
    const finalEmails = formData.emails.filter(e => e.email_address.trim());
    const finalAddresses = formData.addresses.filter(a => a.address_line1.trim());
    const finalSocials = formData.socials.filter(s => s.url.trim());

    payload.append("phoneNumbers", JSON.stringify(finalPhones));
    payload.append("emails", JSON.stringify(finalEmails));
    payload.append("addresses", JSON.stringify(finalAddresses));
    payload.append("socials", JSON.stringify(finalSocials));
    // Strip blank rows (e.g. an emergency row where name is empty)
    const finalEmergencies  = emergencies.filter((r) => r.name?.trim() && r.phone_number?.trim());
    const finalEducations   = educations.filter((r) => r.degree?.trim() && r.institute?.trim());
    const finalExperiences  = experiences.filter((r) => r.organization?.trim() && r.post?.trim());
    const finalOffices      = offices.filter((r) => r.employee_id?.trim());
    const finalHealths      = healths.filter((r) => r.disease?.trim());
    payload.append("emergencies", JSON.stringify(finalEmergencies));
    payload.append("educations",  JSON.stringify(finalEducations));
    payload.append("experiences", JSON.stringify(finalExperiences));
    payload.append("offices",     JSON.stringify(finalOffices));
    payload.append("healths",     JSON.stringify(finalHealths));
    if (imageFile) payload.append("profile_picture", imageFile);

    let res;
    if (selectedContact) {
      res = await updateContact(selectedContact.id, payload);
    } else {
      res = await createContact(payload);
    }

    if (res.success) {
      showToast(selectedContact ? "Contact updated successfully!" : "Contact created successfully!");
      if (res.suggestions?.length > 0) showToast(`Suggestion: ${res.suggestions[0].reason}`, "info");
      setIsModalOpen(false);
      setSelectedContact(null);
      resetForm();
      fetchContacts();
      refreshDuplicates();
    } else {
      showToast(res.error || "Save operation failed.", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "", last_name: "", cnic: "", gender: "Male", dob: "", is_syed: false,
      phoneNumbers: [{ phone_number: "", phone_type: "Mobile" }],
      emails: [{ email_address: "", email_type: "Personal" }],
      addresses: [{ address_line1: "", address_line2: "", city: "", state: "", country: "Pakistan", postal_code: "", address_type: "Home" }],
      socials: [{ platform: "LinkedIn", url: "" }]
    });
    setEmergencies([]);
    setEducations([]);
    setExperiences([]);
    setOffices([]);
    setHealths([]);
    setImageFile(null);
    setImagePreview(null);
    setFormErrors({});
  };

  const openAddModal = () => { setSelectedContact(null); resetForm(); setActiveFormTab("identity"); setIsModalOpen(true); };

  const openEditModal = (c) => {
    setSelectedContact(c);
    setActiveFormTab("identity");
    setFormErrors({});
    // Hydrate the 1:Many child arrays from API includes.
    setEmergencies(Array.isArray(c.emergencies) ? c.emergencies : []);
    setEducations(Array.isArray(c.educations)   ? c.educations   : []);
    setExperiences(Array.isArray(c.experiences) ? c.experiences  : []);
    setOffices(Array.isArray(c.offices)         ? c.offices      : []);
    setHealths(Array.isArray(c.healths)         ? c.healths      : []);
    setFormData({
      first_name: c.first_name || "", last_name: c.last_name || "",
      cnic: c.cnic || "", gender: c.gender || "Male",
      dob: c.dob ? c.dob.split("T")[0] : "", is_syed: c.is_syed || false,
      phoneNumbers: c.phoneNumbers?.length ? c.phoneNumbers : [{ phone_number: "", phone_type: "Mobile" }],
      emails: c.emails?.length ? c.emails : [{ email_address: "", email_type: "Personal" }],
      addresses: c.addresses?.length ? c.addresses : [{ address_line1: "", address_line2: "", city: "", state: "", country: "Pakistan", postal_code: "", address_type: "Home" }],
      socials: c.socials?.length ? c.socials : [{ platform: "LinkedIn", url: "" }]
    });
    setImagePreview(c.profile_picture);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this contact?")) {
      const success = await deleteContact(id);
      if (success) { showToast("Contact deleted successfully."); refreshDuplicates(); }
      else showToast("Failed to delete contact.", "error");
    }
  };

  const handleMergeSubmit = async () => {
    const payload = { masterId: activeDuplicatePair.master.id, sourceId: activeDuplicatePair.source.id, conflictChoices: mergeConflictChoices };
    const res = await mergeContacts(payload);
    if (res.success) {
      showToast("Contacts merged successfully.");
      setIsMergeOpen(false); setActiveDuplicatePair(null); setMergeConflictChoices({});
      fetchContacts(); refreshDuplicates(); fetchMergeLogs();
    } else {
      showToast(res.error || "Merge failed.", "error");
    }
  };

  const handleUndo = async (logId) => {
    if (window.confirm("Reversing this merge will restore both deleted contact and revert values. Proceed?")) {
      const success = await undoMerge(logId);
      if (success) { showToast("Merge successfully reversed. Contacts restored!"); refreshDuplicates(); }
      else showToast("Failed to undo merge.", "error");
    }
  };

  const filteredContacts = contacts.filter(c => {
    if (genderFilter !== "all" && c.gender !== genderFilter) return false;
    const full = `${c.first_name} ${c.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      full.includes(query) || c.cnic?.includes(query) ||
      c.phoneNumbers?.some(p => p.phone_number.includes(query)) ||
      c.emails?.some(e => e.email_address.toLowerCase().includes(query)) ||
      c.addresses?.some(a => a.city?.toLowerCase().includes(query))
    );
  });

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none";
  const labelCls = "block text-xs font-semibold text-gray-600 mb-1";

  return (
    <div className="container mx-auto p-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-lg shadow-lg font-semibold text-sm ${
              toast.type === "error" ? "bg-red-100 text-red-700 border-l-4 border-red-500"
              : toast.type === "info" ? "bg-amber-100 text-amber-700 border-l-4 border-amber-500"
              : "bg-green-100 text-green-700 border-l-4 border-green-500"
            }`}
          >
            {toast.type === "error" ? <ShieldAlert className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Contacts Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""} in CRM database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab("contacts")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeSubTab === "contacts"
                ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <User size={16} /> Contacts
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeSubTab === "history"
                ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <RotateCcw size={16} /> Audit Log
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-md shadow-orange-200"
          >
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {activeSubTab === "contacts" ? (
        <>
          {/* Duplicate Warning */}
          {duplicatesMap.length > 0 && (
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Fuzzy Duplicate Matches Identified</p>
                  <p className="text-amber-700 text-xs mt-0.5">
                    {duplicatesMap.length} pair{duplicatesMap.length !== 1 ? "s" : ""} of potential duplicate records found.
                  </p>
                </div>
              </div>
              {duplicatesMap.slice(0, 1).map((dup, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveDuplicatePair({ master: dup.contact, source: dup.possibleDuplicates[0].contact });
                    setIsMergeOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition flex-shrink-0"
                >
                  Resolve Matches
                </button>
              ))}
            </div>
          )}

          {/* Search + View toggle */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, CNIC, email, phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="border border-gray-300 bg-white rounded-lg px-2 py-1.5 text-sm"
                title="Filter by gender"
              >
                <option value="all">All genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <div className="flex items-center gap-1 border border-gray-300 bg-white p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition ${viewMode === "list" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-gray-600"}`}
                  title="List view"
                >
                  <List size={16} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition ${viewMode === "grid" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-gray-600"}`}
                  title="Grid view"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("kanban")}
                  className={`p-2 rounded-md transition ${viewMode === "kanban" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-gray-600"}`}
                  title="Kanban view"
                >
                  <Trello size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="bg-white rounded-lg shadow flex flex-col items-center justify-center h-48 text-gray-400">
              <User className="w-10 h-10 mb-2 text-gray-300" />
              <p className="text-sm">No contacts found matching your search.</p>
            </div>
          ) : viewMode === "list" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-x-auto bg-white rounded-lg shadow"
            >
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[oklch(0.67_0.19_42.13)]">
                  <tr>
                    <th className="px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={filteredContacts.length > 0 && filteredContacts.every((c) => selectedIds.includes(c.id))}
                        onChange={() => setSelectedIds((sel) => sel.length === filteredContacts.length ? [] : filteredContacts.map((c) => c.id))}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">CNIC</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Gender</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Ages (Solar / Lunar)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">City</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <AnimatePresence>
                    {filteredContacts.map(c => {
                      const hasDupe = duplicatesMap.some(d => d.contact.id === c.id);
                      return (
                        <motion.tr
                          key={c.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className={`hover:bg-gray-50 ${selectedIds.includes(c.id) ? "bg-orange-50/40" : ""}`}
                        >
                          <td className="px-3 py-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(c.id)}
                              onChange={() => setSelectedIds((sel) => sel.includes(c.id) ? sel.filter((x) => x !== c.id) : [...sel, c.id])}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {c.profile_picture ? (
                                <img src={c.profile_picture} alt="Profile" className="h-9 w-9 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-sm">
                                  {getInitials(c.first_name, c.last_name)}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold text-gray-900">{c.first_name} {c.last_name}</span>
                                  {c.is_syed && (
                                    <span className="text-[9px] bg-orange-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase">Syed</span>
                                  )}
                                  {hasDupe && (
                                    <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                      <AlertTriangle size={9} /> Dupe
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{c.cnic}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.gender}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {c.current_age_solar} yrs / {c.current_age_lunar} AH
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {c.phoneNumbers?.[0]?.phone_number || <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {c.emails?.[0]?.email_address || <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {c.addresses?.[0]?.city || <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-3">
                              <button onClick={() => openEditModal(c)} className="text-blue-600 hover:text-blue-900" title="Edit">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900" title="Delete">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </motion.div>
          ) : viewMode === "kanban" ? (
            /* Kanban View — grouped by gender */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "Male",   label: "Male",   dot: "bg-sky-500",     bg: "bg-sky-50",     border: "border-sky-200" },
                { key: "Female", label: "Female", dot: "bg-rose-500",    bg: "bg-rose-50",    border: "border-rose-200" },
                { key: "Other",  label: "Other",  dot: "bg-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
              ].map((col) => {
                const items = filteredContacts.filter((c) => (c.gender || "Other") === col.key);
                return (
                  <div key={col.key} className={`rounded-xl border ${col.border} ${col.bg} p-3`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <h3 className="font-semibold text-gray-800 text-sm">{col.label}</h3>
                      <span className="ml-auto text-[11px] text-gray-500">{items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((c, i) => (
                        <motion.button
                          key={c.id}
                          onClick={() => openEditModal(c)}
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-orange-300 transition"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(c.id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => setSelectedIds((sel) => sel.includes(c.id) ? sel.filter((x) => x !== c.id) : [...sel, c.id])}
                            />
                            <p className="font-medium text-gray-800 text-sm flex-1">{c.first_name} {c.last_name}</p>
                            {c.is_syed && <span className="text-[9px] bg-orange-500 text-white font-bold px-1.5 py-0.5 rounded uppercase">Syed</span>}
                          </div>
                          <div className="mt-1.5 space-y-1 text-[11px] text-gray-500 ml-6">
                            {c.phoneNumbers?.[0]?.phone_number && <p className="flex items-center gap-1.5"><Phone size={10} /> {c.phoneNumbers[0].phone_number}</p>}
                            {c.emails?.[0]?.email_address && <p className="flex items-center gap-1.5 truncate"><Mail size={10} /> {c.emails[0].email_address}</p>}
                            {c.addresses?.[0]?.city && <p className="flex items-center gap-1.5"><MapPin size={10} /> {c.addresses[0].city}</p>}
                          </div>
                        </motion.button>
                      ))}
                      {items.length === 0 && <p className="text-center text-[11px] text-gray-400 py-4">No contacts here.</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredContacts.map(c => {
                const hasDupe = duplicatesMap.some(d => d.contact.id === c.id);
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 relative"
                  >
                    {hasDupe && (
                      <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle size={10} /> Dupe
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      {c.profile_picture ? (
                        <img src={c.profile_picture} alt="Profile" className="h-12 w-12 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-base">
                          {getInitials(c.first_name, c.last_name)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-gray-800 text-sm">{c.first_name} {c.last_name}</h3>
                          {c.is_syed && (
                            <span className="text-[9px] bg-orange-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase">Syed</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-mono">{c.cnic}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 mb-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-gray-400">Solar Age</span>
                        <span className="font-semibold text-gray-700">{c.current_age_solar} yrs</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-semibold text-gray-400">Lunar AH</span>
                        <span className="font-semibold text-gray-700">{c.current_age_lunar} AH</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                      {c.phoneNumbers?.[0] && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-orange-500 flex-shrink-0" />
                          <span className="truncate">{c.phoneNumbers[0].phone_number}</span>
                        </div>
                      )}
                      {c.emails?.[0] && (
                        <div className="flex items-center gap-2">
                          <Mail size={12} className="text-orange-500 flex-shrink-0" />
                          <span className="truncate">{c.emails[0].email_address}</span>
                        </div>
                      )}
                      {c.addresses?.[0] && (
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-orange-500 flex-shrink-0" />
                          <span className="truncate">{c.addresses[0].city}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 border-t border-gray-100 pt-3">
                      <button
                        onClick={() => openEditModal(c)}
                        className="flex-1 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="flex-1 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Audit Log Tab */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Immutable Merge Resolution Logs</h3>
            <p className="text-sm text-gray-500 mt-0.5">{mergeLogs.length} merge operation{mergeLogs.length !== 1 ? "s" : ""} recorded</p>
          </div>
          {mergeLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <RotateCcw className="w-10 h-10 mb-2 text-gray-300" />
              <p className="text-sm">No merge operations in audit trail.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[oklch(0.67_0.19_42.13)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Log ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Master Record</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Source Record</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mergeLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{log.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                      {log.master_snapshot?.first_name} {log.master_snapshot?.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.source_snapshot?.first_name} {log.source_snapshot?.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        log.status === "Merged"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.merged_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {log.status === "Merged" && (
                        <button
                          onClick={() => handleUndo(log.id)}
                          className="flex items-center gap-1.5 ml-auto px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                        >
                          <RotateCcw size={12} /> Revert
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── BULK ACTIONS FLOATING BAR ── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3"
          >
            <span className="text-xs flex items-center gap-1.5">
              <UsersIcon size={12} /> {selectedIds.length} selected
            </span>
            <button
              onClick={() => setWaOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
            >
              <MessageCircle size={12} /> WhatsApp
            </button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-gray-300 hover:text-white">
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WHATSAPP SLIDE-UP PANEL ── */}
      <AnimatePresence>
        {waOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40"
              onClick={() => setWaOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center">
                    <MessageCircle size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Send WhatsApp broadcast</h3>
                    <p className="text-[11px] text-gray-500">{selectedIds.length} contact{selectedIds.length === 1 ? "" : "s"} selected</p>
                  </div>
                </div>
                <button onClick={() => setWaOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Templates</p>
                  <div className="space-y-2">
                    {[
                      { label: "Introduction",     body: "Assalamu alaikum {{name}} 👋, this is Techmire Solutions reaching out. We'd love to share more about our programs." },
                      { label: "Class reminder",   body: "Reminder: {{name}}, your child's class begins at 5 PM today. JazakAllah Khair." },
                      { label: "Payment reminder", body: "Dear {{name}}, this is a friendly reminder that the monthly fee is due. Please settle at your earliest." },
                    ].map((t) => (
                      <button
                        key={t.label}
                        onClick={() => setWaBody(t.body)}
                        className={`w-full text-left p-2 border rounded-lg text-sm transition ${waBody === t.body ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        <span className="block font-medium text-gray-800">{t.label}</span>
                        <span className="block text-[11px] text-gray-500 line-clamp-2">{t.body}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-gray-700 uppercase mb-2">Message</p>
                  <textarea
                    rows={8}
                    value={waBody}
                    onChange={(e) => setWaBody(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none"
                    placeholder="Use {{name}} to personalize."
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Variables: <code>{`{{name}}`}</code></p>

                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-[11px] text-gray-600 max-h-32 overflow-y-auto">
                    <p className="font-semibold mb-1 text-gray-700">Recipients</p>
                    {contacts
                      .filter((c) => selectedIds.includes(c.id))
                      .map((c) => (
                        <p key={c.id}>
                          • {c.first_name} {c.last_name} —{" "}
                          {c.phoneNumbers?.[0]?.phone_number || <span className="text-rose-500">no phone</span>}
                        </p>
                      ))}
                  </div>

                  <button
                    onClick={() => {
                      const previewName = contacts.find((c) => c.id === selectedIds[0])?.first_name || "Friend";
                      alert(`Broadcast queued for ${selectedIds.length} contact(s).\n\nPreview to ${previewName}:\n${waBody.replace("{{name}}", previewName)}`);
                      setWaOpen(false);
                      setSelectedIds([]);
                    }}
                    className="mt-4 self-end px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg inline-flex items-center gap-2 shadow-md"
                  >
                    <Send size={14} /> Send to {selectedIds.length}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ADD / EDIT MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center px-6 pt-5 pb-3">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedContact ? "Edit Contact" : "Add New Contact"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              {/* Progress bar */}
              {(() => {
                const checks = [
                  !!formData.first_name,
                  !!formData.last_name,
                  !!formData.cnic,
                  !!formData.dob,
                  formData.phoneNumbers.some((p) => p.phone_number),
                  formData.emails.some((e) => e.email_address),
                  formData.addresses.some((a) => a.address_line1),
                  formData.socials.some((s) => s.url),
                  emergencies.length > 0,
                  educations.length > 0,
                  experiences.length > 0,
                  offices.length > 0,
                ];
                const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
                return (
                  <div className="px-6">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                      <span>Progress</span><span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", damping: 18 }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Tabs */}
              <div className="px-6 mt-4 border-b border-gray-200 flex gap-1 overflow-x-auto">
                {[
                  { k: "identity",   l: "Identity",   i: User },
                  { k: "phones",     l: "Phones",     i: Phone },
                  { k: "emails",     l: "Emails",     i: Mail },
                  { k: "addresses",  l: "Addresses",  i: MapPin },
                  { k: "education",  l: "Education",  i: User },
                  { k: "experience", l: "Experience", i: Activity },
                  { k: "office",     l: "Office",     i: UserCheck },
                  { k: "health",     l: "Health",     i: ShieldAlert },
                  { k: "socials",    l: "Socials",    i: Activity },
                  { k: "emergency",  l: "Emergency",  i: ShieldAlert },
                ].map((t) => (
                  <button
                    key={t.k}
                    type="button"
                    onClick={() => setActiveFormTab(t.k)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition whitespace-nowrap ${
                      activeFormTab === t.k ? "text-emerald-700" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    <t.i size={14} />
                    {t.l}
                    {activeFormTab === t.k && (
                      <motion.span layoutId="contact-form-tab" className="absolute left-2 right-2 -bottom-px h-0.5 bg-emerald-500" />
                    )}
                  </button>
                ))}
              </div>

              <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
                {/* Profile Picture + Name (Identity tab) */}
                <div className={`${activeFormTab === "identity" ? "" : "hidden"} flex flex-col md:flex-row gap-6 items-start pb-6 border-b border-gray-200`}>
                  <div className="relative flex-shrink-0">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" alt="Preview" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-orange-500">
                        <User size={28} />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 p-1.5 bg-orange-500 hover:bg-orange-600 rounded-full cursor-pointer shadow transition">
                      <Upload className="w-3 h-3 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                    <div>
                      <label className={labelCls}>First Name *</label>
                      <input type="text" value={formData.first_name}
                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                        className={inputCls} placeholder="e.g. Muhammad" />
                      {formErrors.first_name && <p className="text-red-500 text-xs mt-1">{formErrors.first_name}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Last Name *</label>
                      <input type="text" value={formData.last_name}
                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                        className={inputCls} placeholder="e.g. Ali" />
                      {formErrors.last_name && <p className="text-red-500 text-xs mt-1">{formErrors.last_name}</p>}
                    </div>
                  </div>
                </div>

                {/* Core fields (Identity tab) */}
                <div className={`${activeFormTab === "identity" ? "" : "hidden"} grid grid-cols-1 md:grid-cols-4 gap-4`}>
                  <div>
                    <label className={labelCls}>Gender *</label>
                    <select value={formData.gender}
                      onChange={e => setFormData({ ...formData, gender: e.target.value })}
                      className={inputCls}>
                      <option>Male</option><option>Female</option>
                      <option>Other</option><option>Prefer not to say</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>CNIC (Strictly Validated) *</label>
                    <input type="text" placeholder="XXXXX-XXXXXXX-X" value={formData.cnic}
                      onChange={e => setFormData({ ...formData, cnic: e.target.value })}
                      className={inputCls} />
                    {formErrors.cnic && <p className="text-red-500 text-xs mt-1">{formErrors.cnic}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Date of Birth *</label>
                    <input type="date" value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      className={inputCls} />
                    {formErrors.dob && <p className="text-red-500 text-xs mt-1">{formErrors.dob}</p>}
                  </div>
                  <div className="flex items-center gap-2 mt-1 md:col-span-4">
                    <input type="checkbox" id="is_syed" checked={formData.is_syed}
                      onChange={e => setFormData({ ...formData, is_syed: e.target.checked })}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
                    <label htmlFor="is_syed" className="text-sm text-gray-700 cursor-pointer font-medium">
                      Is Syed (Auto Prefix: Syed / Syeda)
                    </label>
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className={`${activeFormTab === "phones" ? "" : "hidden"} pt-2`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Phone Numbers</h4>
                    <button type="button" onClick={() => addListField("phoneNumbers", { phone_number: "", phone_type: "Mobile" })}
                      className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                      <Plus size={14} /> Add Phone
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.phoneNumbers.map((p, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" placeholder="+923001234567" value={p.phone_number}
                          onChange={e => updateListField("phoneNumbers", idx, "phone_number", e.target.value)}
                          className={`flex-1 ${inputCls}`} />
                        <select value={p.phone_type}
                          onChange={e => updateListField("phoneNumbers", idx, "phone_type", e.target.value)}
                          className="w-28 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                          <option>Mobile</option><option>Home</option><option>Office</option>
                          <option>WhatsApp</option><option>Other</option>
                        </select>
                        <button type="button" onClick={() => removeListField("phoneNumbers", idx)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emails */}
                <div className={`${activeFormTab === "emails" ? "" : "hidden"} pt-2`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Emails</h4>
                    <button type="button" onClick={() => addListField("emails", { email_address: "", email_type: "Personal" })}
                      className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                      <Plus size={14} /> Add Email
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.emails.map((e, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input type="text" placeholder="email@domain.com" value={e.email_address}
                          onChange={ev => updateListField("emails", idx, "email_address", ev.target.value)}
                          className={`flex-1 ${inputCls}`} />
                        <select value={e.email_type}
                          onChange={ev => updateListField("emails", idx, "email_type", ev.target.value)}
                          className="w-28 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                          <option>Personal</option><option>Office</option>
                          <option>Home</option><option>Other</option>
                        </select>
                        <button type="button" onClick={() => removeListField("emails", idx)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Addresses */}
                <div className={`${activeFormTab === "addresses" ? "" : "hidden"} pt-2`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Addresses</h4>
                    <button type="button" onClick={() => addListField("addresses", { address_line1: "", address_line2: "", city: "", state: "", country: "Pakistan", postal_code: "", address_type: "Home" })}
                      className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                      <Plus size={14} /> Add Address
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.addresses.map((a, idx) => (
                      <div key={idx} className="border border-gray-200 bg-gray-50 p-4 rounded-lg relative space-y-3">
                        <button type="button" onClick={() => removeListField("addresses", idx)}
                          className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={13} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input type="text" placeholder="Address Line 1" value={a.address_line1}
                            onChange={e => updateListField("addresses", idx, "address_line1", e.target.value)}
                            className={inputCls} />
                          <input type="text" placeholder="Address Line 2 (Optional)" value={a.address_line2}
                            onChange={e => updateListField("addresses", idx, "address_line2", e.target.value)}
                            className={inputCls} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <input type="text" placeholder="City" value={a.city}
                            onChange={e => updateListField("addresses", idx, "city", e.target.value)} className={inputCls} />
                          <input type="text" placeholder="State" value={a.state}
                            onChange={e => updateListField("addresses", idx, "state", e.target.value)} className={inputCls} />
                          <input type="text" placeholder="Country" value={a.country}
                            onChange={e => updateListField("addresses", idx, "country", e.target.value)} className={inputCls} />
                          <input type="text" placeholder="Postal" value={a.postal_code}
                            onChange={e => updateListField("addresses", idx, "postal_code", e.target.value)} className={inputCls} />
                          <select value={a.address_type}
                            onChange={e => updateListField("addresses", idx, "address_type", e.target.value)}
                            className={inputCls}>
                            <option>Home</option><option>Office</option>
                            <option>Mailing</option><option>Other</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Socials */}
                <div className={`${activeFormTab === "socials" ? "" : "hidden"} pt-2`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Social Media</h4>
                    <button type="button" onClick={() => addListField("socials", { platform: "LinkedIn", url: "" })}
                      className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1">
                      <Plus size={14} /> Add Platform
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.socials.map((s, idx) => (
                      <div key={idx} className="flex gap-2">
                        <select value={s.platform}
                          onChange={e => updateListField("socials", idx, "platform", e.target.value)}
                          className="w-32 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                          <option>LinkedIn</option><option>Facebook</option>
                          <option>Twitter</option><option>Instagram</option><option>Other</option>
                        </select>
                        <input type="text" placeholder="Profile URL" value={s.url}
                          onChange={e => updateListField("socials", idx, "url", e.target.value)}
                          className={`flex-1 ${inputCls}`} />
                        <button type="button" onClick={() => removeListField("socials", idx)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education — repeatable rows */}
                <div className={`${activeFormTab === "education" ? "" : "hidden"} pt-2 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Education History</h4>
                    <button type="button" onClick={() => addRow(setEducations, "education")} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <Plus size={14} /> Add Education
                    </button>
                  </div>
                  {educations.length === 0 && <p className="text-xs text-gray-400">No education added yet. Click "Add Education" to start.</p>}
                  {educations.map((row, i) => (
                    <div key={i} className="border border-gray-200 bg-gray-50 p-3 rounded-lg relative">
                      <button type="button" onClick={() => removeRow(setEducations, i)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><label className={labelCls}>Degree *</label><input value={row.degree} onChange={(e) => updateRow(setEducations, i, "degree", e.target.value)} className={inputCls} placeholder="e.g. BSCS" /></div>
                        <div><label className={labelCls}>Field of Study</label><input value={row.field_of_study} onChange={(e) => updateRow(setEducations, i, "field_of_study", e.target.value)} className={inputCls} placeholder="e.g. Computer Science" /></div>
                        <div><label className={labelCls}>Institute *</label><input value={row.institute} onChange={(e) => updateRow(setEducations, i, "institute", e.target.value)} className={inputCls} placeholder="e.g. FAST NUCES" /></div>
                        <div><label className={labelCls}>Grade</label><input value={row.grade} onChange={(e) => updateRow(setEducations, i, "grade", e.target.value)} className={inputCls} placeholder="A / 3.8 GPA" /></div>
                        <div><label className={labelCls}>Start Year</label><input type="number" value={row.start_year} onChange={(e) => updateRow(setEducations, i, "start_year", e.target.value)} className={inputCls} placeholder="2018" /></div>
                        <div><label className={labelCls}>End Year</label><input type="number" value={row.end_year} onChange={(e) => updateRow(setEducations, i, "end_year", e.target.value)} className={inputCls} placeholder="2022" /></div>
                      </div>
                      <label className="inline-flex items-center gap-2 mt-2 text-xs">
                        <input type="checkbox" checked={!!row.is_current} onChange={(e) => updateRow(setEducations, i, "is_current", e.target.checked)} />
                        Currently studying
                      </label>
                    </div>
                  ))}
                </div>

                {/* Experience — repeatable rows */}
                <div className={`${activeFormTab === "experience" ? "" : "hidden"} pt-2 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Work / Teaching Experience</h4>
                    <button type="button" onClick={() => addRow(setExperiences, "experience")} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <Plus size={14} /> Add Experience
                    </button>
                  </div>
                  {experiences.length === 0 && <p className="text-xs text-gray-400">No experience added yet.</p>}
                  {experiences.map((row, i) => (
                    <div key={i} className="border border-gray-200 bg-gray-50 p-3 rounded-lg relative">
                      <button type="button" onClick={() => removeRow(setExperiences, i)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><label className={labelCls}>Organization *</label><input value={row.organization} onChange={(e) => updateRow(setExperiences, i, "organization", e.target.value)} className={inputCls} placeholder="e.g. Techmire Solutions" /></div>
                        <div><label className={labelCls}>Post *</label><input value={row.post} onChange={(e) => updateRow(setExperiences, i, "post", e.target.value)} className={inputCls} placeholder="e.g. Software Engineer" /></div>
                        <div>
                          <label className={labelCls}>Type</label>
                          <select value={row.experience_type} onChange={(e) => updateRow(setExperiences, i, "experience_type", e.target.value)} className={inputCls}>
                            <option>Teaching</option><option>Professional</option><option>Internship</option><option>Volunteer</option><option>Other</option>
                          </select>
                        </div>
                        <div><label className={labelCls}>Start Date</label><input type="date" value={row.start_date} onChange={(e) => updateRow(setExperiences, i, "start_date", e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>End Date</label><input type="date" value={row.end_date} onChange={(e) => updateRow(setExperiences, i, "end_date", e.target.value)} className={inputCls} /></div>
                      </div>
                      <div className="mt-2"><label className={labelCls}>Responsibilities</label><textarea rows={2} value={row.responsibilities} onChange={(e) => updateRow(setExperiences, i, "responsibilities", e.target.value)} className={inputCls} placeholder="Key duties & achievements…" /></div>
                      <label className="inline-flex items-center gap-2 mt-2 text-xs">
                        <input type="checkbox" checked={!!row.is_current} onChange={(e) => updateRow(setExperiences, i, "is_current", e.target.checked)} />
                        Currently working here
                      </label>
                    </div>
                  ))}
                </div>

                {/* Office — repeatable rows */}
                <div className={`${activeFormTab === "office" ? "" : "hidden"} pt-2 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Office / Employment</h4>
                    <button type="button" onClick={() => addRow(setOffices, "office")} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <Plus size={14} /> Add Office Record
                    </button>
                  </div>
                  {offices.length === 0 && <p className="text-xs text-gray-400">No office records added yet.</p>}
                  {offices.map((row, i) => (
                    <div key={i} className="border border-gray-200 bg-gray-50 p-3 rounded-lg relative">
                      <button type="button" onClick={() => removeRow(setOffices, i)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><label className={labelCls}>Employee ID *</label><input value={row.employee_id} onChange={(e) => updateRow(setOffices, i, "employee_id", e.target.value)} className={inputCls} placeholder="EMP-001" /></div>
                        <div><label className={labelCls}>Post</label><input value={row.post} onChange={(e) => updateRow(setOffices, i, "post", e.target.value)} className={inputCls} placeholder="e.g. Senior Developer" /></div>
                        <div><label className={labelCls}>Department</label><input value={row.department} onChange={(e) => updateRow(setOffices, i, "department", e.target.value)} className={inputCls} placeholder="e.g. Engineering" /></div>
                        <div>
                          <label className={labelCls}>Employment Type</label>
                          <select value={row.employment_type} onChange={(e) => updateRow(setOffices, i, "employment_type", e.target.value)} className={inputCls}>
                            <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Intern</option>
                          </select>
                        </div>
                        <div><label className={labelCls}>Joining Date</label><input type="date" value={row.joining_date} onChange={(e) => updateRow(setOffices, i, "joining_date", e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Leaving Date</label><input type="date" value={row.leaving_date} onChange={(e) => updateRow(setOffices, i, "leaving_date", e.target.value)} className={inputCls} /></div>
                        <div>
                          <label className={labelCls}>Status</label>
                          <select value={row.status} onChange={(e) => updateRow(setOffices, i, "status", e.target.value)} className={inputCls}>
                            <option>Active</option><option>Inactive</option><option>Terminated</option><option>Resigned</option>
                          </select>
                        </div>
                        <div><label className={labelCls}>Reporting To (Contact UUID)</label><input value={row.reporting_to} onChange={(e) => updateRow(setOffices, i, "reporting_to", e.target.value)} className={inputCls} placeholder="Manager's contact UUID (optional)" /></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Health — repeatable rows */}
                <div className={`${activeFormTab === "health" ? "" : "hidden"} pt-2 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Health Records</h4>
                    <button type="button" onClick={() => addRow(setHealths, "health")} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <Plus size={14} /> Add Condition
                    </button>
                  </div>
                  {healths.length === 0 && <p className="text-xs text-gray-400">No health records added yet.</p>}
                  {healths.map((row, i) => (
                    <div key={i} className="border border-gray-200 bg-gray-50 p-3 rounded-lg relative">
                      <button type="button" onClick={() => removeRow(setHealths, i)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><label className={labelCls}>Disease / Condition *</label><input value={row.disease} onChange={(e) => updateRow(setHealths, i, "disease", e.target.value)} className={inputCls} placeholder="e.g. Diabetes Type 2" /></div>
                        <div>
                          <label className={labelCls}>Severity</label>
                          <select value={row.severity} onChange={(e) => updateRow(setHealths, i, "severity", e.target.value)} className={inputCls}>
                            <option>Mild</option><option>Moderate</option><option>Severe</option><option>Critical</option>
                          </select>
                        </div>
                        <div><label className={labelCls}>Diagnosed On</label><input type="date" value={row.diagnosed_on} onChange={(e) => updateRow(setHealths, i, "diagnosed_on", e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Medication</label><input value={row.medication} onChange={(e) => updateRow(setHealths, i, "medication", e.target.value)} className={inputCls} placeholder="e.g. Metformin 500mg" /></div>
                      </div>
                      <div className="mt-2"><label className={labelCls}>Notes</label><textarea rows={2} value={row.notes} onChange={(e) => updateRow(setHealths, i, "notes", e.target.value)} className={inputCls} placeholder="Allergies, restrictions, recent updates…" /></div>
                      <label className="inline-flex items-center gap-2 mt-2 text-xs">
                        <input type="checkbox" checked={row.is_active !== false} onChange={(e) => updateRow(setHealths, i, "is_active", e.target.checked)} />
                        Active condition
                      </label>
                    </div>
                  ))}
                </div>

                {/* Emergency — repeatable rows */}
                <div className={`${activeFormTab === "emergency" ? "" : "hidden"} pt-2 space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Emergency Contacts</h4>
                    <button type="button" onClick={() => addRow(setEmergencies, "emergency")} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <Plus size={14} /> Add Emergency Contact
                    </button>
                  </div>
                  {emergencies.length === 0 && <p className="text-xs text-gray-400">No emergency contacts yet.</p>}
                  {emergencies.map((row, i) => (
                    <div key={i} className="border border-gray-200 bg-gray-50 p-3 rounded-lg relative">
                      <button type="button" onClick={() => removeRow(setEmergencies, i)} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><label className={labelCls}>Name *</label><input value={row.name} onChange={(e) => updateRow(setEmergencies, i, "name", e.target.value)} className={inputCls} placeholder="e.g. Abdul Karim" /></div>
                        <div>
                          <label className={labelCls}>Relation *</label>
                          <select value={row.relation} onChange={(e) => updateRow(setEmergencies, i, "relation", e.target.value)} className={inputCls}>
                            <option>Father</option><option>Mother</option><option>Spouse</option><option>Sibling</option><option>Son</option><option>Daughter</option><option>Friend</option><option>Guardian</option><option>Other</option>
                          </select>
                        </div>
                        <div><label className={labelCls}>Phone (E.164) *</label><input value={row.phone_number} onChange={(e) => updateRow(setEmergencies, i, "phone_number", e.target.value)} className={inputCls} placeholder="+923001234567" /></div>
                        <div><label className={labelCls}>Email</label><input value={row.email} onChange={(e) => updateRow(setEmergencies, i, "email", e.target.value)} className={inputCls} placeholder="optional@example.com" /></div>
                        <div className="md:col-span-2"><label className={labelCls}>Address</label><input value={row.address} onChange={(e) => updateRow(setEmergencies, i, "address", e.target.value)} className={inputCls} placeholder="House #, street, city" /></div>
                      </div>
                      <label className="inline-flex items-center gap-2 mt-2 text-xs">
                        <input type="checkbox" checked={!!row.is_primary} onChange={(e) => updateRow(setEmergencies, i, "is_primary", e.target.checked)} />
                        Primary contact
                      </label>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    {["identity", "phones", "emails", "addresses", "education", "experience", "office", "health", "socials", "emergency"].map((k, i, arr) => {
                      const idx = arr.indexOf(activeFormTab);
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setActiveFormTab(k)}
                          className={`w-2 h-2 rounded-full transition ${i <= idx ? "bg-emerald-500" : "bg-gray-200"}`}
                          aria-label={`Go to ${k} tab`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition">
                    Cancel
                  </button>
                  <button type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-emerald-200">
                    {selectedContact ? "Update Contact" : "Save Contact"}
                  </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MERGE MODAL ── */}
      <AnimatePresence>
        {isMergeOpen && activeDuplicatePair && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" /> Duplicate Merge Resolution
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Merging Source into Master. Relational records (phones, emails, addresses) aggregate automatically.
                  </p>
                </div>
                <button onClick={() => setIsMergeOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={22} />
                </button>
              </div>

              <div className="p-6">
                {/* Side-by-side comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Master */}
                  <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-green-800 uppercase tracking-wider">Master (Keep)</span>
                    </div>
                    <div className="space-y-2">
                      {[["First Name", "first_name"], ["Last Name", "last_name"], ["CNIC", "cnic"], ["Gender", "gender"], ["DOB", "dob"]].map(([label, field]) => (
                        <div key={field} className="flex justify-between items-center py-1.5 border-b border-green-100 last:border-0">
                          <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
                          <span className="text-sm font-medium text-gray-800">
                            {field === "dob" && activeDuplicatePair.master[field]
                              ? activeDuplicatePair.master[field].split("T")[0]
                              : activeDuplicatePair.master[field] || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Source */}
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-bold text-red-800 uppercase tracking-wider">Source (Will be Deleted)</span>
                    </div>
                    <div className="space-y-2">
                      {[["First Name", "first_name"], ["Last Name", "last_name"], ["CNIC", "cnic"], ["Gender", "gender"], ["DOB", "dob"]].map(([label, field]) => (
                        <div key={field} className="flex justify-between items-center py-1.5 border-b border-red-100 last:border-0">
                          <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
                          <span className="text-sm font-medium text-gray-800">
                            {field === "dob" && activeDuplicatePair.source[field]
                              ? activeDuplicatePair.source[field].split("T")[0]
                              : activeDuplicatePair.source[field] || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Conflict Resolution */}
                <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
                  <h4 className="text-sm font-bold text-orange-500 uppercase tracking-wider mb-3">Field Conflict Resolution</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {["first_name", "last_name", "cnic", "gender", "dob"].map(field => (
                      <div key={field} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <span className="text-xs font-semibold text-gray-600 uppercase">{field.replace("_", " ")}</span>
                        <div className="flex gap-2">
                          <button type="button"
                            onClick={() => setMergeConflictChoices(prev => ({ ...prev, [field]: "master" }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                              mergeConflictChoices[field] === "master"
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                            }`}>
                            Use Master
                          </button>
                          <button type="button"
                            onClick={() => setMergeConflictChoices(prev => ({ ...prev, [field]: "source" }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                              mergeConflictChoices[field] === "source"
                                ? "bg-amber-500 text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                            }`}>
                            Use Source
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={() => setIsMergeOpen(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition">
                    Cancel
                  </button>
                  <button onClick={handleMergeSubmit}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-orange-200">
                    Execute Merge
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Contacts;
