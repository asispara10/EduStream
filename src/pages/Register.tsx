import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { BookOpen, Mail, Lock, User as UserIcon, ArrowRight, GraduationCap, Presentation, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register({ name, email, password, role });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to register");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white/30 backdrop-blur-md rounded-2xl mb-4 border border-white/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Join EduStream</h1>
          <p className="text-white/80 mt-2 font-medium">Create your account to get started</p>
        </div>

        {error && (
          <div className="bg-red-500/20 backdrop-blur-md text-white p-4 rounded-2xl text-sm mb-6 border border-white/10">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all backdrop-blur-md ${
                role === "student" 
                ? "border-white bg-white/30 text-white shadow-lg" 
                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              <GraduationCap className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Student</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all backdrop-blur-md ${
                role === "teacher" 
                ? "border-white bg-white/30 text-white shadow-lg" 
                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              <Presentation className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Teacher</span>
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1.5 ml-1">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all outline-none text-white placeholder-white/40"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all outline-none text-white placeholder-white/40"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white/90 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 focus:bg-white/20 transition-all outline-none text-white placeholder-white/40"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-white text-indigo-600 font-bold py-4 rounded-2xl transition-all hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10 flex items-center justify-center gap-2 group mt-4"
          >
            Create Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center mt-8 text-white/70 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-white font-bold hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
