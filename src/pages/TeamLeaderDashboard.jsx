import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Users, ListTodo, CalendarCheck, FileBarChart, Award, Heart, Plus, Send, ArrowRight, LogOut } from 'lucide-react';
import PromotionsManager from '../components/PromotionsManager';

export default function TeamLeaderDashboard({ activeTab }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [team, setTeam] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', difficulty: 'Medium', deadline: '' });
    const [showForm, setShowForm] = useState(false);
    const [shoutoutModal, setShoutoutModal] = useState({ isOpen: false, member: null, message: '' });
    const [evaluationModal, setEvaluationModal] = useState({ isOpen: false, member: null, scores: { workCapability: 5, timeManagement: 5, problemSolving: 5 } });
    const [teamAttendance, setTeamAttendance] = useState([]);

    const fetchTeam = () => {
        API.get('/users').then(r => {
            const users = Array.isArray(r.data) ? r.data.map(u => ({
                ...u,
                performance: typeof u.performance === 'string' ? JSON.parse(u.performance) : u.performance
            })) : [];
            setTeam(users.filter(u => 
                u.department?.trim().toLowerCase() === user?.department?.trim().toLowerCase()
            ));
        }).catch(() => {});
    };

    useEffect(() => {
        fetchTeam();
        API.get('/tasks').then(r => setTasks(r.data)).catch(() => {});
        API.get(`/survey/department?department=${user?.department || ''}`).then(r => setSurveys(r.data.surveys || [])).catch(() => {});
        API.get('/attendance/all').then(r => {
            const list = r.data || [];
            setTeamAttendance(list.filter(a => 
                a.employee?.department?.trim().toLowerCase() === user?.department?.trim().toLowerCase()
            ));
        }).catch(() => {});
    }, [user?.department]);

    const handleEvaluate = async () => {
        if (!evaluationModal.member) return;
        try {
            await API.put(`/users/${evaluationModal.member.id}/performance`, {
                performance: {
                    workCapability: evaluationModal.scores.workCapability,
                    timeManagement: evaluationModal.scores.timeManagement,
                    problemSolving: evaluationModal.scores.problemSolving
                }
            });
            setEvaluationModal({ isOpen: false, member: null, scores: {} });
            fetchTeam();
            alert('✅ Performance evaluation updated successfully!');
        } catch (err) {
            console.error('Failed to evaluate performance', err);
            alert('❌ Evaluation update failed.');
        }
    };

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

    const handleSendShoutout = async () => {
        if (!shoutoutModal.message || !shoutoutModal.member) return;
        try {
            await API.post('/shoutouts', {
                toUserId: shoutoutModal.member.id,
                toUserName: shoutoutModal.member.name,
                message: shoutoutModal.message
            });
            setShoutoutModal({ isOpen: false, member: null, message: '' });
            alert('Shoutout sent successfully!');
        } catch (err) {
            console.error('Failed to send shoutout', err);
            alert('Failed to send shoutout.');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (activeTab === 'overview') return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-bold text-white">Team Leader Dashboard</h1>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all font-bold text-sm uppercase tracking-widest group"
                >
                    <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    Sign Out
                </button>
            </div>
            <p className="text-slate-400 mb-8">Manage your team</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {[
                    { label: 'Team Size', value: team.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'Completed').length, icon: ListTodo, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Completed', value: tasks.filter(t => t.status === 'Completed').length, icon: CalendarCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                        <div className="text-sm text-slate-400">{s.label}</div>
                    </div>
                ))}
            </div>
            <div className="glass-card">
                <h3 className="text-lg font-semibold text-white mb-4">Team Performance & Quick Actions</h3>
                {team.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors px-2 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center text-primary-400 font-black shadow-inner">{m.name.charAt(0)}</div>
                            <div>
                                <div className="text-sm font-bold text-white">{m.name}</div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{m.promotionStatus || 'Normal'} Status</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className={`text-sm font-black ${(m.performance?.overallScore || 0) >= 80 ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {(m.performance?.overallScore || 0).toFixed(0)}%
                                </div>
                                <div className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Performance</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setEvaluationModal({ isOpen: true, member: m, scores: { workCapability: 5, timeManagement: 5, problemSolving: 5 } })}
                                    className="w-9 h-9 rounded-xl bg-surface-800 hover:bg-primary-500/20 text-slate-400 hover:text-primary-400 flex items-center justify-center transition-all border border-white/5 hover:border-primary-500/30"
                                    title="Evaluate Performance"
                                >
                                    <Award className="w-4.5 h-4.5" />
                                </button>
                                <button 
                                    onClick={() => setShoutoutModal({ isOpen: true, member: m, message: '' })}
                                    className="w-9 h-9 rounded-xl bg-surface-800 hover:bg-pink-500/20 text-slate-400 hover:text-pink-400 flex items-center justify-center transition-all border border-white/5 hover:border-pink-500/30"
                                    title={`Send Shoutout to ${m.name}`}
                                >
                                    <Heart className="w-4.5 h-4.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Evaluation Modal */}
            {evaluationModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center animate-fade-in p-4">
                    <div className="glass-card w-full max-w-lg relative border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Evaluate {evaluationModal.member?.name}</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Set performance metrics for eligibility</p>
                            </div>
                            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
                                <Award className="w-6 h-6 text-primary-400" />
                            </div>
                        </div>
                        
                        <div className="space-y-6 mb-8">
                            {[
                                { key: 'workCapability', label: 'Work Capability', color: 'from-blue-500 to-cyan-400' },
                                { key: 'timeManagement', label: 'Time Management', color: 'from-purple-500 to-indigo-400' },
                                { key: 'problemSolving', label: 'Problem Solving', color: 'from-emerald-500 to-teal-400' }
                            ].map(metric => (
                                <div key={metric.key}>
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-xs font-black text-slate-300 uppercase tracking-widest">{metric.label}</label>
                                        <span className="text-sm font-mono font-black text-white bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">{evaluationModal.scores[metric.key]} / 10</span>
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {[1,2,3,4,5,6,7,8,9,10].map(v => (
                                            <button 
                                                key={v}
                                                onClick={() => setEvaluationModal(p => ({ ...p, scores: { ...p.scores, [metric.key]: v } }))}
                                                className={`flex-1 min-w-[32px] h-9 rounded-lg text-xs font-black transition-all border 
                                                    ${evaluationModal.scores[metric.key] === v 
                                                        ? `bg-gradient-to-br ${metric.color} text-white border-transparent shadow-lg scale-110 z-10` 
                                                        : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-300'}`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 mb-6">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Calculated Score</span>
                                <span className={`text-2xl font-black ${((evaluationModal.scores.workCapability + evaluationModal.scores.timeManagement + evaluationModal.scores.problemSolving) / 3 * 10) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {((evaluationModal.scores.workCapability + evaluationModal.scores.timeManagement + evaluationModal.scores.problemSolving) / 3 * 10).toFixed(0)}%
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-end gap-4">
                            <button 
                                onClick={() => setEvaluationModal({ isOpen: false, member: null, scores: {} })}
                                className="px-6 py-2.5 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleEvaluate}
                                className="btn-primary px-8 py-2.5 text-xs font-black uppercase tracking-widest flex items-center gap-2"
                            >
                                <Award className="w-4 h-4" /> Finalize Rating
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {shoutoutModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
                    <div className="glass-card w-full max-w-md relative border border-slate-700/50">
                        <h2 className="text-xl font-bold text-white mb-2">Send Shoutout</h2>
                        <p className="text-sm text-slate-400 mb-6 hover:text-slate-300 transition-colors">Appreciate {shoutoutModal.member?.name} for their great work!</p>
                        
                        <textarea 
                            value={shoutoutModal.message}
                            onChange={e => setShoutoutModal(p => ({ ...p, message: e.target.value }))}
                            className="premium-input w-full h-24 resize-none mb-4 focus:border-pink-500/50 transition-colors bg-surface-900/50"
                            placeholder="Write your appreciation message..."
                        />
                        
                        <div className="flex items-center justify-end gap-3">
                            <button 
                                onClick={() => setShoutoutModal({ isOpen: false, member: null, message: '' })}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSendShoutout}
                                className="btn-primary flex items-center gap-2 px-6 py-2"
                                disabled={!shoutoutModal.message.trim()}
                            >
                                <Send className="w-4 h-4" /> Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
                            {team.map(m => <option key={m.id} value={m.id} className="bg-surface-900">{m.name}</option>)}
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
                            <div key={t.id} className="glass-card !p-5 group hover:bg-white/[0.02] transition-colors">
                                <div className="text-sm font-bold text-white mb-2">{t.title}</div>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{t.assignee?.name || 'Unassigned'}</div>
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
                        <tr key={s.id}>
                            <td className="text-white font-bold">{s.employeeName}</td>
                            <td className={`font-mono font-black ${s.percentageScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{s.percentageScore?.toFixed(0)}%</td>
                            <td>{s.forwardedToHR ? <span className="badge badge-success">Forwarded</span> : <span className="badge badge-warning">Pending</span>}</td>
                            <td>{!s.forwardedToHR && <button onClick={() => forwardSurvey(s.id)} className="text-[10px] btn-primary py-2 px-4 uppercase font-black tracking-widest">Forward</button>}</td>
                        </tr>
                    ))}</tbody>
                </table>}
            </div>
        </div>
    );

    if (activeTab === 'team') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">My Team</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map(m => {
                    const memberTasks = tasks.filter(t => t.assignedTo === m.id);
                    return (
                        <div key={m.id} className="glass-card relative group overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-bl-full pointer-events-none" />
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-primary-500/20">{m.name.charAt(0)}</div>
                                <div>
                                    <div className="text-lg font-bold text-white">{m.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono tracking-widest">{m.email}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Performance</div>
                                    <div className="text-xl font-bold text-emerald-400">{(m.performance?.overallScore || 0).toFixed(0)}%</div>
                                </div>
                                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Active Tasks</div>
                                    <div className="text-xl font-bold text-amber-400">{memberTasks.filter(t => t.status !== 'Completed').length}</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-end border-t border-white/5 pt-4">
                                <button onClick={() => setShoutoutModal({ isOpen: true, member: m, message: '' })} className="text-[10px] btn-primary py-2 px-4 uppercase font-black tracking-widest flex items-center gap-2">
                                    <Heart className="w-3 h-3" /> Shoutout
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {shoutoutModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
                    <div className="glass-card w-full max-w-md relative border border-slate-700/50">
                        <h2 className="text-xl font-bold text-white mb-2">Send Shoutout</h2>
                        <p className="text-sm text-slate-400 mb-6 hover:text-slate-300 transition-colors">Appreciate {shoutoutModal.member?.name} for their great work!</p>
                        
                        <textarea 
                            value={shoutoutModal.message}
                            onChange={e => setShoutoutModal(p => ({ ...p, message: e.target.value }))}
                            className="premium-input w-full h-24 resize-none mb-4 focus:border-pink-500/50 transition-colors bg-surface-900/50"
                            placeholder="Write your appreciation message..."
                        />
                        
                        <div className="flex items-center justify-end gap-3">
                            <button 
                                onClick={() => setShoutoutModal({ isOpen: false, member: null, message: '' })}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSendShoutout}
                                className="btn-primary flex items-center gap-2 px-6 py-2"
                                disabled={!shoutoutModal.message.trim()}
                            >
                                <Send className="w-4 h-4" /> Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (activeTab === 'wellness') {
        const avgScore = surveys.length ? (surveys.reduce((acc, s) => acc + s.percentageScore, 0) / surveys.length).toFixed(0) : 0;
        const criticalScoreCount = surveys.filter(s => s.percentageScore < 50).length;

        return (
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-white mb-6">Team Wellness Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="stat-card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-pink-500/20">
                        <div className="text-3xl font-black text-pink-400">{avgScore}%</div>
                        <div className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Avg Team Wellness</div>
                    </div>
                    <div className="stat-card bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-teal-500/20">
                        <div className="text-3xl font-black text-emerald-400">{surveys.length}</div>
                        <div className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Surveys Completed</div>
                    </div>
                    <div className="stat-card bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                        <div className="text-3xl font-black text-red-400">{criticalScoreCount}</div>
                        <div className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Critical Stress Flags</div>
                    </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-4">Wellness Interventions Required</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {surveys.filter(s => s.percentageScore < 70).map(s => (
                        <div key={s.id} className="glass-card p-4 flex items-center justify-between border-l-4 border-l-amber-500">
                            <div>
                                <h4 className="font-bold text-white text-md">{s.employeeName}</h4>
                                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-black">Score: {s.percentageScore?.toFixed(0)}%</div>
                            </div>
                            <button 
                                onClick={() => setShoutoutModal({ isOpen: true, member: team.find(m => m.name === s.employeeName) || {id: null, name: s.employeeName}, message: 'Hey, I wanted to check in. Please let me know if you need any support or time off!' })}
                                className="btn-primary text-[10px] px-4 py-2 flex items-center gap-2 uppercase font-black"
                            >
                                <Heart className="w-3 h-3" /> Check In
                            </button>
                        </div>
                    ))}
                    {surveys.filter(s => s.percentageScore < 70).length === 0 && (
                        <div className="col-span-1 md:col-span-2 text-center py-10 opacity-50">
                            <Heart className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                            <p className="text-white font-bold tracking-widest uppercase">Team wellness is looking great!</p>
                        </div>
                    )}
                </div>

                {/* Shoutout / Check-In Modal */}
                {shoutoutModal.isOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
                        <div className="glass-card w-full max-w-md relative border border-slate-700/50">
                            <h2 className="text-xl font-bold text-white mb-2">Check In</h2>
                            <p className="text-sm text-slate-400 mb-6 hover:text-slate-300 transition-colors">Send a wellness check-in to {shoutoutModal.member?.name}</p>
                            
                            <textarea 
                                value={shoutoutModal.message}
                                onChange={e => setShoutoutModal(p => ({ ...p, message: e.target.value }))}
                                className="premium-input w-full h-24 resize-none mb-4 focus:border-pink-500/50 transition-colors bg-surface-900/50"
                                placeholder="Write your check-in message..."
                            />
                            
                            <div className="flex items-center justify-end gap-3">
                                <button 
                                    onClick={() => setShoutoutModal({ isOpen: false, member: null, message: '' })}
                                    className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSendShoutout}
                                    className="btn-primary flex items-center gap-2 px-6 py-2"
                                    disabled={!shoutoutModal.message.trim()}
                                >
                                    <Send className="w-4 h-4" /> Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (activeTab === 'attendance') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Team Attendance ({new Date().toLocaleDateString()})</h1>
            <div className="data-table-wrapper glass-card">
                {teamAttendance.length === 0 ? <p className="text-slate-400 text-center py-20 uppercase font-black tracking-widest opacity-20">No attendance data today</p> :
                <table className="data-table"><thead><tr><th>Member</th><th>Date</th><th>In</th><th>Out</th><th>Status</th></tr></thead>
                    <tbody>{teamAttendance.slice(0, 30).map(a => (
                        <tr key={a.id}>
                            <td className="text-white font-bold">{a.employee?.name || 'Unknown'}</td>
                            <td className="text-slate-400 font-mono text-xs">{new Date(a.date).toLocaleDateString()}</td>
                            <td className="text-white font-mono text-xs">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—'}</td>
                            <td className="text-white font-mono text-xs">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</td>
                            <td><span className={`badge ${a.status === 'Present' ? 'badge-success' : a.status === 'Late' ? 'badge-warning' : 'badge-danger'}`}>{a.status}</span></td>
                        </tr>
                    ))}</tbody>
                </table>}
            </div>
        </div>
    );

    if (activeTab === 'promotions') return <PromotionsManager />;

    return <div className="animate-fade-in"><h1 className="text-2xl font-bold text-white mb-4">{activeTab}</h1><div className="glass-card"><p className="text-slate-400">Coming soon.</p></div></div>;
}
