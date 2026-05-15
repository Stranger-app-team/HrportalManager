import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "./config/api";
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Building2,
  Globe,
  Eye,
  EyeOff
} from "lucide-react";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email: email,
          password: password,
        }
      );

      const user = response.data.user;

      // Check if user has manager role
      if (user.userType !== "manager") {
        setError(`Access Denied: ${user.userType}s cannot access the Manager Portal.`);
        setLoading(false);
        return;
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("email", user.email);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.userType === "accounts") {
        navigate("/dashboard/accounts");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.log("LOGIN ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen relative flex items-center justify-center p-6 bg-[#061633] overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* ── BACKGROUND ELEMENTS ── */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full" />
      
      {/* Static Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* ── LOGIN CARD ── */}
      <div className="w-full max-w-[480px] relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6">
             <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-[900] text-white tracking-tighter uppercase italic">MANAGER PORTAL</h1>
          <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.4em] mt-2">Team Management Center</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
           <div className="mb-10">
              <h2 className="text-xl font-black text-white italic tracking-tight uppercase border-l-4 border-blue-500 pl-4">MANAGER LOGIN</h2>
              <p className="text-xs text-white/40 font-bold mt-2 px-1">Welcome back. Please enter your credentials.</p>
           </div>

           {error && (
             <div className="mb-8 flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl animate-in shake duration-300">
                <AlertCircle size={18} className="text-rose-500 shrink-0" />
                <p className="text-[11px] text-rose-200 font-bold">{error}</p>
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">Email Address</label>
                 <div className="relative group">
                    <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type="email" 
                      required
                      placeholder="email@company.com"
                      className="w-full bg-white/5 border border-white/10 py-5 pl-14 pr-6 rounded-2xl text-white font-bold text-[14px] outline-none focus:bg-white/10 focus:border-blue-500/40 transition-all placeholder:text-white/10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 py-5 pl-14 pr-12 rounded-2xl text-white font-bold text-[14px] outline-none focus:bg-white/10 focus:border-blue-500/40 transition-all placeholder:text-white/10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-[13px] uppercase tracking-widest italic shadow-2xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden group border border-blue-400/20 mt-8"
              >
                {loading ? (
                   <>
                     <Loader2 size={20} className="animate-spin" /> 
                     <span>Logging in...</span>
                   </>
                ) : (
                   <>
                     <span>Sign In</span>
                     <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                   </>
                )}
              </button>
           </form>

           <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2"><Globe size={12}/> Secure Access</div>
              <div className="flex items-center gap-2"><Building2 size={12}/> V2.4.0 Manager System</div>
           </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="mt-12 text-center">
           <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
             Powered by <span className="underline text-blue-500/50">TechTech</span> • 2026
           </p>
        </div>
      </div>

    </div>
  );
};

export default LoginScreen;
