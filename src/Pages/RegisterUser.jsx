import React, { useState, useEffect, useRef } from "react";
import { useUserStore } from "../Store/userStore";
import { useContactStore } from "../Store/contactStore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema } from "../Scheema/userScheema";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, IdCard, Loader2, Heart, Briefcase, GraduationCap, School, Clock, DollarSign, Phone, Users, BookOpen, Search, ChevronDown, Contact, X, Plus, Trash2 } from "lucide-react";

// Popup Message Component
const PopupMessage = ({ message, type, onClose }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
          type === "success" ? "bg-green-100 text-green-700" : "bg-red-500 text-white"
        }`}
      >
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

// HR Management Modal
const HrManagementModal = ({ isOpen, onClose, onSubmit, hrList, onDelete }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { hrEmail: "", hrPassword: "" },
  });

  const handleFormSubmit = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-1">
                <Users size={20} className="text-orange-500" /> Manage HR
              </h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <Lock size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Mail size={16} className="text-orange-500" /> HR Email
                </label>
                <input
                  type="email"
                  {...register("hrEmail", { required: "Email is required" })}
                  className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="HR Email"
                />
                {errors.hrEmail && (
                  <p className="text-red-500 text-xs mt-1">{errors.hrEmail.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Lock size={16} className="text-orange-500" /> HR Password
                </label>
                <input
                  type="password"
                  {...register("hrPassword", { 
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters long"
                    }
                  })}
                  className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                  placeholder="HR Password"
                />
                {errors.hrPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.hrPassword.message}</p>
                )}
              </div>
              <motion.button
                type="submit"
                className="w-full py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Create HR
              </motion.button>
            </form>

            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-700">Current HR</h4>
              {hrList.length === 0 ? (
                <p className="text-gray-500 text-sm mt-1">No HR created yet.</p>
              ) : (
                <ul className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {hrList.map((hr, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                      <span>{hr.email}</span>
                      <button
                        onClick={() => onDelete(hr.email)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Role Selection Modal
const RoleSelectionModal = ({ isOpen, onSelectRole, onClose, onPasswordSubmit, passwordError }) => {
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleRoleSelect = (role) => {
    if (role === "hr") {
      setShowPasswordInput(true);
    } else {
      onSelectRole(role);
    }
  };

  const handlePasswordSubmit = () => {
    onPasswordSubmit(password);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-1">
                <Users size={20} className="text-orange-500" /> Select Action
              </h3>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <Lock size={20} />
              </button>
            </div>

            {!showPasswordInput ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Do you want to register an employee or create an HR?</p>
                <motion.button
                  onClick={() => handleRoleSelect("employee")}
                  className="w-full py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Register Employee
                </motion.button>
                <motion.button
                  onClick={() => handleRoleSelect("hr")}
                  className="w-full py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create HR
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Lock size={16} className="text-orange-500" /> Super Admin Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                    placeholder="Enter Super Admin Password"
                  />
                  {passwordError && (
                    <p className="text-red-500 text-xs mt-1">{passwordError}</p>
                  )}
                </div>
                <div className="flex justify-between">
                  <motion.button
                    onClick={() => setShowPasswordInput(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handlePasswordSubmit}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Submit
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const RegisterUser = () => {
  const { updateUser, registerUser, loading, error } = useUserStore();
  const { contacts: rawContacts, fetchContacts: fetchContactsFromStore, createContact } = useContactStore();
  // Normalize contacts from the Contacts store into a flat shape the existing
  // dropdown / autofill code understands.
  const contacts = (rawContacts || []).map((c) => ({
    ...c,
    full_name:      `${c.first_name || ""} ${c.last_name || ""}`.trim(),
    email:          c.emails?.[0]?.email_address || "",
    contact_number: c.phoneNumbers?.[0]?.phone_number || "",
    permanent_address: c.addresses?.[0]
      ? [c.addresses[0].address_line1, c.addresses[0].address_line2, c.addresses[0].city, c.addresses[0].state, c.addresses[0].country, c.addresses[0].postal_code].filter(Boolean).join(", ")
      : "",
    guardian_phone: c.family?.father_phone || "",
  }));
  const fetchContacts = () => fetchContactsFromStore();
  const [imagePreview, setImagePreview] = useState(null);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [popupMessage, setPopupMessage] = useState(null);
  const [role, setRole] = useState("employee");
  const [isRoleSelectionModalOpen, setIsRoleSelectionModalOpen] = useState(false);
  const [isHrModalOpen, setIsHrModalOpen] = useState(false);
  const [hrList, setHrList] = useState([]);
  const [passwordError, setPasswordError] = useState(null);

  // Contact selector state
  const [contactSearch, setContactSearch] = useState("");
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const contactDropdownRef = useRef(null);

  // Add Contact Quick-Modal state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [addContactSaving, setAddContactSaving] = useState(false);
  const [quickImageFile, setQuickImageFile] = useState(null);
  const [quickImagePreview, setQuickImagePreview] = useState(null);
  const EMPTY_QUICK = {
    first_name: "", last_name: "", cnic: "", gender: "Male", dob: "", is_syed: false,
    phoneNumbers: [{ phone_number: "", phone_type: "Mobile" }],
    emails: [{ email_address: "", email_type: "Personal" }],
    addresses: [{ address_line1: "", address_line2: "", city: "", state: "", country: "Pakistan", postal_code: "", address_type: "Home" }],
    socials: [{ platform: "LinkedIn", url: "" }],
  };
  const [quickContact, setQuickContact] = useState(EMPTY_QUICK);
  const [quickContactErrors, setQuickContactErrors] = useState({});

  const validateQuickContact = () => {
    const errs = {};
    if (!quickContact.first_name.trim()) errs.first_name = "Required";
    if (!quickContact.last_name.trim()) errs.last_name = "Required";
    if (!quickContact.dob) errs.dob = "Required";
    if (!/^\d{5}-\d{7}-\d{1}$/.test(quickContact.cnic)) errs.cnic = "Format: XXXXX-XXXXXXX-X";
    setQuickContactErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleQuickContactSave = async () => {
    if (!validateQuickContact()) return;
    setAddContactSaving(true);
    try {
      const payload = new FormData();
      payload.append("first_name", quickContact.first_name);
      payload.append("last_name", quickContact.last_name);
      payload.append("cnic", quickContact.cnic);
      payload.append("gender", quickContact.gender);
      payload.append("dob", quickContact.dob);
      payload.append("is_syed", quickContact.is_syed);
      payload.append("phoneNumbers", JSON.stringify(quickContact.phoneNumbers.filter(p => p.phone_number.trim())));
      payload.append("emails", JSON.stringify(quickContact.emails.filter(e => e.email_address.trim())));
      payload.append("addresses", JSON.stringify(quickContact.addresses.filter(a => a.address_line1.trim())));
      payload.append("socials", JSON.stringify(quickContact.socials.filter(s => s.url.trim())));
      if (quickImageFile) payload.append("profile_picture", quickImageFile);
      const res = await createContact(payload);
      if (res.success) {
        showPopup(`Contact "${quickContact.first_name} ${quickContact.last_name}" created! Select them from the dropdown.`);
        setIsAddContactOpen(false);
        setQuickContact(EMPTY_QUICK);
        setQuickImageFile(null);
        setQuickImagePreview(null);
        await fetchContacts("contact");
      } else {
        showPopup(res.error || "Failed to create contact.", "error");
      }
    } catch (e) {
      showPopup("Error creating contact.", "error");
    } finally {
      setAddContactSaving(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registerUserSchema),
    mode: "onChange",
  });

  const formValues = watch();

  const requiredFields = [
    "employee_id",
    "registration_date",
    "joining_date",
    "post_applied_for",
    "full_name",
    "gender",
    "cnic",
    "dob",
    "permanent_address",
    "contact_number",
    "email",
    // degree / institute / grade / year removed — now optional, captured in Contacts.
    "in_time",
    "out_time",
    "Salary_Cap",
    "guardian_phone",
  ];

  // Fetch contacts on mount for autofill dropdown
  useEffect(() => {
    fetchContacts("contact");
  }, []);

  // Auto-generate the next Employee ID by scanning existing users.
  useEffect(() => {
    const API = import.meta.env.VITE_API_BASE_URL;
    fetch(`${API}users`).then((r) => r.json()).then((j) => {
      const list = j.users || j || [];
      const used = list
        .map((u) => /^EMP-(\d+)$/i.exec(u.employee_id || ""))
        .filter(Boolean)
        .map((m) => parseInt(m[1], 10));
      const next = (used.length ? Math.max(...used) : 0) + 1;
      setValue("employee_id", `EMP-${String(next).padStart(3, "0")}`);
    }).catch(() => {});
  }, [setValue]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(e.target)) {
        setShowContactDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter contacts based on search
  const filteredContacts = contacts.filter((c) => {
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase();
    return (
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.contact_number || "").includes(q)
    );
  });

  // Handle contact selection — autofill all fields, including the JSON
  // blocks (family/education/experience/office/health) now stored on Contact.
  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setContactSearch(contact.full_name);
    setShowContactDropdown(false);

    // ── Identity ──
    setValue("full_name", contact.full_name || "");
    setValue("email", contact.email || (contact.emails?.[0]?.email_address) || "");
    setValue("gender", contact.gender || "");
    setValue("cnic", contact.cnic || "");
    setValue("contact_number", contact.contact_number || (contact.phoneNumbers?.[0]?.phone_number) || "");
    setValue("permanent_address",
      contact.permanent_address ||
      (contact.addresses?.[0]
        ? [contact.addresses[0].address_line1, contact.addresses[0].address_line2, contact.addresses[0].city, contact.addresses[0].state, contact.addresses[0].country, contact.addresses[0].postal_code].filter(Boolean).join(", ")
        : "")
    );
    setValue("guardian_phone", contact.guardian_phone || contact.family?.father_phone || contact.contact_number || "");
    if (contact.family?.mother_phone) setValue("reference_contact", contact.family.mother_phone);

    // ── DOB ──
    if (contact.dob) {
      const dobStr = typeof contact.dob === "string" ? contact.dob.split("T")[0] : new Date(contact.dob).toISOString().split("T")[0];
      setValue("dob", dobStr);
    }

    // ── Education ──
    if (contact.education?.degree)    setValue("degree",    contact.education.degree);
    if (contact.education?.institute) setValue("institute", contact.education.institute);
    if (contact.education?.grade)     setValue("grade",     contact.education.grade);
    if (contact.education?.year)      setValue("year",      contact.education.year);

    // ── Experience ──
    if (contact.experience?.teach_contact)   setValue("teaching_contact",  contact.experience.teach_contact);
    if (contact.experience?.teach_subjects)  setValue("teaching_subjects", contact.experience.teach_subjects);
    if (contact.experience?.teach_institute) setValue("teaching_institute", contact.experience.teach_institute);
    if (contact.experience?.position)        setValue("position",          contact.experience.position);
    if (contact.experience?.organization)    setValue("organization",      contact.experience.organization);
    if (contact.experience?.skills)          setValue("skills",            contact.experience.skills);

    // ── Office ──
    if (contact.office?.employee_id)       setValue("employee_id",       contact.office.employee_id);
    if (contact.office?.registration_date) setValue("registration_date", contact.office.registration_date);
    if (contact.office?.joining_date)      setValue("joining_date",      contact.office.joining_date);
    if (contact.office?.post_applied_for)  setValue("post_applied_for",  contact.office.post_applied_for);
    if (contact.office?.check_in_time)     setValue("in_time",           contact.office.check_in_time);
    if (contact.office?.check_out_time)    setValue("out_time",          contact.office.check_out_time);
    if (contact.office?.salary_cap)        setValue("Salary_Cap",        contact.office.salary_cap);

    // ── Health ──
    if (contact.health?.any_disease)     setValue("has_disease",         contact.health.any_disease);
    if (contact.health?.disease_details) setValue("disease_description", contact.health.disease_details);

    // Fallback to old single position field if no experience block exists
    if (!contact.experience?.position && contact.position) setValue("position", contact.position);

    showPopup(`Contact "${contact.full_name}" loaded! Review & complete the remaining fields.`);
  };

  useEffect(() => {
    if (isHrModalOpen) {
      fetch(`${import.meta.env.VITE_API_BASE_URL}auth/hr-list`)
        .then((response) => response.json())
        .then((data) => setHrList(data.hrList))
        .catch((error) => {
          console.error("Error fetching HR list:", error);
          showPopup("Error fetching HR list", "error");
        });
    }
  }, [isHrModalOpen]);

  useEffect(() => {
    const totalRequiredFields = requiredFields.length;
    const filledRequiredFields = requiredFields.filter(
      (field) => formValues[field] !== undefined && formValues[field] !== ""
    ).length;
    const optionalFields = Object.keys(formValues).filter(
      (key) => !requiredFields.includes(key)
    );
    const filledOptionalFields = optionalFields.filter(
      (field) => formValues[field] !== undefined && formValues[field] !== ""
    ).length;
    const totalFields = requiredFields.length + optionalFields.length;
    const baseProgress = (filledRequiredFields / totalRequiredFields) * 100;
    const optionalBonus =
      optionalFields.length > 0 ? (filledOptionalFields / totalFields) * 10 : 0;
    setProgress(Math.min(baseProgress + optionalBonus, 100));
  }, [formValues]);

  const showPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setTimeout(() => setPopupMessage(null), 3000);
  };

  const onSubmit = async (data) => {
    if (!isValid) {
      console.error("❌ Validation failed:", errors);
      const firstError = Object.entries(errors)[0];
      const msg = firstError
        ? `${firstError[0]}: ${firstError[1]?.message || "invalid"}`
        : "Validation failed. Please check your inputs.";
      showPopup(msg, "error");
      return;
    }
    if (!selectedContact) {
      showPopup("Please select a contact to promote to employee first.", "error");
      return;
    }

    try {
      const employeeData = {
        ...data,
        record_type: "employee",
        login_access: false,
      };
      
      // The selected "contact" is from /api/contacts (UUID id) — we always
      // CREATE a fresh user record for the employee registration, never
      // update the contact row itself.
      const result = await registerUser(employeeData);
      if (!result) {
        // Surface the real reason that registerUser failed (Zod or API error)
        // which is stored on the userStore.
        const storeErr = useUserStore.getState().error;
        showPopup(storeErr || "Registration failed — check console for details.", "error");
        return;
      }
      if (result) {
        showPopup("Employee registered successfully!");
        reset();
        setSelectedContact(null);
        setContactSearch("");
        setImagePreview(null);
        setStep(1);
        setProgress(0);
        fetchContacts("contact");
      }
    } catch (error) {
      console.error("❌ Submission error:", error);
      showPopup(error.message || "Failed to register employee", "error");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue("image", file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      const step1Required = [
        "full_name",
        "email",
        "gender",
        "cnic",
        "dob",
        "contact_number",
        "permanent_address",
        "guardian_phone",
      ];
      const hasErrors = step1Required.some((field) => errors[field]);
      if (!hasErrors) setStep(2);
    }
    // Old step 2 (Education/Experience) removed — fields moved to Contacts page.
  };

  const prevStep = () => setStep(step - 1);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setIsRoleSelectionModalOpen(false);
  };

  const handlePasswordSubmit = (password) => {
    if (password === "admin") {
      setRole("hr");
      setIsRoleSelectionModalOpen(false);
      setIsHrModalOpen(true);
      setPasswordError(null);
    } else {
      setPasswordError("Invalid Super Admin Password");
      showPopup("Invalid Super Admin Password", "error");
    }
  };

  const handleHrSubmit = async (data) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}auth/create-hr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.hrEmail, password: data.hrPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        showPopup("HR created successfully");
        const updatedList = await fetch(`${import.meta.env.VITE_API_BASE_URL}auth/hr-list`).then((res) => res.json());
        setHrList(updatedList.hrList);
      } else {
        showPopup(result.message || "Failed to create HR", "error");
      }
    } catch (error) {
      console.error("Error creating HR:", error);
      showPopup("Error creating HR", "error");
    }
  };

  const handleHrDelete = async (email) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}auth/delete-hr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) {
        showPopup("HR deleted successfully");
        const updatedList = await fetch(`${import.meta.env.VITE_API_BASE_URL}auth/hr-list`).then((res) => res.json());
        setHrList(updatedList.hrList);
      } else {
        showPopup(result.message || "Failed to delete HR", "error");
      }
    } catch (error) {
      console.error("Error deleting HR:", error);
      showPopup("Error deleting HR", "error");
    }
  };

  const hasDisease = watch("has_disease") === "Yes";

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">

      {/* ── Quick Add Contact Modal (Full Form) ── */}
      <AnimatePresence>
        {isAddContactOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Contact size={18} className="text-orange-500" /> Add New Contact
                </h3>
                <button onClick={() => { setIsAddContactOpen(false); setQuickContact(EMPTY_QUICK); setQuickImageFile(null); setQuickImagePreview(null); setQuickContactErrors({}); }} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6">

                {/* Profile Picture + Name */}
                <div className="flex flex-col sm:flex-row gap-5 items-start pb-5 border-b border-gray-100">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {quickImagePreview ? (
                      <img src={quickImagePreview} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" alt="Preview" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center text-orange-400">
                        <User size={30} />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 p-1.5 bg-orange-500 hover:bg-orange-600 rounded-full cursor-pointer shadow transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setQuickImageFile(f); setQuickImagePreview(URL.createObjectURL(f)); } }} className="hidden" />
                    </label>
                  </div>
                  {/* Name fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
                      <input type="text" value={quickContact.first_name}
                        onChange={e => setQuickContact(p => ({ ...p, first_name: e.target.value }))}
                        placeholder="e.g. Muhammad"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                      {quickContactErrors.first_name && <p className="text-red-500 text-xs mt-1">{quickContactErrors.first_name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
                      <input type="text" value={quickContact.last_name}
                        onChange={e => setQuickContact(p => ({ ...p, last_name: e.target.value }))}
                        placeholder="e.g. Ali"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                      {quickContactErrors.last_name && <p className="text-red-500 text-xs mt-1">{quickContactErrors.last_name}</p>}
                    </div>
                  </div>
                </div>

                {/* Gender, CNIC, DOB */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Gender *</label>
                    <select value={quickContact.gender}
                      onChange={e => setQuickContact(p => ({ ...p, gender: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                      <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">CNIC (Strictly Validated) *</label>
                    <input type="text" value={quickContact.cnic}
                      onChange={e => setQuickContact(p => ({ ...p, cnic: e.target.value }))}
                      placeholder="XXXXX-XXXXXXX-X"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none font-mono" />
                    {quickContactErrors.cnic && <p className="text-red-500 text-xs mt-1">{quickContactErrors.cnic}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth *</label>
                    <input type="date" value={quickContact.dob}
                      onChange={e => setQuickContact(p => ({ ...p, dob: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                    {quickContactErrors.dob && <p className="text-red-500 text-xs mt-1">{quickContactErrors.dob}</p>}
                  </div>
                  <div className="sm:col-span-4 flex items-center gap-2">
                    <input type="checkbox" id="qc_is_syed" checked={quickContact.is_syed}
                      onChange={e => setQuickContact(p => ({ ...p, is_syed: e.target.checked }))}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" />
                    <label htmlFor="qc_is_syed" className="text-sm text-gray-700 cursor-pointer font-medium">Is Syed (Auto Prefix: Syed / Syeda)</label>
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Phone Numbers</h4>
                    <button type="button"
                      onClick={() => setQuickContact(p => ({ ...p, phoneNumbers: [...p.phoneNumbers, { phone_number: "", phone_type: "Mobile" }] }))}
                      className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1">
                      <Plus size={12} /> Add Phone
                    </button>
                  </div>
                  <div className="space-y-2">
                    {quickContact.phoneNumbers.map((ph, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="text" placeholder="+923001234567" value={ph.phone_number}
                          onChange={e => { const l = [...quickContact.phoneNumbers]; l[i] = { ...l[i], phone_number: e.target.value }; setQuickContact(p => ({ ...p, phoneNumbers: l })); }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                        <select value={ph.phone_type}
                          onChange={e => { const l = [...quickContact.phoneNumbers]; l[i] = { ...l[i], phone_type: e.target.value }; setQuickContact(p => ({ ...p, phoneNumbers: l })); }}
                          className="w-28 border border-gray-300 rounded-lg px-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                          <option>Mobile</option><option>Home</option><option>Office</option><option>WhatsApp</option><option>Other</option>
                        </select>
                        <button type="button" onClick={() => quickContact.phoneNumbers.length > 1 && setQuickContact(p => ({ ...p, phoneNumbers: p.phoneNumbers.filter((_, j) => j !== i) }))}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30" disabled={quickContact.phoneNumbers.length === 1}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emails */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Emails</h4>
                    <button type="button"
                      onClick={() => setQuickContact(p => ({ ...p, emails: [...p.emails, { email_address: "", email_type: "Personal" }] }))}
                      className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1">
                      <Plus size={12} /> Add Email
                    </button>
                  </div>
                  <div className="space-y-2">
                    {quickContact.emails.map((em, i) => (
                      <div key={i} className="flex gap-2">
                        <input type="email" placeholder="email@domain.com" value={em.email_address}
                          onChange={e => { const l = [...quickContact.emails]; l[i] = { ...l[i], email_address: e.target.value }; setQuickContact(p => ({ ...p, emails: l })); }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                        <select value={em.email_type}
                          onChange={e => { const l = [...quickContact.emails]; l[i] = { ...l[i], email_type: e.target.value }; setQuickContact(p => ({ ...p, emails: l })); }}
                          className="w-28 border border-gray-300 rounded-lg px-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                          <option>Personal</option><option>Office</option><option>Home</option><option>Other</option>
                        </select>
                        <button type="button" onClick={() => quickContact.emails.length > 1 && setQuickContact(p => ({ ...p, emails: p.emails.filter((_, j) => j !== i) }))}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30" disabled={quickContact.emails.length === 1}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Addresses */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Addresses</h4>
                    <button type="button"
                      onClick={() => setQuickContact(p => ({ ...p, addresses: [...p.addresses, { address_line1: "", address_line2: "", city: "", state: "", country: "Pakistan", postal_code: "", address_type: "Home" }] }))}
                      className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1">
                      <Plus size={12} /> Add Address
                    </button>
                  </div>
                  <div className="space-y-3">
                    {quickContact.addresses.map((a, i) => (
                      <div key={i} className="border border-gray-200 bg-gray-50 p-3 rounded-lg relative space-y-2">
                        <button type="button" onClick={() => quickContact.addresses.length > 1 && setQuickContact(p => ({ ...p, addresses: p.addresses.filter((_, j) => j !== i) }))}
                          className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30" disabled={quickContact.addresses.length === 1}>
                          <Trash2 size={12} />
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-8">
                          <input type="text" placeholder="Address Line 1" value={a.address_line1}
                            onChange={e => { const l = [...quickContact.addresses]; l[i] = { ...l[i], address_line1: e.target.value }; setQuickContact(p => ({ ...p, addresses: l })); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                          <input type="text" placeholder="Address Line 2 (Optional)" value={a.address_line2}
                            onChange={e => { const l = [...quickContact.addresses]; l[i] = { ...l[i], address_line2: e.target.value }; setQuickContact(p => ({ ...p, addresses: l })); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <input type="text" placeholder="City" value={a.city}
                            onChange={e => { const l = [...quickContact.addresses]; l[i] = { ...l[i], city: e.target.value }; setQuickContact(p => ({ ...p, addresses: l })); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                          <input type="text" placeholder="State" value={a.state}
                            onChange={e => { const l = [...quickContact.addresses]; l[i] = { ...l[i], state: e.target.value }; setQuickContact(p => ({ ...p, addresses: l })); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                          <input type="text" placeholder="Country" value={a.country}
                            onChange={e => { const l = [...quickContact.addresses]; l[i] = { ...l[i], country: e.target.value }; setQuickContact(p => ({ ...p, addresses: l })); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                          <input type="text" placeholder="Postal" value={a.postal_code}
                            onChange={e => { const l = [...quickContact.addresses]; l[i] = { ...l[i], postal_code: e.target.value }; setQuickContact(p => ({ ...p, addresses: l })); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                          <select value={a.address_type}
                            onChange={e => { const l = [...quickContact.addresses]; l[i] = { ...l[i], address_type: e.target.value }; setQuickContact(p => ({ ...p, addresses: l })); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                            <option>Home</option><option>Office</option><option>Mailing</option><option>Other</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Media */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Social Media</h4>
                    <button type="button"
                      onClick={() => setQuickContact(p => ({ ...p, socials: [...p.socials, { platform: "LinkedIn", url: "" }] }))}
                      className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1">
                      <Plus size={12} /> Add Platform
                    </button>
                  </div>
                  <div className="space-y-2">
                    {quickContact.socials.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <select value={s.platform}
                          onChange={e => { const l = [...quickContact.socials]; l[i] = { ...l[i], platform: e.target.value }; setQuickContact(p => ({ ...p, socials: l })); }}
                          className="w-32 border border-gray-300 rounded-lg px-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                          <option>LinkedIn</option><option>Facebook</option><option>Twitter</option><option>Instagram</option><option>Other</option>
                        </select>
                        <input type="text" placeholder="Profile URL" value={s.url}
                          onChange={e => { const l = [...quickContact.socials]; l[i] = { ...l[i], url: e.target.value }; setQuickContact(p => ({ ...p, socials: l })); }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
                        <button type="button" onClick={() => setQuickContact(p => ({ ...p, socials: p.socials.filter((_, j) => j !== i) }))}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>{/* end scrollable body */}

              {/* Sticky Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
                <button type="button"
                  onClick={() => { setIsAddContactOpen(false); setQuickContact(EMPTY_QUICK); setQuickImageFile(null); setQuickImagePreview(null); setQuickContactErrors({}); }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition">
                  Cancel
                </button>
                <button type="button" onClick={handleQuickContactSave} disabled={addContactSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition shadow-md shadow-orange-200 disabled:opacity-60">
                  {addContactSaving ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving...</>
                  ) : (
                    <><Contact size={14} /> Save Contact</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {role === "employee" && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto max-w-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center text-gray-800">
              <User size={24} className="mr-2 text-orange-500" /> Register Employee
            </h2>
            <motion.button
              type="button"
              onClick={() => setIsHrModalOpen(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-orange-300 text-orange-600 hover:bg-orange-50 text-sm font-semibold rounded-lg shadow-sm"
            >
              <Users size={14} /> Create HR
            </motion.button>
          </div>

          {error && !popupMessage && (
            <p className="text-red-500 mb-4 text-sm">{error}</p>
          )}

          {/* ── Contact Autofill Selector ── */}
          <div className="bg-white border border-orange-200 rounded-xl p-4 mb-5 shadow-sm" ref={contactDropdownRef}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Contact size={16} className="text-orange-500" />
                Autofill from Existing Contact
                <span className="text-xs font-normal text-gray-400 ml-1">(optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddContactOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition shadow-sm shadow-orange-200"
              >
                <Plus size={13} /> Add Contact
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  setShowContactDropdown(true);
                  if (!e.target.value) setSelectedContact(null);
                }}
                onFocus={() => setShowContactDropdown(true)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-gray-50"
              />
              <ChevronDown
                size={16}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 transition-transform ${showContactDropdown ? "rotate-180" : ""}`}
              />

              {showContactDropdown && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                  {filteredContacts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">No contacts found</div>
                  ) : (
                    filteredContacts.slice(0, 50).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleContactSelect(c)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition border-b border-gray-50 last:border-b-0 ${
                          selectedContact?.id === c.id ? "bg-orange-50" : ""
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {(c.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-800 truncate">{c.full_name}</div>
                          <div className="text-xs text-gray-400 truncate">{c.email} • {c.contact_number}</div>
                        </div>
                        {selectedContact?.id === c.id && (
                          <span className="text-orange-500 text-xs font-bold">Selected</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedContact && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-green-600 font-semibold">✓ Loaded: {selectedContact.full_name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContact(null);
                    setContactSearch("");
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {!selectedContact ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-md flex flex-col items-center justify-center gap-4 mt-6 min-h-[300px]"
            >
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 animate-pulse">
                <Contact size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Linked Contact Required</h3>
              <p className="text-gray-500 max-w-md text-sm leading-relaxed">
                To register a new employee, you must select an existing contact to promote. Use the search dropdown above to select a contact and continue.
              </p>
              <div className="inline-flex items-center gap-2 text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-semibold">
                <span>⚡ Employee registration cannot be done directly</span>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <motion.div
                  className="bg-orange-500 h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <motion.form
            onSubmit={handleSubmit(onSubmit, (errs) => {
              console.error("❌ RHF validation errors:", errs);
              const first = Object.entries(errs)[0];
              const msg = first ? `${first[0]}: ${first[1]?.message || "invalid"}` : "Form has invalid fields.";
              showPopup(msg, "error");
            })}
            className="space-y-6 bg-white p-6 rounded-lg shadow-md"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <User size={20} className="text-orange-500" /> Personal Information
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Full Name
                      </label>
                      <input
                        type="text"
                        {...register("full_name")}
                        placeholder="Enter Full Name"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.full_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Mail size={16} className="text-orange-500" /> Email Address
                      </label>
                      <input
                        type="email"
                        {...register("email")}
                        placeholder="Enter Email"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Gender
                      </label>
                      <select
                        {...register("gender")}
                        defaultValue=""
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      >
                        <option value="" disabled>
                          Select Gender
                        </option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      {errors.gender && (
                        <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <IdCard size={16} className="text-orange-500" /> CNIC Number
                      </label>
                      <input
                        type="text"
                        {...register("cnic")}
                        placeholder="Enter CNIC (13 digits)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.cnic && (
                        <p className="text-red-500 text-xs mt-1">{errors.cnic.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Date of Birth
                      </label>
                      <input
                        type="date"
                        {...register("dob")}
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.dob && (
                        <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone size={16} className="text-orange-500" /> Contact Number
                      </label>
                      <input
                        type="text"
                        {...register("contact_number")}
                        placeholder="Enter Contact Number (11 digits)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.contact_number && (
                        <p className="text-red-500 text-xs mt-1">{errors.contact_number.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Permanent Address
                      </label>
                      <input
                        type="text"
                        {...register("permanent_address")}
                        placeholder="Enter Permanent Address"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.permanent_address && (
                        <p className="text-red-500 text-xs mt-1">{errors.permanent_address.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone size={16} className="text-orange-500" /> Guardian/Alternate Phone
                      </label>
                      <input
                        type="text"
                        {...register("guardian_phone")}
                        placeholder="Enter Guardian Phone (11 digits)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.guardian_phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.guardian_phone.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Reference Person (Optional)
                      </label>
                      <input
                        type="text"
                        {...register("reference_name")}
                        placeholder="Enter Reference Name"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.reference_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.reference_name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone size={16} className="text-orange-500" /> Reference Contact (Optional)
                      </label>
                      <input
                        type="text"
                        {...register("reference_contact")}
                        placeholder="Enter Reference Contact (11 digits)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.reference_contact && (
                        <p className="text-red-500 text-xs mt-1">{errors.reference_contact.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Profile Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full p-2 mt-1 border rounded-md text-sm"
                      />
                      {imagePreview && (
                        <motion.img
                          src={imagePreview}
                          alt="Preview"
                          className="mt-4 w-32 h-32 object-cover rounded-md border border-gray-300"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                      {errors.image && (
                        <p className="text-red-500 text-xs mt-1">{errors.image.message}</p>
                      )}
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 flex items-center disabled:bg-orange-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={Object.keys(errors).some((field) =>
                      ["full_name", "email", "gender", "cnic", "dob", "contact_number", "permanent_address", "guardian_phone"].includes(field)
                    )}
                  >
                    Next Step
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </motion.div>
              )}

              {false && step === 999 && (
                <motion.div
                  key="step2-removed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <GraduationCap size={20} className="text-orange-500" /> Last Education
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <GraduationCap size={16} className="text-orange-500" /> Degree
                      </label>
                      <input
                        type="text"
                        {...register("degree")}
                        placeholder="Enter Degree"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.degree && (
                        <p className="text-red-500 text-xs mt-1">{errors.degree.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <School size={16} className="text-orange-500" /> Institute
                      </label>
                      <input
                        type="text"
                        {...register("institute")}
                        placeholder="Enter Institute"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.institute && (
                        <p className="text-red-500 text-xs mt-1">{errors.institute.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <GraduationCap size={16} className="text-orange-500" /> Grade
                      </label>
                      <select
                        {...register("grade")}
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none bg-white"
                      >
                        <option value="">Select Grade</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="Awaiting">Awaiting</option>
                      </select>
                      {errors.grade && (
                        <p className="text-red-500 text-xs mt-1">{errors.grade.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Clock size={16} className="text-orange-500" /> Year
                      </label>
                      <input
                        type="number"
                        {...register("year")}
                        placeholder="Enter Year"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.year && (
                        <p className="text-red-500 text-xs mt-1">{errors.year.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <BookOpen size={16} className="text-orange-500" /> Current Study (Ongoing)
                      </label>
                      <input
                        type="text"
                        {...register("current_study")}
                        placeholder="e.g. BSCS, MCS (if ongoing)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.current_study && (
                        <p className="text-red-500 text-xs mt-1">{errors.current_study.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <Briefcase size={20} className="text-orange-500" /> Past Teaching Experience (Optional)
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Teaching Subjects
                      </label>
                      <input
                        type="text"
                        {...register("teaching_subjects")}
                        placeholder="Enter Subjects"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.teaching_subjects && (
                        <p className="text-red-500 text-xs mt-1">{errors.teaching_subjects.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <School size={16} className="text-orange-500" /> Teaching Institute
                      </label>
                      <input
                        type="text"
                        {...register("teaching_institute")}
                        placeholder="Enter Institute"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.teaching_institute && (
                        <p className="text-red-500 text-xs mt-1">{errors.teaching_institute.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Phone size={16} className="text-orange-500" /> Teaching Contact
                      </label>
                      <input
                        type="text"
                        {...register("teaching_contact")}
                        placeholder="Enter Contact (11 digits)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.teaching_contact && (
                        <p className="text-red-500 text-xs mt-1">{errors.teaching_contact.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <Briefcase size={20} className="text-orange-500" /> Other Experience (Optional)
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Position
                      </label>
                      <input
                        type="text"
                        {...register("position")}
                        placeholder="Enter Position"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.position && (
                        <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Organization
                      </label>
                      <input
                        type="text"
                        {...register("organization")}
                        placeholder="Enter Organization"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.organization && (
                        <p className="text-red-500 text-xs mt-1">{errors.organization.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Skills
                      </label>
                      <input
                        type="text"
                        {...register("skills")}
                        placeholder="Enter Skills (e.g., Java, Python)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                        onChange={(e) => setValue("skills", e.target.value)}
                      />
                      {errors.skills && (
                        <p className="text-red-500 text-xs mt-1">{errors.skills.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <motion.button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm font-medium hover:bg-gray-500 flex items-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={nextStep}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 flex items-center disabled:bg-orange-300"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={Object.keys(errors).some((field) =>
                        ["degree", "institute", "grade", "year"].includes(field)
                      )}
                    >
                      Next Step
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold flex items-center text-gray-800">
                      <School size={20} className="text-orange-500" /> Office Details
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Employee ID <span className="text-emerald-600 text-[10px] uppercase ml-1">auto-generated</span>
                      </label>
                      <input
                        type="text"
                        {...register("employee_id")}
                        readOnly
                        title="Auto-generated based on existing records"
                        className="w-full p-2 mt-1 border rounded-md text-sm bg-gray-50 text-gray-700 font-mono focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.employee_id && (
                        <p className="text-red-500 text-xs mt-1">{errors.employee_id.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Registration Date
                      </label>
                      <input
                        type="date"
                        {...register("registration_date")}
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.registration_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.registration_date.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Joining Date
                      </label>
                      <input
                        type="date"
                        {...register("joining_date")}
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.joining_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.joining_date.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Briefcase size={16} className="text-orange-500" /> Post Applied For
                      </label>
                      <select
                        {...register("post_applied_for")}
                        defaultValue=""
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      >
                        <option value="" disabled>
                          Select Post
                        </option>
                        <option value="Employee">Employee</option>
                        <option value="Internship">Internship</option>
                      </select>
                      {errors.post_applied_for && (
                        <p className="text-red-500 text-xs mt-1">{errors.post_applied_for.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Clock size={16} className="text-orange-500" /> Check-In Time
                      </label>
                      <input
                        type="time"
                        {...register("in_time")}
                        placeholder="Enter In Time (e.g., 09:00)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.in_time && (
                        <p className="text-red-500 text-xs mt-1">{errors.in_time.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <Clock size={16} className="text-orange-500" /> Check-Out Time
                      </label>
                      <input
                        type="time"
                        {...register("out_time")}
                        placeholder="Enter Out Time (e.g., 16:00)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.out_time && (
                        <p className="text-red-500 text-xs mt-1">{errors.out_time.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <DollarSign size={16} className="text-orange-500" /> Salary Cap
                      </label>
                      <input
                        type="number"
                        {...register("Salary_Cap")}
                        placeholder="Enter Salary Cap (e.g., 50000)"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none"
                      />
                      {errors.Salary_Cap && (
                        <p className="text-red-500 text-xs mt-1">{errors.Salary_Cap.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 flex items-center gap-1">
                        <User size={16} className="text-orange-500" /> Description (Optional)
                      </label>
                      <textarea
                        {...register("description")}
                        placeholder="Enter Description"
                        className="w-full p-2 mt-1 border rounded-md text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                      />
                      {errors.description && (
                        <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Health Information moved to Contacts → Health tab */}

                  <div className="flex justify-between">
                    <motion.button
                      type="button"
                      onClick={prevStep}
                      className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm font-medium hover:bg-gray-500 flex items-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Back
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </motion.button>
                    <motion.button
                      type="submit"
                      className="px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 flex items-center disabled:bg-orange-300"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <>
                          <Loader2 size={16} className="animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Register
                          <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.form>
        </>
      )}
        </motion.div>
      )}

      {/* Select Action modal removed — Create HR is now a button inside the Register Employee page. */}

      <HrManagementModal
        isOpen={isHrModalOpen}
        onClose={() => setIsHrModalOpen(false)}
        onSubmit={handleHrSubmit}
        hrList={hrList}
        onDelete={handleHrDelete}
      />

      <PopupMessage
        message={popupMessage?.text}
        type={popupMessage?.type}
        onClose={() => setPopupMessage(null)}
      />
    </div>
  );
};

// Loads /api/contacts and, on pick, calls react-hook-form's setValue
// to populate the registration form's identity fields.
const RegisterContactPicker = ({ setValue }) => {
  const [contacts, setContacts] = React.useState([]);
  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}contacts`)
      .then((r) => r.json())
      .then((j) => setContacts(j.contacts || j || []))
      .catch(() => {});
  }, []);
  const pick = (id) => {
    const c = contacts.find((x) => String(x.id) === String(id));
    if (!c) return;
    // Identity
    setValue("full_name",       `${c.first_name || ""} ${c.last_name || ""}`.trim());
    setValue("cnic",            c.cnic || "");
    setValue("gender",          c.gender || "Male");
    if (c.dob) setValue("dob",  new Date(c.dob).toISOString().slice(0, 10));
    if (c.emails?.[0])          setValue("email", c.emails[0].email_address);
    if (c.phoneNumbers?.[0])    setValue("contact_number", c.phoneNumbers[0].phone_number);
    if (c.addresses?.[0]) {
      const a = c.addresses[0];
      setValue("permanent_address",
        [a.address_line1, a.address_line2, a.city, a.state, a.country, a.postal_code]
          .filter(Boolean).join(", "));
    }
    // Family → guardian + reference
    if (c.family?.father_phone)   setValue("guardian_phone",   c.family.father_phone);
    if (c.family?.mother_phone)   setValue("reference_contact", c.family.mother_phone);
    // Education
    if (c.education?.degree)      setValue("degree",    c.education.degree);
    if (c.education?.institute)   setValue("institute", c.education.institute);
    if (c.education?.grade)       setValue("grade",     c.education.grade);
    if (c.education?.year)        setValue("year",      c.education.year);
    // Experience
    if (c.experience?.teach_contact)   setValue("teaching_contact", c.experience.teach_contact);
    if (c.experience?.teach_subjects)  setValue("teaching_subjects", c.experience.teach_subjects);
    if (c.experience?.teach_institute) setValue("teaching_institute", c.experience.teach_institute);
    if (c.experience?.position)        setValue("position", c.experience.position);
    if (c.experience?.organization)    setValue("organization", c.experience.organization);
    if (c.experience?.skills)          setValue("skills", c.experience.skills);
    // Office
    if (c.office?.employee_id)       setValue("employee_id",      c.office.employee_id);
    if (c.office?.registration_date) setValue("registration_date", c.office.registration_date);
    if (c.office?.joining_date)      setValue("joining_date",     c.office.joining_date);
    if (c.office?.post_applied_for)  setValue("post_applied_for", c.office.post_applied_for);
    if (c.office?.check_in_time)     setValue("in_time",          c.office.check_in_time);
    if (c.office?.check_out_time)    setValue("out_time",         c.office.check_out_time);
    if (c.office?.salary_cap)        setValue("Salary_Cap",       c.office.salary_cap);
    if (c.office?.description)       setValue("description",      c.office.description);
    // Health
    if (c.health?.any_disease)       setValue("has_disease",          c.health.any_disease);
    if (c.health?.disease_details)   setValue("disease_description",  c.health.disease_details);
  };
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
      <label className="text-[11px] font-semibold text-emerald-800 uppercase block mb-1">
        Pick from existing Contacts (auto-fills personal info)
      </label>
      <select
        onChange={(e) => pick(e.target.value)}
        defaultValue=""
        className="w-full border border-emerald-300 rounded px-3 py-2 bg-white text-sm"
      >
        <option value="">— Start blank or select a contact —</option>
        {contacts.map((c) => (
          <option key={c.id} value={c.id}>
            {c.first_name} {c.last_name}{c.cnic ? ` · ${c.cnic}` : ""}
          </option>
        ))}
      </select>
      <p className="text-[10px] text-emerald-700 mt-1">
        Don't see them? <a href="/contacts" className="underline">Add them in Contacts first</a>.
      </p>
    </div>
  );
};

export default RegisterUser;
