import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck, Clock, ListTodo, ClipboardCheck, Heart, UtensilsCrossed, Sparkles, MessageSquare, Send, Star, Award, AlertTriangle } from 'lucide-react';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';

const surveyQuestions = [
    { key: 'workLifeBalance', label: 'Work-Life Balance' }, { key: 'jobSatisfaction', label: 'Job Satisfaction' },
    { key: 'stressLevel', label: 'Stress Level' }, { key: 'relationshipWithTeam', label: 'Team Relationship' },
    { key: 'relationshipWithTL', label: 'Leader Relationship' }, { key: 'managerSupport', label: 'Manager Support' },
    { key: 'careerGrowth', label: 'Career Growth' }, { key: 'compensationSatisfaction', label: 'Compensation' },
    { key: 'workload', label: 'Workload' }, { key: 'recognitionAndRewards', label: 'Recognition' },
    { key: 'companyLoyalty', label: 'Company Loyalty' }, { key: 'mentalHealthSupport', label: 'Mental Health' },
    { key: 'remoteWorkFlexibility', label: 'Remote Work' }, { key: 'learningOpportunities', label: 'Learning' },
    { key: 'communicationClarity', label: 'Communication' }, { key: 'inclusionAndDiversity', label: 'Inclusion' },
    { key: 'workEnvironment', label: 'Work Environment' }, { key: 'overallHappiness', label: 'Overall Happiness' }
];

