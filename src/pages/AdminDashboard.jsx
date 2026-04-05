import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { Users, BarChart3, Award, Heart, Shield, Settings, TrendingUp, AlertTriangle, UtensilsCrossed } from 'lucide-react';
import CafeteriaView from '../components/CafeteriaView';
import PromotionsManager from '../components/PromotionsManager';

export default function AdminDashboard({ activeTab }) {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ total: 0, employees: 0, leaders: 0, promoted: 0 });

    useEffect(() => {
        API.get('/users').then(r => {
            const all = r.data;
            setUsers(all);
            setStats({
                total: all.length,
                employees: all.filter(u => u.role === 'Employee').length,
                leaders: all.filter(u => u.role === 'TeamLeader').length,
                promoted: all.filter(u => u.promotionStatus === 'Promoted').length
            });
        }).catch(() => {});
    }, []);

    const statCards = [
        { label: 'Total Users', value: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Employees', value: stats.employees, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Team Leaders', value: stats.leaders, icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { label: 'Promoted', value: stats.promoted, icon: Award, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ];

    if (activeTab === 'overview') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
            <p className="text-slate-400 mb-8">Platform overview & management</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {statCards.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                                <s.icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                        <div className="text-sm text-slate-400">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="data-table-wrapper glass-card">
                <table className="data-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Score</th><th>Status</th></tr></thead>
                    <tbody>
                        {users.slice(0, 10).map(u => (
                            <tr key={u.id}>
                                <td className="text-white font-bold">{u.name}</td>
                                <td className="text-slate-400 font-mono text-xs">{u.email}</td>
                                <td><span className="badge badge-primary">{u.role}</span></td>
                                <td className="text-slate-500 text-xs uppercase font-black tracking-tighter">{u.department || '—'}</td>
                                <td className="text-white font-black">{u.performance?.overallScore?.toFixed(0) || 0}%</td>
                                <td><span className={`badge ${u.promotionStatus === 'Promoted' ? 'badge-success' : u.promotionStatus === 'Eligible' ? 'badge-warning' : 'badge-primary'}`}>{u.promotionStatus}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (activeTab === 'users') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">User Management</h1>
            <div className="data-table-wrapper glass-card">
                <table className="data-table">
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Points</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="text-white font-bold">{u.name}</td>
                                <td className="text-slate-400 font-mono text-xs">{u.email}</td>
                                <td><span className="badge badge-primary">{u.role}</span></td>
                                <td className="text-slate-500 text-xs uppercase font-black tracking-tighter">{u.department || '—'}</td>
                                <td className="text-amber-400 font-black">{u.points || 0} ⭐</td>
                                <td><span className={`badge ${u.promotionStatus === 'Promoted' ? 'badge-success' : u.promotionStatus === 'Eligible' ? 'badge-warning' : 'badge-primary'}`}>{u.promotionStatus}</span></td>
                                <td>
                                    {u.promotionStatus === 'Pending' && (
                                        <button onClick={() => { API.put(`/users/${u.id}/promotion`, { promotionStatus: 'Promoted' }).then(() => window.location.reload()); }}
                                            className="text-[10px] btn-success py-1.5 px-3 uppercase font-black tracking-widest">Promote</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (activeTab === 'analytics') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Platform Analytics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-white mb-4">Role Distribution</h3>
                    {['Admin', 'HR', 'TeamLeader', 'Employee', 'Chef'].map(r => {
                        const count = users.filter(u => u.role === r).length;
                        const pct = users.length > 0 ? (count / users.length) * 100 : 0;
                        return (
                            <div key={r} className="flex items-center gap-3 mb-3">
                                <span className="text-sm text-slate-400 w-24">{r}</span>
                                <div className="flex-1 h-2 rounded-full bg-slate-700">
                                    <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-purple-500" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-sm text-white w-8">{count}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-white mb-4">Performance Overview</h3>
                    <div className="space-y-3">
                        {users.filter(u => u.role === 'Employee').slice(0, 6).map(u => (
                            <div key={u.id} className="flex items-center gap-3">
                                <span className="text-sm text-slate-300 w-32 truncate">{u.name}</span>
                                <div className="flex-1 h-2 rounded-full bg-slate-700">
                                    <div className={`h-full rounded-full ${(u.performance?.overallScore || 0) >= 80 ? 'bg-emerald-500' : (u.performance?.overallScore || 0) >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${u.performance?.overallScore || 0}%` }} />
                                </div>
                                <span className="text-sm text-white w-12">{(u.performance?.overallScore || 0).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (activeTab === 'cafeteria') return <CafeteriaView />;
    if (activeTab === 'promotions') return <PromotionsManager />;

    return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-4">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <div className="glass-card"><p className="text-slate-400">This section is being configured by the Admin.</p></div>
        </div>
    );
}
