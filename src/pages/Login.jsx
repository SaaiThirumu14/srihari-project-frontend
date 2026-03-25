import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
        setLoading(false);
    };

    const quickLogin = (email) => { setEmail(email); setPassword('password123'); };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-900 relative overflow-hidden px-4 py-12">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="w-full max-w-[420px] relative z-10"
            >
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-300">
                           <Brain className="w-7 h-7 text-white" /> 
                        </div>
                        <span className="text-2xl font-black gradient-text tracking-tight uppercase">WorkspaceAI</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
                    <p className="text-slate-400 mt-2 font-medium">Sign in to your intelligent workspace</p>
                </div>

                <div className="glass-card shadow-2xl">
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6"
                        >
                            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Corporate Email</label>
                            <div className="premium-input-wrapper">
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={e => setEmail(e.target.value)} 
                                    placeholder="name@company.ai" 
                                    className="premium-input px-4" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Access Key</label>
                            <div className="premium-input-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={password} 
                                    onChange={e => setPassword(e.target.value)} 
                                    placeholder="••••••••" 
                                    className="premium-input pl-4 pr-12" 
                                    required 
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary-400 transition-colors z-20"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4 opacity-50" /> : <Eye className="w-4 h-4 opacity-50" />}
                                </button>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="btn-primary w-full py-4 text-sm tracking-[0.2em] uppercase font-black flex items-center justify-center gap-3 mt-4 shadow-xl"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                            ) : (
                                <><LogIn className="w-5 h-5" /> Execute Sign In</>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-[10px] font-bold text-slate-500 text-center mb-4 uppercase tracking-widest">Rapid Access (Sandbox)</p>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Admin', email: 'admin@company.com', color: 'hover:text-red-400' },
                                { label: 'HR', email: 'hr@company.com', color: 'hover:text-purple-400' },
                                { label: 'TL', email: 'tl@company.com', color: 'hover:text-blue-400' },
                                { label: 'Alice', email: 'alice@company.com', color: 'hover:text-emerald-400' },
                                { label: 'John', email: 'john@company.com', color: 'hover:text-cyan-400' },
                                { label: 'Chef', email: 'chef@company.com', color: 'hover:text-amber-400' }
                            ].map(q => (
                                <button 
                                    key={q.email} 
                                    onClick={() => quickLogin(q.email)} 
                                    className={`text-[10px] py-2.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 ${q.color} transition-all border border-white/5 font-bold uppercase tracking-tighter`}
                                >
                                    {q.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="text-center text-sm text-slate-500 mt-8 font-medium">
                    Don't have an account? <Link to="/register" className="text-primary-400 hover:text-primary-300 transition-colors ml-1">Sign Up</Link>
                </p>
            </motion.div>
        </div>
    );
}
