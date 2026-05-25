import React from "react";
import { useAuthStore } from "../Store/authStore";
import { motion } from "framer-motion";
import { 
  Briefcase, GraduationCap, FolderKanban, BookOpen, 
  User, Lock, Code2, ShieldAlert, CheckCircle, Info 
} from "lucide-react";

const ActivitiesPage = () => {
  const { user, role } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Please log in to view your activities.
      </div>
    );
  }

  const isOJT = role?.toLowerCase() === "ojt";
  const isStudent = role?.toLowerCase() === "student";

  // Framer Motion variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-6"
      >
        {/* Banner with Lock status */}
        <motion.div 
          variants={itemVariants}
          className="relative bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl overflow-hidden border border-white/10"
        >
          {/* Decorative light streaks */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="bg-orange-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-orange-400/30">
                {isOJT ? "OJT Trainee Activities" : "Student Activities"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
                Welcome back, {user.full_name}!
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                {isOJT 
                  ? "Track your assigned organization projects, technologies, and supervisor detail." 
                  : "View your current enrolled courses, active semester, and academic outline."}
              </p>
            </div>
            
            {/* Managed by Admin badge */}
            <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20">
              <Lock size={16} className="text-orange-400 flex-shrink-0 animate-pulse" />
              <div className="text-left">
                <p className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider leading-none">Access Control</p>
                <p className="text-xs font-bold text-white mt-0.5">Managed by Super Admin Only</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dynamic content card based on Role */}
        {isOJT && (
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Project Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <FolderKanban size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Assigned Project Details</h2>
                  <p className="text-xs text-gray-400">Current project assignment and outline</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left side: Project name and description */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Project Name</h4>
                    <p className="text-lg font-bold text-slate-800 mt-1">
                      {user.project_name || "No Project Assigned Yet"}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
                    <p className="text-sm text-slate-600 mt-1.5 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                      {user.project_description || "No project description provided by the administrator."}
                    </p>
                  </div>
                </div>

                {/* Right side: Supervisor and Status */}
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supervisor</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-semibold">
                        <User size={13} />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {user.supervisor || "Not Assigned"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">OJT Level</h4>
                    <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-semibold mt-2 capitalize">
                      {user.level || "OJT Level 1"}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</h4>
                    <div className="flex items-center gap-1.5 mt-2">
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-xs font-bold text-slate-700">{user.status || "Active"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technologies */}
              {user.project_technologies && user.project_technologies.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tech Stack & Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.project_technologies.map((tech) => (
                      <span key={tech} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-3.5 py-1.5 rounded-full border border-indigo-100 font-medium">
                        <Code2 size={12} /> {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {isStudent && (
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Enrolled Courses & Study</h2>
                  <p className="text-xs text-gray-400">Your current courses list and academic details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Courses list */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Course List</h4>
                  {user.courses && user.courses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {user.courses.map((course, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/10 transition group">
                          <div className="w-8 h-8 bg-white shadow-sm border border-slate-100 rounded-lg flex items-center justify-center text-orange-500 font-bold text-xs group-hover:scale-105 transition">
                            {idx + 1}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{course}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                      No courses have been added to your profile by the admin yet.
                    </p>
                  )}
                </div>

                {/* Academic Outline */}
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Semester</h4>
                    <p className="text-sm font-bold text-slate-700 mt-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 inline-block shadow-sm">
                      {user.semester || "Not Specified"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Degree</h4>
                    <p className="text-xs font-semibold text-slate-600 mt-1.5">
                      {user.degree || "—"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Institute</h4>
                    <p className="text-xs font-semibold text-slate-600 mt-1.5">
                      {user.institute || "—"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</h4>
                    <span className="inline-block bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold mt-2 capitalize">
                      {user.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notice at the bottom */}
        <motion.div 
          variants={itemVariants}
          className="flex gap-3 bg-orange-50 border border-orange-100 rounded-xl p-4 text-orange-800"
        >
          <Info size={18} className="flex-shrink-0 mt-0.5 text-orange-600" />
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-orange-950">Notice on Profile Editing</h5>
            <p className="text-xs mt-1 text-orange-900/90 leading-relaxed">
              {isOJT 
                ? "Your project assignment, supervisor, and tech stack are locked to maintain project allocation records. If you require changes to your assigned project, please request your Supervisor to notify the Super Admin." 
                : "Course enrollments, current semester, and institutional data are locked for official academic tracking. For enrollment updates, please contact the Super Admin."}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ActivitiesPage;
