import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, UserPlus, Mail, Lock, User, Building2, Briefcase, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roles = ['Employee', 'TeamLeader', 'Chef'];
const departments = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist', 'UI/UX Designer', 'QA Engineer', 'Product Manager', 'Prompt Engineer'];

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Employee', department: '', designation: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
        setLoading(false);
    };

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface-900 relative overflow-hidden px-4 py-12">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="w-full max-w-[500px] relative z-10"
            >
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 transition-transform duration-300">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-black gradient-text tracking-tight uppercase">WorkspaceAI</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Create Account</h1>
                    <p className="text-slate-400 mt-2 font-medium">Join the intelligent workspace</p>
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

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
                            <div className="premium-input-wrapper">
                                <input 
                                    type="text" 
                                    value={form.name} 
                                    onChange={e => update('name', e.target.value)} 
                                    placeholder="John Doe" 
                                    className="premium-input px-4" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
                            <div className="premium-input-wrapper">
                                <input 
                                    type="email" 
                                    value={form.email} 
                                    onChange={e => update('email', e.target.value)} 
                                    placeholder="you@company.com" 
                                    className="premium-input px-4" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Secure Password</label>
                            <div className="premium-input-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={form.password} 
                                    onChange={e => update('password', e.target.value)} 
                                    placeholder="••••••••" 
                                    className="premium-input pl-4 pr-12" 
                                    required 
                                    minLength={6}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Role</label>
                                <select 
                                    value={form.role} 
                                    onChange={e => update('role', e.target.value)} 
                                    className="premium-input text-sm"
                                >
                                    {roles.map(r => <option key={r} value={r} className="bg-surface-900">{r}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Department</label>
                                <select 
                                    value={form.department} 
                                    onChange={e => update('department', e.target.value)} 
                                    className="premium-input text-sm"
                                >
                                    <option value="" className="bg-surface-900">Select...</option>
                                    {departments.map(d => <option key={d} value={d} className="bg-surface-900">{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Designation</label>
                            <div className="premium-input-wrapper">
                                <input 
                                    type="text" 
                                    value={form.designation} 
                                    onChange={e => update('designation', e.target.value)} 
                                    placeholder="e.g. Senior Developer" 
                                    className="premium-input px-4" 
                                />
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
                                <><UserPlus className="w-5 h-5" /> Sign Up</>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-slate-500 mt-8 font-medium">
                    Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 transition-colors ml-1">Sign In</Link>
                </p>
            </motion.div>
        </div>
    );
}
