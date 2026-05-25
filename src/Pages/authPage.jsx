import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../Store/authStore";
import { useNavigate } from "react-router-dom";
import { authSchema } from "../Scheema/authScheema";
import { Mail, Lock, Loader2, Sparkles, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/TMS-LOGO.webp";

// Premium Popup Message Component
const PopupMessage = ({ message, type }) => (
  <AnimatePresence>
    {message && (
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`fixed top-6 right-6 p-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border ${
          type === "success" 
            ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300 backdrop-blur-md" 
            : "bg-rose-950/90 border-rose-500/30 text-rose-300 backdrop-blur-md"
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${type === "success" ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`} />
        <span className="text-sm font-semibold tracking-wide">{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

const AuthPage = () => {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();
  const [popupMessage, setPopupMessage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const showPopup = (text, type = "success") => {
    setPopupMessage({ text, type });
    setTimeout(() => setPopupMessage(null), 4000);
  };

  const onSubmit = async (data) => {
    const success = await login(data.email, data.password);
    if (success) {
      const userRole = useAuthStore.getState().role;
      showPopup(`Successfully logged in as ${userRole?.toUpperCase() || "user"}`);
      
      // Navigate based on resolved role
      setTimeout(() => {
        if (userRole?.toLowerCase() === "hr") {
          navigate("/uploadfile");
        } else {
          navigate("/users");
        }
      }, 1000);
    } else {
      showPopup(error || "Login failed. Please check your credentials.", "error");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.3, ease: "easeOut" } 
    },
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden px-4 font-sans selection:bg-orange-500 selection:text-white">
      {/* Background ambient light mesh gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none" />
      
      {/* Fine architectural background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <motion.div
        className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl w-full max-w-md z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Sleek premium header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="relative group mb-4">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-600 opacity-30 blur group-hover:opacity-50 transition duration-300" />
            <div className="relative w-20 h-20 bg-slate-950/80 border border-slate-800 rounded-3xl flex items-center justify-center shadow-inner overflow-hidden">
              <img src={logo} alt="Techmire Solutions Logo" className="w-14 h-14 object-contain" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-1.5 justify-center uppercase">
            Techmire <span className="text-orange-500">Solutions</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em] mt-1.5">
            TMS Portal Account Authentication
          </p>
        </div>

        {/* Unified Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Email Input Field */}
          <motion.div variants={inputVariants} className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <Mail size={12} className="text-orange-500" /> Email Address
            </label>
            <div className="relative group">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                {...register("email")}
                className="w-full bg-slate-950/40 border border-slate-800/80 text-slate-100 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm placeholder-slate-600"
                placeholder="email@techmiresolutions.com"
              />
            </div>
            {errors.email && (
              <p className="text-rose-500 text-xs font-semibold mt-1 ml-1">{errors.email.message}</p>
            )}
          </motion.div>

          {/* Password/CNIC Input Field */}
          <motion.div variants={inputVariants} className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <Lock size={12} className="text-orange-500" /> Password or CNIC
            </label>
            <div className="relative group">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="password"
                {...register("password")}
                className="w-full bg-slate-950/40 border border-slate-800/80 text-slate-100 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm placeholder-slate-600"
                placeholder="Your Password or CNIC"
              />
            </div>
            {errors.password && (
              <p className="text-rose-500 text-xs font-semibold mt-1 ml-1">{errors.password.message}</p>
            )}
          </motion.div>

          {/* Interactive Info / Tip box */}
          <div className="flex gap-2.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-900 text-[10px] text-slate-400 font-medium leading-relaxed">
            <HelpCircle size={14} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-orange-500 font-bold">Quick Guide:</span> Employees, OJTs, & Students login using <span className="text-white">Email & CNIC</span> (without dashes). HR & Super Admins use <span className="text-white">Email & Password</span>.
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden group bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold py-3.5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2.5 uppercase tracking-widest text-xs shadow-xl shadow-orange-500/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer border border-orange-400/20"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin text-orange-200" />
                <span>Authorizing Account...</span>
              </>
            ) : (
              <>
                <span>Secure Sign In</span>
                <Sparkles size={14} className="text-orange-200" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* Floating notifications */}
      <PopupMessage
        message={popupMessage?.text}
        type={popupMessage?.type}
      />
    </div>
  );
};

export default AuthPage;