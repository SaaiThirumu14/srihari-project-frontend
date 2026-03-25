import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Users, ListTodo, CalendarCheck, FileBarChart, Award, Heart, Plus, Send, ArrowRight } from 'lucide-react';

export default function TeamLeaderDashboard({ activeTab }) {
    const { user } = useAuth();
    const [team, setTeam] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', difficulty: 'Medium', deadline: '' });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        API.get('/users').then(r => setTeam(r.data)).catch(() => {});
        API.get('/tasks').then(r => setTasks(r.data)).catch(() => {});
        API.get(`/survey/department?department=${user?.department || ''}`).then(r => setSurveys(r.data.surveys || [])).catch(() => {});
    }, []);

    const createTask = async () => {
        if (!taskForm.title || !taskForm.assignedTo) return;
        await API.post('/tasks', taskForm);
        const r = await API.get('/tasks');
        setTasks(r.data);
        setShowForm(false);
    };

    const forwardSurvey = async (surveyId) => {
        await API.post(`/survey/forward/${surveyId}`);
        const r = await API.get(`/survey/department?department=${user?.department || ''}`);
        setSurveys(r.data.surveys || []);
    };

    if (activeTab === 'overview') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-1">Team Leader Dashboard</h1>
            <p className="text-slate-400 mb-8">Manage your team</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Team Size', value: team.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'Completed').length, icon: ListTodo, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Completed', value: tasks.filter(t => t.status === 'Completed').length, icon: CalendarCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Promo Eligible', value: team.filter(u => u.promotionStatus === 'Eligible').length, icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                        <div className="text-sm text-slate-400">{s.label}</div>
                    </div>
                ))}
            </div>
            <div className="glass-card">
                <h3 className="text-lg font-semibold text-white mb-4">Team</h3>
                {team.map(m => (
                    <div key={m._id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">{m.name.charAt(0)}</div>
                            <div><div className="text-sm text-white">{m.name}</div><div className="text-xs text-slate-400">{m.department}</div></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-white">{(m.performance?.overallScore || 0).toFixed(0)}%</span>
                            <span className={`badge ${m.promotionStatus === 'Eligible' ? 'badge-warning' : m.promotionStatus === 'Promoted' ? 'badge-success' : 'badge-primary'}`}>{m.promotionStatus}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (activeTab === 'tasks') return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Tasks</h1>
                <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />New Task</button>
            </div>
            {showForm && (
                <div className="glass-card mb-8 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" className="premium-input text-sm" />
                        <select value={taskForm.assignedTo} onChange={e => setTaskForm(p => ({ ...p, assignedTo: e.target.value }))} className="premium-input text-sm">
                            <option value="" className="bg-surface-900">Assign to...</option>
                            {team.map(m => <option key={m._id} value={m._id} className="bg-surface-900">{m.name}</option>)}
                        </select>
                        <select value={taskForm.difficulty} onChange={e => setTaskForm(p => ({ ...p, difficulty: e.target.value }))} className="premium-input text-sm">
                            <option value="Easy" className="bg-surface-900">Easy</option><option value="Medium" className="bg-surface-900">Medium</option><option value="Hard" className="bg-surface-900">Hard</option>
                        </select>
                        <input type="date" value={taskForm.deadline} onChange={e => setTaskForm(p => ({ ...p, deadline: e.target.value }))} className="premium-input text-sm" />
                    </div>
                    <button onClick={createTask} className="btn-primary w-full sm:w-auto px-10 py-3 uppercase font-black text-xs tracking-widest">Deploy Task</button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['Todo', 'InProgress', 'Completed'].map(st => (
                    <div key={st} className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{st}</h3>
                        {tasks.filter(t => t.status === st).map(t => (
                            <div key={t._id} className="glass-card !p-5 group hover:bg-white/[0.02] transition-colors">
                                <div className="text-sm font-bold text-white mb-2">{t.title}</div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{t.assignedTo?.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono tracking-widest">{t.difficulty}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    if (activeTab === 'surveys') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Surveys</h1>
            <div className="data-table-wrapper glass-card">
                {surveys.length === 0 ? <p className="text-slate-400 text-center py-20 uppercase font-black tracking-widest opacity-20">No data archived</p> :
                <table className="data-table"><thead><tr><th>Employee</th><th>Score</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>{surveys.map(s => (
                        <tr key={s._id}>
                            <td className="text-white font-bold">{s.employeeName}</td>
                            <td className={`font-mono font-black ${s.percentageScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{s.percentageScore?.toFixed(0)}%</td>
                            <td>{s.forwardedToHR ? <span className="badge badge-success">Forwarded</span> : <span className="badge badge-warning">Pending</span>}</td>
                            <td>{!s.forwardedToHR && <button onClick={() => forwardSurvey(s._id)} className="text-[10px] btn-primary py-2 px-4 uppercase font-black tracking-widest">Forward</button>}</td>
                        </tr>
                    ))}</tbody>
                </table>}
            </div>
        </div>
    );

    return <div className="animate-fade-in"><h1 className="text-2xl font-bold text-white mb-4">{activeTab}</h1><div className="glass-card"><p className="text-slate-400">Coming soon.</p></div></div>;
}
