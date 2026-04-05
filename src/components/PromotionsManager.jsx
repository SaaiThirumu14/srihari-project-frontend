import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Award, UserCheck, Send, CheckCircle, AlertTriangle, XCircle, Users, BarChart3, Star, Mail } from 'lucide-react';

export default function PromotionsManager() {
    const { user: currentUser } = useAuth();
    const isTeamLeader = currentUser?.role === 'TeamLeader';
    const [users, setUsers] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [message, setMessage] = useState('');
    const [type, setType] = useState('PromotionOffer');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [uRes, aRes] = await Promise.all([
                    API.get('/users'),
                    API.get('/promotions/all')
                ]);
                const parsedUsers = (uRes.data || []).map(u => ({
                    ...u,
                    performance: typeof u.performance === 'string' ? JSON.parse(u.performance) : u.performance
                }));
                setUsers(parsedUsers);
                setAlerts(aRes.data || []);
            } catch (err) {
                console.error("Failed to fetch data", err);
            }
        };
        fetchData();
    }, []);

    const eligibleUsers = users.filter(u => u.promotionStatus === 'Eligible' || u.promotionStatus === 'Pending');

    const handleSendOffer = async () => {
        if (!selectedUser || (!message.trim() && type === 'PromotionOffer')) return;

        setLoading(true);
        try {
            await API.post('/promotions', {
                employeeId: selectedUser.id,
                message: message.trim() || `Congratulations ${selectedUser.name}! You are being considered for a promotion.`,
                type
            });

            // TeamLeaders use recommend-promotion (sets to Pending)
            // Admin/HR use the full promotion update
            if (type === 'PromotionOffer') {
                if (isTeamLeader) {
                    await API.put(`/users/${selectedUser.id}/recommend-promotion`);
                } else {
                    await API.put(`/users/${selectedUser.id}/promotion`, { promotionStatus: 'Pending' });
                }
            }

            const [uRes, aRes] = await Promise.all([
                API.get('/users'),
                API.get('/promotions/all')
            ]);
            
            const parsedUsers = (uRes.data || []).map(u => ({
                ...u,
                performance: typeof u.performance === 'string' ? JSON.parse(u.performance) : u.performance
            }));
            setUsers(parsedUsers);
            setAlerts(aRes.data || []);

            setSelectedUser(null);
            setMessage('');
            alert('Offer sent successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to send offer.');
        }
        setLoading(false);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Accepted': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'Rejected': return <XCircle className="w-4 h-4 text-red-400" />;
            case 'Read': return <UserCheck className="w-4 h-4 text-blue-400" />;
            default: return <Mail className="w-4 h-4 text-amber-400" />;
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                    <Award className="w-8 h-8 text-amber-400" />
                    Promotions Management
                </h1>
                <p className="text-slate-400">Review eligible candidates and manage promotion offers seamlessly.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Send Offer Panel */}
                <div className="glass-card lg:col-span-1 border-primary-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Star className="w-24 h-24 text-amber-400" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
                            <Send className="w-4 h-4 text-primary-400" /> Issue Offer
                        </h3>

                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Select Candidate</label>
                        <select 
                            className="premium-input w-full mb-4"
                            value={selectedUser ? selectedUser.id : ''}
                            onChange={(e) => {
                                const u = users.find(uu => uu.id === parseInt(e.target.value));
                                setSelectedUser(u);
                            }}
                        >
                            <option value="" disabled>-- Choose Eligible Employee --</option>
                            {eligibleUsers.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.department || 'No Dept'}) - Score: {u.performance?.overallScore?.toFixed(0) || 0}%</option>
                            ))}
                        </select>

                        {selectedUser && (
                            <div className="mb-4 p-4 rounded-xl bg-slate-900/50 border border-white/5 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                                    {selectedUser.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white">{selectedUser.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">Current Status: {selectedUser.promotionStatus}</div>
                                </div>
                            </div>
                        )}

                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Offer Type</label>
                        <select className="premium-input w-full mb-4" value={type} onChange={e => setType(e.target.value)}>
                            <option value="PromotionOffer">Official Promotion Offer</option>
                            <option value="Alert">Standard Alert/Feedback</option>
                        </select>

                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Personalized Message</label>
                        <textarea 
                            className="premium-input w-full mb-6 min-h-[120px] resize-none"
                            placeholder="Draft the official offer details..."
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />

                        <button 
                            onClick={handleSendOffer}
                            disabled={!selectedUser || loading}
                            className={`w-full btn-primary py-3 uppercase tracking-widest font-black flex items-center justify-center gap-2 ${(!selectedUser || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? <span className="animate-spin text-lg">◌</span> : <><Send className="w-4 h-4" /> Deploy Offer</>}
                        </button>
                    </div>
                </div>

                {/* Offer History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-400" /> Eligible Roster
                            </h3>
                            <span className="badge badge-primary">{eligibleUsers.length} Pending</span>
                        </div>
                        <div className="data-table-wrapper max-h-[300px] overflow-y-auto align-top">
                            <table className="data-table">
                                <thead><tr><th>Employee</th><th>Dept.</th><th>Score</th><th>Status</th></tr></thead>
                                <tbody>
                                    {eligibleUsers.length === 0 && <tr><td colSpan="4" className="text-center text-slate-500">No eligible employees currently.</td></tr>}
                                    {eligibleUsers.map(u => (
                                        <tr key={u.id} className="cursor-pointer hover:bg-white/5" onClick={() => setSelectedUser(u)}>
                                            <td className="text-white font-medium">{u.name}</td>
                                            <td className="text-slate-400 text-xs">{u.department || '—'}</td>
                                            <td className="text-amber-400 font-black">{(u.performance?.overallScore || 0).toFixed(0)}%</td>
                                            <td><span className={`badge ${u.promotionStatus === 'Pending' ? 'badge-warning' : 'badge-primary'}`}>{u.promotionStatus}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="glass-card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-blue-400" /> Active Offers Status
                            </h3>
                        </div>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {alerts.length === 0 ? <p className="text-slate-500 text-xs text-center py-4">No offers sent yet.</p> :
                                alerts.map(alert => {
                                    const employeeName = users.find(u => u.id === alert.employee)?.name || `ID: ${alert.employee}`;
                                    
                                    return (
                                        <div key={alert.id} className="p-4 rounded-xl bg-slate-900/40 border border-white/5 flex items-start justify-between gap-4 hover:border-white/10 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-sm font-bold text-white">{employeeName}</span>
                                                    <span className={`badge text-[9px] ${alert.type === 'PromotionOffer' ? 'badge-warning' : 'badge-primary'}`}>{alert.type}</span>
                                                </div>
                                                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{alert.message}</p>
                                                <div className="text-[9px] font-mono text-slate-500 mt-2 tracking-widest">{new Date(alert.createdAt).toLocaleString()}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${
                                                    alert.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    alert.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    alert.status === 'Read' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                    {getStatusIcon(alert.status)}
                                                    {alert.status}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
