import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Sparkles, CheckCircle, XCircle, MailOpen, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MyPromotions() {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState({ points: user?.points || 0, score: user?.performance?.overallScore || 0 });

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const [aRes, meRes] = await Promise.all([
                    API.get('/promotions/my'),
                    API.get('/auth/me')
                ]);
                setAlerts(aRes.data || []);
                setStats({
                    points: meRes.data.points || 0,
                    score: (typeof meRes.data.performance === 'string'
                        ? JSON.parse(meRes.data.performance)
                        : meRes.data.performance)?.overallScore || 0
                });
            } catch (err) {
                console.error("Failed to fetch alerts/auth", err);
            }
        };
        fetchAlerts();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/promotions/${id}`, { status });
            // Update local state
            setAlerts(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleMarkAsRead = (alert) => {
        if (alert.status === 'Unread') {
            updateStatus(alert.id, 'Read');
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 p-8">
                <div className="absolute -top-10 -right-10 opacity-20 rotate-12">
                    <Award className="w-64 h-64 text-amber-500" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-amber-400" />
                        My Promotions Hub
                    </h1>
                    <p className="text-amber-200/80 mb-8 max-w-xl text-sm leading-relaxed">
                        Track your performance trajectory and review official promotion offers from your management team. Keep crushing your goals!
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <div className="px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-4">
                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                                {stats.points}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                                Total<br/>Points
                            </div>
                        </div>
                        <div className="px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-4">
                            <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
                                {stats.score.toFixed(0)}%
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
                                Performance<br/>Score
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub Header */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <MailOpen className="w-5 h-5 text-primary-400" /> Active Offers & Alerts
                </h3>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {alerts.length === 0 ? (
                        <div className="md:col-span-2 glass-card text-center py-20">
                            <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Award className="w-8 h-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">No Active Promotions</h3>
                            <p className="text-slate-400 text-sm">Keep improving your performance to unlock new opportunities!</p>
                        </div>
                    ) : (
                        alerts.map((alert, i) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onMouseEnter={() => handleMarkAsRead(alert)}
                                className={`p-6 rounded-3xl border transition-all duration-500 relative overflow-hidden group ${
                                    alert.status === 'Accepted' ? 'bg-emerald-500/5 border-emerald-500/20' :
                                    alert.status === 'Rejected' ? 'bg-red-500/5 border-red-500/20' :
                                    'bg-slate-900/80 border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.05)]'
                                }`}
                            >
                                {alert.status === 'Unread' && (
                                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> New
                                    </div>
                                )}
                                {alert.status === 'Accepted' && (
                                    <div className="absolute top-4 right-4">
                                        <CheckCircle className="w-6 h-6 text-emerald-500/50" />
                                    </div>
                                )}

                                <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                    {alert.type === 'PromotionOffer' ? <Sparkles className="w-4 h-4 text-amber-400" /> : <AlertTriangle className="w-4 h-4 text-blue-400" />}
                                    {alert.type === 'PromotionOffer' ? 'Official Promotion Offer' : 'Administrative Alert'}
                                </div>

                                <div className="text-slate-300 text-sm leading-relaxed mb-6 font-medium">
                                    "{alert.message}"
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                                    <div className="text-[10px] text-slate-500 font-mono tracking-widest">
                                        ISSUED: {new Date(alert.createdAt).toLocaleDateString()}
                                    </div>

                                    {(alert.status === 'Unread' || alert.status === 'Read') && alert.type === 'PromotionOffer' ? (
                                        <div className="flex w-full sm:w-auto gap-2">
                                            <button 
                                                onClick={() => updateStatus(alert.id, 'Accepted')}
                                                className="flex-1 sm:flex-none btn-success py-2.5 px-6 text-xs uppercase font-black tracking-widest shadow-lg shadow-emerald-500/20"
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                onClick={() => updateStatus(alert.id, 'Rejected')}
                                                className="flex-1 sm:flex-none btn-danger py-2.5 px-6 text-xs uppercase font-black tracking-widest"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${
                                            alert.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            alert.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            'bg-slate-800 text-slate-400 border-white/5'
                                        }`}>
                                            Status: {alert.status}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