export default function EmployeeDashboard({ activeTab }) {
    const { user } = useAuth();
    const [livePoints, setLivePoints] = useState(user?.points || 0);
    const [liveDemerits, setLiveDemerits] = useState(user?.demerits || 0);
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [menu, setMenu] = useState([]);
    const [orders, setOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [surveyStatus, setSurveyStatus] = useState({ submitted: false });
    const [surveyForm, setSurveyForm] = useState({ age: '', gender: 'Male', yearsAtCompany: '', responses: {}, additionalComments: '' });
    const [wellnessForm, setWellnessForm] = useState({ stressLevel: 3, sleepQuality: 3, physicalActivity: 3, mood: 'Neutral', notes: '', hydration: 0, steps: 0 });
    const [wellnessResult, setWellnessResult] = useState(null);
    const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    useEffect(() => {
        // Sync Latest User State (Fresh from DB)
        API.get('/auth/me').then(r => {
            setLivePoints(r.data.points || 0);
            setLiveDemerits(r.data.demerits || 0);
        }).catch(() => {});

        // Core data
        API.get('/attendance/history').then(r => setAttendance(r.data)).catch(() => {});
        API.get('/leave/my-leaves').then(r => setLeaves(r.data)).catch(() => {});
        API.get('/tasks').then(r => setTasks(r.data)).catch(() => {});
        API.get('/food/menu').then(r => setMenu(r.data)).catch(() => {});
        API.get('/food/orders').then(r => setOrders(r.data)).catch(() => {});
        API.get('/users/me/points').then(r => setTransactions(r.data)).catch(() => {});
        API.get('/survey/my').then(r => setSurveyStatus(r.data)).catch(() => {});
        API.get(`/chat/${user?._id}`).then(r => setChatMessages(r.data.chat?.messages || [])).catch(() => {});

        // Real-time points channel
        const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
        socket.emit('join_user', user?._id);
        
        socket.on('points_updated', (data) => {
            setLivePoints(data.points);
            // Refresh transactions to show the new line
            API.get('/users/me/points').then(r => setTransactions(r.data));
            // Alert user of the gain/loss
            console.log(`✨ Flux Points Updated: ${data.amount} for ${data.reason}`);
        });

        return () => socket.disconnect();
    }, [user?._id]);

    const checkIn = async () => { await API.post('/attendance/checkin', { location: 'Office', device: navigator.userAgent.substring(0, 30) }); API.get('/attendance/history').then(r => setAttendance(r.data)); };
    const checkOut = async () => { await API.post('/attendance/checkout'); API.get('/attendance/history').then(r => setAttendance(r.data)); };

    if (activeTab === 'overview') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-1">Hello, {user?.name} 👋</h1>
            <p className="text-slate-400 mb-8">Your workspace at a glance</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5 mb-8">
                {[
                    { label: 'Flux Score', value: livePoints, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10', suffix: '⭐' },
                    { label: 'Demerits', value: liveDemerits, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', suffix: '⚠' },
                    { label: 'Performance', value: (user?.performance?.overallScore || 0).toFixed(0), icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10', suffix: '%' },
                    { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'Completed').length, icon: ListTodo, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Promotion', value: user?.promotionStatus || 'None', icon: Star, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((s, i) => (
                    <motion.div key={i} layout className="stat-card group relative p-4 md:p-5">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                        <motion.div 
                            key={s.value} 
                            initial={{ scale: 1.2, color: '#f59e0b' }} 
                            animate={{ scale: 1, color: '#ffffff' }}
                            className="text-xl md:text-2xl font-bold text-white"
                        >
                            {s.value}{s.suffix}
                        </motion.div>
                        <div className="text-[10px] md:text-sm text-slate-400">{s.label}</div>
                    </motion.div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="flex gap-3"><button onClick={checkIn} className="btn-success flex-1">Check In</button><button onClick={checkOut} className="btn-secondary flex-1">Check Out</button></div>
                </div>
                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-white mb-4">My Tasks</h3>
                    {tasks.slice(0, 3).map(t => (
                        <div key={t._id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                            <span className="text-sm text-white">{t.title}</span>
                            <span className={`badge ${t.status === 'Completed' ? 'badge-success' : t.status === 'InProgress' ? 'badge-warning' : 'badge-primary'}`}>{t.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (activeTab === 'attendance') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Attendance</h1>
            <div className="flex gap-4 mb-6"><button onClick={checkIn} className="btn-success px-8 py-3 text-lg">⏰ Check In</button><button onClick={checkOut} className="btn-secondary px-8 py-3 text-lg">🏁 Check Out</button></div>
            <div className="data-table-wrapper glass-card">
                <table className="data-table"><thead><tr><th>Date</th><th>In</th><th>Out</th><th>Status</th></tr></thead>
                    <tbody>{attendance.slice(0, 15).map(a => (
                        <tr key={a._id}><td className="text-slate-300 font-mono text-xs">{new Date(a.date).toLocaleDateString()}</td>
                            <td className="text-white font-mono text-xs">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—'}</td>
                            <td className="text-white font-mono text-xs">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</td>
                            <td><span className={`badge ${a.status === 'Present' ? 'badge-success' : 'badge-warning'}`}>{a.status}</span></td>
                        </tr>))}</tbody></table>
            </div>
        </div>
    );

    if (activeTab === 'leaves') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">My Leaves</h1>
            <div className="glass-card mb-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Apply for Leave</h3>
                <div className="grid grid-cols-3 gap-4 mb-3">
                    <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm(p => ({ ...p, startDate: e.target.value }))} className="input-field" />
                    <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm(p => ({ ...p, endDate: e.target.value }))} className="input-field" />
                    <input value={leaveForm.reason} onChange={e => setLeaveForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason" className="input-field" />
                </div>
                <button onClick={async () => { await API.post('/leave/apply', leaveForm); API.get('/leave/my-leaves').then(r => setLeaves(r.data)); }} className="btn-primary">Submit</button>
            </div>
            <div className="glass-card">
                {leaves.map(l => (<div key={l._id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                    <div><div className="text-sm text-white">{l.reason || 'No reason'}</div><div className="text-xs text-slate-400">{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</div></div>
                    <span className={`badge ${l.status === 'Approved' ? 'badge-success' : l.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span>
                </div>))}
            </div>
        </div>
    );

    if (activeTab === 'tasks') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">My Tasks</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['Todo', 'InProgress', 'Completed'].map(st => (
                    <div key={st} className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">{st}</h3>
                        {tasks.filter(t => t.status === st).map(t => (
                            <div key={t._id} className="glass-card !p-5 relative group overflow-hidden">
                                <div className="text-sm font-bold text-white mb-2">{t.title}</div>
                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-tighter mb-4">{t.difficulty} · {t.deadline ? new Date(t.deadline).toLocaleDateString() : 'No deadline'}</div>
                                {st !== 'Completed' && (
                                    <button 
                                        onClick={async () => { await API.put(`/tasks/${t._id}`, { status: st === 'Todo' ? 'InProgress' : 'Completed' }); API.get('/tasks').then(r => setTasks(r.data)); }}
                                        className="btn-primary w-full py-2.5 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        {st === 'Todo' ? 'Initialize' : 'Finalize'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    if (activeTab === 'survey') return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Churn Feedback Survey</h1>
                {surveyStatus.submitted && <button onClick={() => setSurveyStatus({ submitted: false })} className="btn-secondary py-2 px-4 text-xs">Retake Survey</button>}
            </div>

            {surveyStatus.submitted ? <div className="glass-card text-center py-20 animate-fade-in"><ClipboardCheck className="w-16 h-16 text-emerald-400 mx-auto mb-4" /><h3 className="text-xl font-bold text-white mb-2">Analysis in Progress</h3><p className="text-slate-400">Your latest feedback is being processed by the Gemini AI Ensemble. HR will be notified of any risk changes.</p></div> :
            <div className="glass-card">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div><label className="text-xs text-slate-500 uppercase font-black ml-1">Current Age</label><input type="number" value={surveyForm.age} onChange={e => setSurveyForm(p => ({ ...p, age: e.target.value }))} placeholder="Age" className="premium-input" /></div>
                    <div><label className="text-xs text-slate-500 uppercase font-black ml-1">Gender Identity</label><select value={surveyForm.gender} onChange={e => setSurveyForm(p => ({ ...p, gender: e.target.value }))} className="premium-input"><option>Male</option><option>Female</option><option>Other</option></select></div>
                    <div><label className="text-xs text-slate-500 uppercase font-black ml-1">Experience (Years)</label><input type="number" value={surveyForm.yearsAtCompany} onChange={e => setSurveyForm(p => ({ ...p, yearsAtCompany: e.target.value }))} placeholder="Years at company" className="premium-input" /></div>
                </div>
                <div className="space-y-4 mb-8">
                    <p className="text-sm text-slate-400 border-b border-slate-800 pb-2 italic">How strongly do you agree with the following statements (1 - Disagree, 10 - Strongly Agree):</p>
                    {surveyQuestions.map(q => (
                    <div key={q.key} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 rounded-xl hover:bg-slate-800/30 transition-all border border-transparent hover:border-slate-700/50">
                        <span className="text-sm font-medium text-slate-300">{q.label}</span>
                        <div className="flex flex-wrap gap-1">{[1,2,3,4,5,6,7,8,9,10].map(v => (
                            <button key={v} onClick={() => setSurveyForm(p => ({...p, responses: {...p.responses, [q.key]: v}}))}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${surveyForm.responses[q.key] === v ? 'bg-primary-500 text-white scale-110 shadow-lg shadow-primary-500/20' : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700'}`}>{v}</button>
                        ))}</div>
                    </div>
                ))}</div>

                <div className="space-y-2 mb-8">
                    <label className="text-xs text-slate-500 uppercase font-black ml-1">Voice Your Thoughts (Sentiment Analysis Bridge)</label>
                    <textarea value={surveyForm.additionalComments} onChange={e => setSurveyForm(p => ({ ...p, additionalComments: e.target.value }))} 
                        placeholder="Detailed feedback helps our AI understand the 'WHY' behind your ratings..." className="premium-input min-h-[140px]" />
                </div>

                <button onClick={async () => { 
                    await API.post('/survey/submit', { ...surveyForm, age: Number(surveyForm.age), yearsAtCompany: Number(surveyForm.yearsAtCompany) }); 
                    setSurveyStatus({ submitted: true });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }} className="btn-primary w-full py-4 text-lg font-bold tracking-widest uppercase">Analyze My Retention Score</button>
            </div>}
        </div>
    );

    if (activeTab === 'wellness') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Wellness Check-in</h1>
            <div className="glass-card mb-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="text-sm text-slate-400 mb-1 block">Hydration (Glasses)</label>
                        <input type="number" value={wellnessForm.hydration} onChange={e => setWellnessForm(p => ({...p, hydration: Number(e.target.value)}))} className="input-field" /></div>
                    <div><label className="text-sm text-slate-400 mb-1 block">Daily Steps</label>
                        <input type="number" value={wellnessForm.steps} onChange={e => setWellnessForm(p => ({...p, steps: Number(e.target.value)}))} className="input-field" /></div>
                </div>
                <textarea value={wellnessForm.notes} onChange={e => setWellnessForm(p => ({...p, notes: e.target.value}))} placeholder="How are you feeling today?" className="input-field mb-4" rows={2} />
                <button onClick={async () => { const r = await API.post('/wellness', wellnessForm); setWellnessResult(r.data.entry); }} className="btn-primary">Submit Check-in (+10 pts)</button>
            </div>
            {wellnessResult?.geminiAdvice && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card"><div className="flex items-center gap-2 text-primary-300 font-semibold mb-2"><Sparkles className="w-4 h-4" /> AI Wellness Advice</div><p className="text-slate-300 text-sm">{wellnessResult.geminiAdvice}</p></div>
                    <div className="glass-card"><div className="flex items-center gap-2 text-emerald-300 font-semibold mb-2"><UtensilsCrossed className="w-4 h-4" /> AI Nutrition Link</div><p className="text-slate-300 text-sm">{wellnessResult.nutritionRecommendation}</p></div>
                </div>
            )}
        </div>
    );

    if (activeTab === 'cafeteria') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Smart Cafeteria 🍱</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {menu.filter(m => m.available).map(item => (
                    <div key={item._id} className="glass-card">
                        <div className="flex items-start justify-between mb-2">
                            <div><div className="font-semibold text-white">{item.name}</div><div className="text-xs text-slate-400">{item.category} · {item.calories} cal</div></div>
                            <span className="text-lg font-bold text-emerald-400">₹{item.price}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                        <button onClick={async () => { await API.post('/food/orders', { items: [{ menuItemId: item._id, name: item.name, quantity: 1, price: item.price }], totalPrice: item.price, deliveryTime: '30 mins', deliveryLocation: 'Desk' }); API.get('/food/orders').then(r => setOrders(r.data)); }}
                            className="btn-primary w-full text-sm py-2">Order Now</button>
                    </div>
                ))}
            </div>
            <div className="glass-card"><h3 className="text-lg font-semibold text-white mb-3">My Orders</h3>
                {orders.length === 0 ? <p className="text-slate-400 text-sm">No orders yet</p> :
                orders.slice(0, 5).map(o => (
                    <div key={o._id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                        <div><div className="text-sm text-white">{o.items?.map(i => i.name).join(', ')}</div><div className="text-xs text-slate-400">₹{o.totalPrice}</div></div>
                        <span className={`badge ${o.status === 'Delivered' ? 'badge-success' : o.status === 'Ready' ? 'badge-warning' : 'badge-primary'}`}>{o.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    if (activeTab === 'rewards') return (
        <div className="animate-fade-in">
            <div className="stat-card mb-8 text-center bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 shadow-[0_0_50px_-12px_rgba(245,158,11,0.2)]">
                <motion.div 
                    key={livePoints}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-black text-amber-400 mb-2"
                >
                    {livePoints}
                </motion.div>
                <div className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] font-mono">Current Flux Balance ⭐</div>
            </div>
            <div className="glass-card"><h3 className="text-lg font-semibold text-white mb-3">Transaction History</h3>
                {transactions.map(t => (
                    <div key={t._id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                        <div><div className="text-sm text-white">{t.description}</div><div className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</div></div>
                        <span className={`font-bold ${t.type === 'Credit' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'Credit' ? '+' : '-'}{t.amount}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    if (activeTab === 'chat') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Chat with HR</h1>
            <div className="glass-card">
                <div className="h-[400px] overflow-y-auto space-y-3 mb-4 p-3 rounded-xl bg-slate-800/30">
                    {chatMessages.length === 0 ? <p className="text-slate-500 text-center mt-40">Start a conversation with HR</p> :
                    chatMessages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender === 'employee' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${m.sender === 'employee' ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-200'}`}>{m.content}</div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message HR..." className="input-field flex-1"
                        onKeyDown={e => { if (e.key === 'Enter' && chatInput.trim()) { API.post('/chat/send', { employeeId: user?._id, content: chatInput }).then(r => { setChatMessages(prev => [...prev, r.data.message]); setChatInput(''); }); }}} />
                    <button onClick={() => { if (chatInput.trim()) API.post('/chat/send', { employeeId: user?._id, content: chatInput }).then(r => { setChatMessages(prev => [...prev, r.data.message]); setChatInput(''); }); }} className="btn-primary px-4"><Send className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );

    return <div className="animate-fade-in"><div className="glass-card"><p className="text-slate-400">Coming soon.</p></div></div>;
}
