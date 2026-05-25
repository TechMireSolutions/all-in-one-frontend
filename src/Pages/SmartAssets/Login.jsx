import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api';
import { Lock, User, Loader2, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/login/', {
        username,
        password,
      });
      localStorage.setItem('smart_assets_token', response.data.token);
      setSuccess(true);
      setTimeout(() => navigate('/smart-assets/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication aborted. System credentials mismatch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/20 transform -rotate-3 border border-orange-400">
            <ShieldCheck size={36} className="text-white rotate-3" />
          </div>
          <h2 className="text-4xl font-black text-gray-950 tracking-tight mb-2 uppercase">Account <span className="text-orange-500">Sign In</span></h2>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">Smart Assets Database Access</p>
        </div>

        <div className="bg-white p-8 md:p-10 border border-gray-200 rounded-3xl shadow-sm relative overflow-hidden">
          {success ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200">
                <Activity size={32} className="animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-emerald-600 mb-2 uppercase tracking-tight">Access Authorized</h3>
              <p className="text-gray-500 text-sm font-medium">Redirecting to inventory fleet hub...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Entity Name</label>
                <div className="relative group">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-medium"
                      placeholder="Username"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Keyphrase</label>
                <div className="relative group">
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-sm font-medium"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-[10px] font-black uppercase tracking-wider text-center bg-red-50 py-3 rounded-xl border border-red-200"
                >
                  {error}
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/20 text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs shadow-xl cursor-pointer"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    Authorize Connection <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Need authorized credentials? <Link to="/smart-assets/signup" className="text-orange-500 hover:text-orange-600 transition-colors">Register Entity</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
