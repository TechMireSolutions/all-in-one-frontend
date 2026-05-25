import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Loader2,
  UserMinus,
  Search,
  Trash2,
  Eye,
  Download,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  CreditCard,
  Building,
  Users,
  Clock,
  GraduationCap,
  DollarSign,
  FileText,
  Contact,
  UserPlus,
  PhoneCall,
  Heart,
  X,
  Award,
  BookOpen,
} from "lucide-react";
import { useExEmployeeStore } from "../Store/exEmployeeStore";
import { PDFDownloadLink } from "@react-pdf/renderer";
import UserPDF from "../Components/UserPDF";

const PopupMessage = ({ message, type }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
      >
        {message}
      </motion.div>
    )}
  </AnimatePresence>
);

const ExEmployeePage = () => {
  const { exEmployees, fetchExEmployees, deleteExEmployee, loading, error } = useExEmployeeStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingExEmployee, setViewingExEmployee] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState(null);

  const [activeUsers, setActiveUsers] = useState([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const EMPTY_EX_FORM = {
    employee_id: "",
    full_name: "",
    email: "",
    gender: "Male",
    cnic: "",
    dob: "",
    contact_number: "",
    guardian_phone: "",
    permanent_address: "",
    post_applied_for: "",
    registration_date: "",
    joining_date: "",
    exit_date: "",
    Salary_Cap: "",
    in_time: "09:00 AM",
    out_time: "06:00 PM",
    degree: "",
    institute: "",
    grade: "",
    year: new Date().getFullYear(),
    has_disease: "No",
    disease_description: "",
    skills: "",
    description: "",
    current_study: "",
  };

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [exForm, setExForm] = useState(EMPTY_EX_FORM);
  const [submittingEx, setSubmittingEx] = useState(false);

  const handleExInputChange = (e) => {
    const { name, value } = e.target;
    setExForm(prev => ({ ...prev, [name]: value }));
  };

  const handleExFormSubmit = async (e) => {
    e.preventDefault();

    if (!exForm.employee_id || !exForm.full_name || !exForm.email || !exForm.cnic || !exForm.dob || !exForm.contact_number || !exForm.permanent_address || !exForm.post_applied_for || !exForm.registration_date || !exForm.joining_date || !exForm.exit_date || !exForm.Salary_Cap || !exForm.degree || !exForm.institute || !exForm.grade || !exForm.year || !exForm.guardian_phone) {
      showPopup("Please fill in all required fields", "error");
      return;
    }

    if (exForm.has_disease === "Yes" && !exForm.disease_description) {
      showPopup("Please describe the disease details", "error");
      return;
    }

    try {
      setSubmittingEx(true);
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}exemployees`, exForm);
      if (res.status === 201 || res.status === 200) {
        showPopup("Ex-employee added successfully!");
        setExForm(EMPTY_EX_FORM);
        setShowAddExModal(false);
        fetchExEmployees();
      }
    } catch (err) {
      console.error(err);
      showPopup(err.response?.data?.message || "Failed to add ex-employee", "error");
    } finally {
      setSubmittingEx(false);
    }
  };

  const fetchActiveUsers = async () => {
    try {
      setLoadingActive(true);
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}users`);
      const data = await res.json();
      setActiveUsers(data || []);
    } catch (err) {
      console.error(err);
      showPopup("Failed to fetch active employees", "error");
    } finally {
      setLoadingActive(false);
    }
  };

  const handleTerminateEmployee = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to terminate ${userName} and move them to Ex-Employees?`)) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}users/${userId}`, {
          method: "DELETE",
        });
        if (response.ok) {
          showPopup(`${userName} has been successfully moved to Ex-Employees!`);
          setShowAddModal(false);
          fetchExEmployees();
        } else {
          showPopup("Failed to terminate employee", "error");
        }
      } catch (err) {
        showPopup("Failed to terminate employee", "error");
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchExEmployees();
        // Removed showPopup here to avoid showing "fetched successfully" on page load
      } catch (err) {
        showPopup("Failed to fetch ex-employees", "error");
      }
    };
    fetchData();
  }, [fetchExEmployees]);

  const showPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setTimeout(() => setPopupMessage(null), 3000);
  };

  const handleViewClick = (exEmployee) => {
    setViewingExEmployee(exEmployee);
    setIsViewModalOpen(true);
  };

  const handleDeleteClick = async (exEmployeeId) => {
    if (window.confirm("Are you sure you want to permanently delete this ex-employee?")) {
      try {
        await deleteExEmployee(exEmployeeId);
        showPopup("Ex-employee deleted successfully"); // Popup only shown here
      } catch (err) {
        showPopup("Failed to delete ex-employee", "error");
      }
    }
  };

  const filteredExEmployees = exEmployees.filter((exEmployee) =>
    exEmployee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exEmployee.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tableVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const rowVariants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } };
  const modalVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } };

  return (
    <div className="container min-h-[60vh] mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Ex-Employees</h2>
          <p className="text-sm text-gray-500 mt-1">
            {exEmployees.length} record{exEmployees.length !== 1 ? "s" : ""} in archive
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setExForm(EMPTY_EX_FORM);
              setShowAddExModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-md shadow-orange-200 cursor-pointer animate-fadeIn"
          >
            <Plus size={16} /> Add Ex-Employee
          </button>
          <button
            onClick={() => {
              fetchActiveUsers();
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <UserMinus size={16} /> Terminate Active Staff
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <motion.div variants={tableVariants} initial="hidden" animate="visible" className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[oklch(0.67_0.19_42.13)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider">Exit Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-800 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {filteredExEmployees.map((exEmployee) => (
                  <motion.tr
                    key={exEmployee.id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exEmployee.employee_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exEmployee.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(exEmployee.exit_date).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button onClick={() => handleViewClick(exEmployee)} className="text-indigo-600 hover:text-indigo-900" title="View Details">
                          <Eye className="h-5 w-5" />
                        </button>
                        <PDFDownloadLink
                          document={<UserPDF user={exEmployee} />}
                          fileName={`${exEmployee.full_name}-ex-employee-details.pdf`}
                          className="text-green-600 hover:text-green-900"
                          title="Download PDF"
                        >
                          {({ loading }) => (loading ? "Generating..." : <Download className="h-5 w-5" />)}
                        </PDFDownloadLink>
                        <button onClick={() => handleDeleteClick(exEmployee.id)} className="text-red-600 hover:text-red-900" title="Delete Ex-Employee">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      )}

      <AnimatePresence>
        {isViewModalOpen && viewingExEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-2xl font-semibold text-gray-800">Ex-Employee Details</h3>
                <div className="flex items-center space-x-4">
                  <PDFDownloadLink
                    document={<UserPDF user={viewingExEmployee} />}
                    fileName={`${viewingExEmployee.full_name}-ex-employee-details.pdf`}
                    className="flex items-center px-4 py-2 bg-[oklch(0.67_0.19_42.13)] text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    {({ loading }) => (
                      <>
                        <Download className="h-5 w-5 mr-2" />
                        {loading ? "Generating PDF..." : "Download PDF"}
                      </>
                    )}
                  </PDFDownloadLink>
                  <button onClick={() => setIsViewModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                    <X size={24} />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2 flex items-center space-x-4">
                    {viewingExEmployee.image ? (
                      <img src={viewingExEmployee.image} alt={viewingExEmployee.full_name} className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-semibold text-gray-800">{viewingExEmployee.full_name}</h4>
                      <p className="text-gray-600 flex items-center mt-1">
                        <Briefcase className="h-4 w-4 mr-2" />
                        {viewingExEmployee.post_applied_for}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Employee ID</p><p className="font-medium">{viewingExEmployee.employee_id}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Gender</p><p className="font-medium">{viewingExEmployee.gender}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">CNIC</p><p className="font-medium">{viewingExEmployee.cnic}</p></div>
                    </div>
                    <div className="flex

 items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{viewingExEmployee.email}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Contact</p><p className="font-medium">{viewingExEmployee.contact_number}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Contact className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Guardian Phone</p><p className="font-medium">{viewingExEmployee.guardian_phone}</p></div>
                    </div>
                    {viewingExEmployee.in_time && (
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div><p className="text-sm text-gray-500">In Time</p><p className="font-medium">{viewingExEmployee.in_time}</p></div>
                      </div>
                    )}
                    {viewingExEmployee.out_time && (
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div><p className="text-sm text-gray-500">Out Time</p><p className="font-medium">{viewingExEmployee.out_time}</p></div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Date of Birth</p><p className="font-medium">{new Date(viewingExEmployee.dob).toLocaleDateString()}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Registration Date</p><p className="font-medium">{new Date(viewingExEmployee.registration_date).toLocaleDateString()}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Joining Date</p><p className="font-medium">{new Date(viewingExEmployee.joining_date).toLocaleDateString()}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Exit Date</p><p className="font-medium">{new Date(viewingExEmployee.exit_date).toLocaleString()}</p></div>
                    </div>
                    {viewingExEmployee.Salary_Cap && (
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        <div><p className="text-sm text-gray-500">Salary Cap</p><p className="font-medium">{viewingExEmployee.Salary_Cap}</p></div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <GraduationCap className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Degree</p><p className="font-medium">{viewingExEmployee.degree}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Institute</p><p className="font-medium">{viewingExEmployee.institute}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Award className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Grade</p><p className="font-medium">{viewingExEmployee.grade}</p></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Year</p><p className="font-medium">{viewingExEmployee.year}</p></div>
                    </div>
                    {viewingExEmployee.current_study && (
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-gray-400" />
                        <div><p className="text-sm text-gray-500">Current Study (Ongoing)</p><p className="font-medium">{viewingExEmployee.current_study}</p></div>
                      </div>
                    )}
                    <div className="flex items-center space-x-3">
                      <Heart className="h-5 w-5 text-gray-400" />
                      <div><p className="text-sm text-gray-500">Has Disease</p><p className="font-medium">{viewingExEmployee.has_disease}</p></div>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-4">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div><p className="text-sm text-gray-500">Permanent Address</p><p className="font-medium">{viewingExEmployee.permanent_address}</p></div>
                    </div>
                    {viewingExEmployee.teaching_subjects && (
                      <div className="flex items-start space-x-3">
                        <GraduationCap className="h-5 w-5 text-gray-400 mt-1" />
                        <div><p className="text-sm text-gray-500">Teaching Subjects</p><p className="font-medium">{viewingExEmployee.teaching_subjects}</p></div>
                      </div>
                    )}
                    {viewingExEmployee.teaching_institute && (
                      <div className="flex items-start space-x-3">
                        <Building className="h-5 w-5 text-gray-400 mt-1" />
                        <div><p className="text-sm text-gray-500">Teaching Institute</p><p className="font-medium">{viewingExEmployee.teaching_institute}</p></div>
                      </div>
                    )}
                    {viewingExEmployee.teaching_contact && (
                      <div className="flex items-start space-x-3">
                        <Phone className="h-5 w-5 text-gray-400 mt-1" />
                        <div><p className="text-sm text-gray-500">Teaching Contact</p><p className="font-medium">{viewingExEmployee.teaching_contact}</p></div>
                      </div>
                    )}
                    {viewingExEmployee.position && (
                      <div className="flex items-start space-x-3">
                        <Briefcase className="h-5 w-5 text-gray-400 mt-1" />
                        <div><p className="text-sm text-gray-500">Position</p><p className="font-medium">{viewingExEmployee.position}</p></div>
                      </div>
                    )}
                    {viewingExEmployee.organization && (
                      <div className="flex items-start space-x-3">
                        <Building className="h-5 w-5 text-gray-400 mt-1" />
                        <div><p className="text-sm text-gray-500">Organization</p><p className="font-medium">{viewingExEmployee.organization}</p></div>
                      </div>
                    )}
                    {viewingExEmployee.skills && (
                      <div className="flex items-start space-x-3">
                        <Users className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Skills</p>
                          <p className="font-medium">{Array.isArray(viewingExEmployee.skills) ? viewingExEmployee.skills.join(", ") : viewingExEmployee.skills}</p>
                        </div>
                      </div>
                    )}
                    {viewingExEmployee.description && (
                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-gray-400 mt-1" />
                        <div><p className="text-sm text-gray-500">Description</p><p className="font-medium">{viewingExEmployee.description}</p></div>
                      </div>
                    )}
                    {viewingExEmployee.reference_name && (
                      <div className="flex items-start space-x-3">
                        <UserPlus className="h-5 w-5 text-gray-400 mt-1" />
                        <div><p className="text-sm text-gray-500">Reference Name</p><p className="font-medium">{viewingExEmployee.reference_name}</p></div>
                      </div>
                    )}
                    {viewingExEmployee.reference_contact && (
                      <div className="flex items-start space-x-3">
                        <PhoneCall className="h-5 w-5 text-gray-400 mt-1" />
                        <div><p className="text-sm text-gray-500">Reference Contact</p><p className="font-medium">{viewingExEmployee.reference_contact}</p></div>
                      </div>
                    )}
                    {viewingExEmployee.disease_description && (
                      <div className="flex items-start space-x-3">
                        <Heart className="h-5 w-5 text-gray-400 mt-1" />
                        <div><p className="text-sm text-gray-500">Disease Description</p><p className="font-medium">{viewingExEmployee.disease_description}</p></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terminate Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <UserMinus className="h-5 w-5 text-orange-500" /> Terminate Active Employee
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 border-b bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search active employees by name or ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm"
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loadingActive ? (
                  <div className="flex flex-col justify-center items-center h-48 space-y-2">
                    <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
                    <p className="text-sm text-gray-500">Loading active employees...</p>
                  </div>
                ) : activeUsers.filter(user => 
                  user.full_name.toLowerCase().includes(addSearch.toLowerCase()) ||
                  user.employee_id.toLowerCase().includes(addSearch.toLowerCase())
                ).length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    No active employees matching your search.
                  </div>
                ) : (
                  activeUsers
                    .filter(user => 
                      user.full_name.toLowerCase().includes(addSearch.toLowerCase()) ||
                      user.employee_id.toLowerCase().includes(addSearch.toLowerCase())
                    )
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-orange-50/30 transition-all animate-slideIn"
                      >
                        <div className="flex items-center space-x-3">
                          {user.image ? (
                            <img src={user.image} alt={user.full_name} className="h-10 w-10 rounded-full object-cover border" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800">{user.full_name}</h4>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <CreditCard size={12} /> {user.employee_id} • <Briefcase size={12} /> {user.post_applied_for}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTerminateEmployee(user.id, user.full_name)}
                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Terminate
                        </button>
                      </div>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Direct Add Ex-Employee Modal */}
      <AnimatePresence>
        {showAddExModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-orange-500" /> Add Ex-Employee Record
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddExModal(false)}
                  className="text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleExFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Section 1: Personal Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-orange-500 uppercase tracking-wider border-b pb-2">1. Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Employee ID *</label>
                      <input
                        type="text"
                        name="employee_id"
                        value={exForm.employee_id}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. TMS-001"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="full_name"
                        value={exForm.full_name}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. John Doe"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={exForm.email}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. email@domain.com"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">CNIC (Without Dashes) *</label>
                      <input
                        type="text"
                        name="cnic"
                        value={exForm.cnic}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. 4210112345678"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        name="dob"
                        value={exForm.dob}
                        onChange={handleExInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Gender *</label>
                      <select
                        name="gender"
                        value={exForm.gender}
                        onChange={handleExInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Number *</label>
                      <input
                        type="text"
                        name="contact_number"
                        value={exForm.contact_number}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. +923001234567"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Guardian Phone *</label>
                      <input
                        type="text"
                        name="guardian_phone"
                        value={exForm.guardian_phone}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. +923001234567"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Permanent Address *</label>
                      <textarea
                        name="permanent_address"
                        value={exForm.permanent_address}
                        onChange={handleExInputChange}
                        required
                        rows="2"
                        placeholder="Complete postal address..."
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Employment Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-orange-500 uppercase tracking-wider border-b pb-2">2. Employment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Post Applied For *</label>
                      <input
                        type="text"
                        name="post_applied_for"
                        value={exForm.post_applied_for}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Salary Cap *</label>
                      <input
                        type="text"
                        name="Salary_Cap"
                        value={exForm.Salary_Cap}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. 150000"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">In Time *</label>
                      <input
                        type="text"
                        name="in_time"
                        value={exForm.in_time}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. 09:00 AM"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Out Time *</label>
                      <input
                        type="text"
                        name="out_time"
                        value={exForm.out_time}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. 06:00 PM"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Registration Date *</label>
                      <input
                        type="date"
                        name="registration_date"
                        value={exForm.registration_date}
                        onChange={handleExInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Joining Date *</label>
                      <input
                        type="date"
                        name="joining_date"
                        value={exForm.joining_date}
                        onChange={handleExInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Exit Date *</label>
                      <input
                        type="date"
                        name="exit_date"
                        value={exForm.exit_date}
                        onChange={handleExInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Education */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-orange-500 uppercase tracking-wider border-b pb-2">3. Educational Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Degree *</label>
                      <input
                        type="text"
                        name="degree"
                        value={exForm.degree}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. BSCS"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Institute *</label>
                      <input
                        type="text"
                        name="institute"
                        value={exForm.institute}
                        onChange={handleExInputChange}
                        required
                        placeholder="e.g. FAST NU"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Grade *</label>
                      <select
                        name="grade"
                        value={exForm.grade}
                        onChange={handleExInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="">Select Grade</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                        <option value="Awaiting">Awaiting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Graduation Year *</label>
                      <input
                        type="number"
                        name="year"
                        value={exForm.year}
                        onChange={handleExInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Current Study (Ongoing)</label>
                      <input
                        type="text"
                        name="current_study"
                        value={exForm.current_study}
                        onChange={handleExInputChange}
                        placeholder="e.g. BSCS, MCS (if ongoing)"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Disease Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-orange-500 uppercase tracking-wider border-b pb-2">4. Medical Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Has Disease? *</label>
                      <select
                        name="has_disease"
                        value={exForm.has_disease}
                        onChange={handleExInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    {exForm.has_disease === "Yes" && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Disease Description *</label>
                        <input
                          type="text"
                          name="disease_description"
                          value={exForm.disease_description}
                          onChange={handleExInputChange}
                          required
                          placeholder="Describe the medical condition..."
                          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 5: Experience & Skills */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-orange-500 uppercase tracking-wider border-b pb-2">5. Optional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Skills (Comma-separated)</label>
                      <input
                        type="text"
                        name="skills"
                        value={exForm.skills}
                        onChange={handleExInputChange}
                        placeholder="React, Node.js, PostgreSQL"
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Description / Notes</label>
                      <input
                        type="text"
                        name="description"
                        value={exForm.description}
                        onChange={handleExInputChange}
                        placeholder="Reason for leaving, general notes..."
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end items-center gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddExModal(false)}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEx}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-orange-200 cursor-pointer disabled:opacity-50"
                  >
                    {submittingEx ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                    Save Archive Record
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PopupMessage message={popupMessage?.text} type={popupMessage?.type} />
    </div>
  );
};

export default ExEmployeePage;