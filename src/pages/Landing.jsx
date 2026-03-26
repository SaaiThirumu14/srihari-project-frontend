import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Users, ChefHat, ClipboardCheck, Heart, BarChart3, MessageSquare, Shield, Sparkles } from 'lucide-react';

const features = [
    { icon: Brain, title: 'Gemini 2.5 AI Engine', desc: 'Churn prediction, retention strategies, and workforce forecasting powered by Google Gemini', color: 'from-violet-500 to-purple-500' },
    { icon: ClipboardCheck, title: 'Attendance & Leave', desc: 'Check-in/out tracking, leave management, and anomaly detection', color: 'from-blue-500 to-cyan-500' },
    { icon: BarChart3, title: 'Performance & Promotions', desc: 'Task-based scoring, gamification points, and automated promotion pipeline', color: 'from-emerald-500 to-green-500' },
    { icon: Heart, title: 'Wellness Monitoring', desc: 'Daily check-ins with AI sentiment analysis and personalized advice', color: 'from-pink-500 to-rose-500' },
    { icon: ChefHat, title: 'Smart Cafeteria', desc: 'Menu browsing, one-tap ordering, food polls, and kitchen display system', color: 'from-amber-500 to-orange-500' },
    { icon: MessageSquare, title: 'Real-Time HR Chat', desc: 'Encrypted Socket.IO messaging between employees and HR', color: 'from-indigo-500 to-blue-500' },
];

const roles = [
    { name: 'Admin', desc: 'Full platform control', icon: Shield, color: 'bg-red-500/20 text-red-400' },
    { name: 'HR', desc: 'Risk analysis & chat', icon: Users, color: 'bg-purple-500/20 text-purple-400' },
    { name: 'Team Leader', desc: 'Task & team management', icon: BarChart3, color: 'bg-blue-500/20 text-blue-400' },
    { name: 'Employee', desc: '12 features in one portal', icon: Sparkles, color: 'bg-emerald-500/20 text-emerald-400' },
    { name: 'Chef', desc: 'Kitchen & menu operations', icon: ChefHat, color: 'bg-amber-500/20 text-amber-400' },
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-surface-900 overflow-hidden">
            {/* Hero */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 via-surface-900 to-purple-900/20" />
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

                <nav className="relative z-10 flex items-center justify-between px-6 md:px-8 py-6 max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                            <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <span className="text-lg md:text-xl font-bold gradient-text">WorkspaceAI</span>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/login" className="px-4 py-2 rounded-xl text-slate-300 hover:text-white transition-colors text-xs md:text-sm font-medium">Sign In</Link>
                        <Link to="/register" className="btn-primary text-xs md:text-sm px-4 py-2">Get Started</Link>
                    </div>
                </nav>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                    className="relative z-10 text-center px-6 pt-12 md:pt-20 pb-32 max-w-5xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-6">
                        <span className="text-white">The All-in-One</span><br />
                        <span className="gradient-text">Employee Intel</span><br />
                        <span className="text-white">Platform</span>
                    </h1>
                    <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Attendance, Performance, Churn Prediction, Wellness, Cafeteria, and Real-time Chat —
                        unified under one AI-powered workspace with 5 role-specific dashboards.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link to="/register" className="btn-primary text-lg px-12 py-4 animate-glow w-full sm:w-auto uppercase font-black tracking-widest">Start Free →</Link>
                        <Link to="/login" className="btn-secondary text-lg px-12 py-4 w-full sm:w-auto uppercase font-black tracking-widest">Sign In</Link>
                    </div>
                </motion.div>
            </div>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-8 -mt-16 relative z-20 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="glass-card group">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <f.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-slate-400">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Roles */}
            <section className="max-w-7xl mx-auto px-8 py-20">
                <h2 className="text-3xl font-bold text-center text-white mb-4">5 Role-Specific Dashboards</h2>
                <p className="text-center text-slate-400 mb-12">Each role gets a tailored experience with features designed for their workflow</p>
                <div className="flex flex-wrap justify-center gap-4">
                    {roles.map((r, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                            className="glass-card flex items-center gap-4 min-w-[200px]">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${r.color}`}>
                                <r.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-semibold text-white text-sm">{r.name}</div>
                                <div className="text-xs text-slate-400">{r.desc}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="text-center py-8 border-t border-slate-800 text-slate-500 text-sm">
                Built with ❤️ using MERN Stack + Google Gemini 2.5 AI
            </footer>
        </div>
    );
}
