import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Brain, Users, CalendarCheck, FileBarChart, MessageSquare, Bot, BarChart3, AlertTriangle, CheckCircle, Clock, Send, TrendingUp, Sparkles, Heart, UtensilsCrossed, Plus, Trash2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import CafeteriaView from '../components/CafeteriaView';
import PromotionsManager from '../components/PromotionsManager';

export default function HRDashboard({ activeTab, setActiveTab }) {
    const { user } = useAuth();
    const [data, setData] = useState({ attendance: [], leaves: [], surveys: [], predictions: [], chats: [], stats: {}, wellness: [], wellnessStats: {} });
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [forecastData, setForecastData] = useState(null);
    const [heatmap, setHeatmap] = useState([]);
    const [simulating, setSimulating] = useState(null);
    const [loadingChat, setLoadingChat] = useState(false);
    const [predictingId, setPredictingId] = useState(null);
    const [polls, setPolls] = useState([]);
    const [pollForm, setPollForm] = useState({ question: '', options: '', endDate: '' });
    const [showPollForm, setShowPollForm] = useState(false);


    useEffect(() => {
        Promise.all([
            API.get('/attendance/all').catch(() => ({ data: [] })),
            API.get('/leave/all').catch(() => ({ data: [] })),
            API.get('/survey/hr/all').catch(() => ({ data: { surveys: [] } })),
            API.get('/ai/predictions/all').catch(() => ({ data: { predictions: [] } })),
            API.get('/chat').catch(() => ({ data: { chats: [] } })),
            API.get('/ai/stats').catch(() => ({ data: {} })),
            API.get('/wellness/analytics').catch(() => ({ data: { data: [], analytics: {} } })),
            API.get('/ai/heatmap').catch(() => ({ data: { heatmap: [] } })),
            API.get('/food/polls').catch(() => ({ data: [] })),
        ]).then(([att, lv, sv, pr, ch, st, wl, hm, pl]) => {
            setData({ 
                attendance: att.data, 
                leaves: lv.data, 
                surveys: sv.data.surveys || [], 
                predictions: pr.data.predictions || [], 
                chats: ch.data.chats || [], 
                stats: st.data,
                wellness: wl.data.data || [],
                wellnessStats: wl.data.analytics || {}
            });
            setHeatmap(hm.data.heatmap || []);
            setPolls(Array.isArray(pl.data) ? pl.data.map(p => ({...p, options: typeof p.options === 'string' ? JSON.parse(p.options) : p.options})) : []);
        });
    }, []);

    const runPrediction = async (surveyId) => {
        setPredictingId(surveyId);
        try {
            await API.post(`/ai/predict/${surveyId}`);
            const r = await API.get('/ai/predictions/all');
            setData(prev => ({ ...prev, predictions: r.data.predictions || [] }));
            alert('✅ AI Analysis Complete! View results in the "AI Risk Analysis" tab.');
        } catch (err) {
            alert('❌ AI Prediction failed. Please check the backend logs or Gemini API key.');
        }
        setPredictingId(null);
    };

    const askAI = async () => {
        if (!aiQuery.trim()) return;
        setAiResponse('Thinking...');
        try {
            const r = await API.post('/ai/chat', { query: aiQuery });
            setAiResponse(r.data.response);
        } catch { setAiResponse('AI unavailable. Please check your Gemini API key.'); }
    };

    const loadForecast = async () => {
        try {
            const r = await API.get('/ai/forecast');
            setForecastData(r.data);
        } catch {}
    };

    const runSimulation = async (surveyId, salary, stress) => {
        setSimulating(surveyId);
        try {
            const r = await API.post('/ai/simulate', { surveyId, salaryAdjustment: Number(salary), stressReduction: Number(stress) });
            alert(`Simulation Results:\n- Original Risk: ${r.data.originalScore}%\n- New Risk: ${r.data.simulatedScore}%\n- Reduction: ${r.data.riskReduction}%\n\nStrategic Recommendation: ${r.data.recommendation}`);
            const pr = await API.get('/ai/predictions/all');
            setData(prev => ({ ...prev, predictions: pr.data.predictions || [] }));
        } catch (err) { alert('Simulation failed'); }
        setSimulating(null);
    };

    const saveDecision = async (surveyId, decision, notes) => {
        try {
            await API.put(`/ai/decision/${surveyId}`, { hrDecision: decision, hrNotes: notes });
            alert('HR Decision Saved Successfully');
            const pr = await API.get('/ai/predictions/all');
            setData(prev => ({ ...prev, predictions: pr.data.predictions || [] }));
        } catch (err) { alert('Failed to save decision'); }
    };

    const openChat = async (chat) => {
        setSelectedChat(chat);
        setLoadingChat(true);
        try {
            const r = await API.get(`/chat/${chat.employeeId}`);
            let msgs = r.data?.chat?.messages || [];
            if (typeof msgs === 'string') msgs = JSON.parse(msgs);
            setChatMessages(Array.isArray(msgs) ? msgs : []);
            // Refresh chat list to update message counts
            const chatsRes = await API.get('/chat').catch(() => ({ data: { chats: [] } }));
            setData(prev => ({ ...prev, chats: chatsRes.data.chats || [] }));
        } catch (err) {
            console.error('Failed to load chat messages:', err);
            setChatMessages([]);
        }
        setLoadingChat(false);
    };

    const sendHRMessage = async () => {
        if (!chatInput.trim() || !selectedChat) return;
        try {
            const r = await API.post('/chat/send', { employeeId: selectedChat.employeeId, content: chatInput });
            setChatMessages(prev => [...prev, r.data.message]);
            setChatInput('');
            // Update chat list message count
            const chatsRes = await API.get('/chat').catch(() => ({ data: { chats: [] } }));
            setData(prev => ({ ...prev, chats: chatsRes.data.chats || [] }));
        } catch (err) { alert('Failed to send message'); }
    };

    const startChat = (employeeId, employeeName) => {
        openChat({ employeeId, employeeName });
        setActiveTab('chat');
    };

    const handleCreatePoll = async () => {
        try {
            const formattedOptions = pollForm.options.split(',').map((o, i) => ({ id: i+1, label: o.trim(), votes: 0 })).filter(o => o.label);
            await API.post('/food/polls', { question: pollForm.question, options: formattedOptions, endDate: pollForm.endDate });
            const r = await API.get('/food/polls');
            setPolls(Array.isArray(r.data) ? r.data.map(p => ({...p, options: typeof p.options === 'string' ? JSON.parse(p.options) : p.options})) : []);
            setShowPollForm(false);
            setPollForm({ question: '', options: '', endDate: '' });
            alert('✅ Food Poll Published Successfully!');
        } catch(e) { alert('❌ Failed to create poll'); }
    };

    const handleDeletePoll = async (id) => {
        if (!confirm('Are you sure you want to delete this poll?')) return;
        try {
            await API.delete(`/food/polls/${id}`);
            const r = await API.get('/food/polls');
            setPolls(Array.isArray(r.data) ? r.data.map(p => ({...p, options: typeof p.options === 'string' ? JSON.parse(p.options) : p.options})) : []);
        } catch(e) { alert('Failed to delete poll'); }
    };
    // Data Processors for Charts
    const getAttendanceStatusData = () => {
        const statuses = data.attendance.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(statuses).map(key => ({ name: key, value: statuses[key] }));
    };

    const getDailyAttendanceData = () => {
        const byDate = data.attendance.reduce((acc, curr) => {
            const date = new Date(curr.date).toLocaleDateString();
            if (!acc[date]) acc[date] = { Present: 0, Late: 0, Absent: 0 };
            if (curr.status === 'Present') acc[date].Present += 1;
            else if (curr.status === 'Late') acc[date].Late += 1;
            else acc[date].Absent += 1;
            return acc;
        }, {});
        return Object.keys(byDate).slice(0, 7).reverse().map(date => ({ name: date, ...byDate[date] }));
    };

    const getRiskData = () => {
        const risks = data.predictions.reduce((acc, curr) => {
            acc[curr.riskLevel] = (acc[curr.riskLevel] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(risks).map(key => ({ name: key, value: risks[key] }));
    };

    const getDepartmentSurveyData = () => {
        const deptScores = data.surveys.reduce((acc, curr) => {
            if (!acc[curr.department]) acc[curr.department] = { count: 0, sum: 0 };
            acc[curr.department].count += 1;
            acc[curr.department].sum += curr.percentageScore || 0;
            return acc;
        }, {});
        return Object.keys(deptScores).map(dept => ({
            name: dept, avgScore: Math.round(deptScores[dept].sum / deptScores[dept].count)
        }));
    };

    const getWellnessRadarData = () => {
        return [
            { subject: 'Stress', A: data.wellnessStats.avgStress || 0, fullMark: 10 },
            { subject: 'Sleep', A: data.wellnessStats.avgSleep || 0, fullMark: 10 },
            { subject: 'Activity', A: data.wellnessStats.avgActivity || 0, fullMark: 10 }
        ];
    };

    const getAttritionCostData = () => {
        return heatmap.map(h => ({ name: h.id, cost: h.totalCost || 0 }));
    };

    const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
    const RISK_COLORS = { 'Low': '#10b981', 'Medium': '#f59e0b', 'High': '#ef4444' };

    if (activeTab === 'analytics') return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Graph Analytics</h1>
                <p className="text-slate-400">Comprehensive visualization of workforce data, attendance trends, wellness, and attrition risk.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Attendance Status */}
                <div className="glass-card flex flex-col h-[350px]">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <CalendarCheck className="w-4 h-4 text-primary-400" /> Attendance Status
                        </h3>
                    </div>
                    <div className="flex-1 min-h-0 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={getAttendanceStatusData()} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                                    {getAttendanceStatusData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Daily Attendance Trend */}
                <div className="glass-card flex flex-col h-[350px] lg:col-span-2">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" /> Daily Attendance Trend (Last 7 Days)
                        </h3>
                    </div>
                    <div className="flex-1 min-h-0 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={getDailyAttendanceData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickMargin={10} allowDecimals={false} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Line type="monotone" dataKey="Present" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Late" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="Absent" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. AI Prediction Risk Distribution */}
                <div className="glass-card flex flex-col h-[350px]">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" /> Organizational Risk Distribution
                        </h3>
                    </div>
                    <div className="flex-1 min-h-0 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={getRiskData()} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name, value}) => `${name} (${value})`} labelLine={false}>
                                    {getRiskData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#64748b'} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 4. Wellness Averages */}
                <div className="glass-card flex flex-col h-[350px]">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-400" /> Avg Workforce Wellness
                        </h3>
                    </div>
                    <div className="flex-1 min-h-0 pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius={90} data={getWellnessRadarData()}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} max={10} tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Radar name="Average Score" dataKey="A" stroke="#ec4899" fill="#ec4899" fillOpacity={0.4} />
                                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 5. Survey Score by Department */}
                <div className="glass-card flex flex-col h-[350px]">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileBarChart className="w-4 h-4 text-blue-400" /> Avg Satisfaction by Dept
                        </h3>
                    </div>
                    <div className="flex-1 min-h-0 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getDepartmentSurveyData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                                <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickMargin={10} domain={[0, 100]} />
                                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }} />
                                <Bar yAxisId="left" dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Score (%)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 6. Attrition Cost */}
                <div className="glass-card flex flex-col h-[350px] lg:col-span-3">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400" /> Est. Attrition Cost Risk by Department
                        </h3>
                    </div>
                    <div className="flex-1 min-h-0 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={getAttritionCostData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickMargin={10} tickFormatter={(v) => `₹${(v/1000)}k`} />
                                <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '0.5rem' }} formatter={(value) => [`₹${value.toLocaleString()}`, 'Total Cost']} />
                                <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Attrition Cost (₹)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );

    if (activeTab === 'overview') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-1">HR Dashboard</h1>
            <p className="text-slate-400 mb-8">Employee risk analysis & management</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Total Analyzed', value: data.stats.total || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Safe (Stay)', value: data.stats.stay || 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'At Risk', value: data.stats.atRisk || 0, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Leaving', value: data.stats.leave || 0, icon: TrendingUp, color: 'text-red-400', bg: 'bg-red-500/10' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                        <div className="text-sm text-slate-400">{s.label}</div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Leave Requests</h3>
                    {data.leaves.length === 0 ? <p className="text-slate-400 text-sm">No leave requests yet</p> :
                        data.leaves.slice(0, 5).map(l => (
                            <div key={l.id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                                <div>
                                    <div className="text-sm text-white font-medium">{l.employee?.name || l.employeeName || 'Employee'}</div>
                                    <div className="text-xs text-slate-400">{l.reason}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${l.status === 'Approved' ? 'badge-success' : l.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span>
                                    {l.status === 'Pending' && (
                                        <div className="flex gap-1">
                                            <button onClick={() => API.put(`/leave/${l.id}`, { status: 'Approved' }).then(() => window.location.reload())} className="text-xs btn-success py-1 px-2">✓</button>
                                            <button onClick={() => API.put(`/leave/${l.id}`, { status: 'Rejected' }).then(() => window.location.reload())} className="text-xs btn-danger py-1 px-2">✗</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </div>
                <div className="glass-card">
                    <h3 className="text-lg font-semibold text-white mb-4">Forwarded Surveys</h3>
                    {data.surveys.length === 0 ? <p className="text-slate-400 text-sm">No surveys forwarded yet</p> :
                        data.surveys.slice(0, 5).map(s => (
                            <div key={s.id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                                <div>
                                    <div className="text-sm text-white font-medium">{s.employeeName}</div>
                                    <div className="text-xs text-slate-400">{s.department} · Score: {s.percentageScore?.toFixed(0)}%</div>
                                </div>
                                <button 
                                    onClick={() => runPrediction(s.id)} 
                                    disabled={predictingId === s.id}
                                    className={`text-xs btn-primary py-1 px-3 flex items-center gap-1 ${predictingId === s.id ? 'opacity-70' : ''}`}
                                >
                                    {predictingId === s.id ? (
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Brain className="w-3 h-3 inline mr-1" />
                                    )}
                                    {predictingId === s.id ? 'Analyzing...' : 'Run AI'}
                                </button>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );

    if (activeTab === 'attendance') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Attendance Management</h1>
            <div className="data-table-wrapper glass-card">
                <table className="data-table">
                    <thead><tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Anomaly</th><th>Action</th></tr></thead>
                    <tbody>
                        {data.attendance.slice(0, 20).map(a => (
                            <tr key={a.id}>
                                <td className="text-white font-medium">{a.employee?.name || a.employeeName || 'N/A'}</td>
                                <td className="text-slate-400 font-mono text-xs">{new Date(a.date).toLocaleDateString()}</td>
                                <td className="text-slate-300 font-mono text-xs">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—'}</td>
                                <td className="text-slate-300 font-mono text-xs">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</td>
                                <td><span className={`badge ${a.status === 'Present' ? 'badge-success' : a.status === 'Late' ? 'badge-warning' : 'badge-danger'}`}>{a.status}</span></td>
                                <td>{a.anomalyDetected ? <span className="badge badge-danger">⚠ {a.anomalyReason}</span> : <span className="text-[10px] text-slate-500 uppercase font-bold">Normal</span>}</td>
                                <td>
                                    <button onClick={() => startChat(a.employee?.id || a.employeeId, a.employee?.name || a.employeeName)} className="text-primary-400 hover:text-primary-300 p-1">
                                        <MessageSquare className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.attendance.length === 0 && <p className="text-slate-400 text-sm text-center py-20 uppercase tracking-widest font-black opacity-20">No archives available</p>}
            </div>
        </div>
    );

    if (activeTab === 'leaves') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Leave Requests</h1>
            <div className="data-table-wrapper glass-card">
                <table className="data-table">
                    <thead><tr><th>Employee</th><th>From</th><th>To</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {data.leaves.map(l => (
                            <tr key={l.id}>
                                <td className="text-white font-medium">{l.employee?.name || l.employeeName || 'Employee'}</td>
                                <td className="text-slate-400 font-mono text-xs">{new Date(l.startDate).toLocaleDateString()}</td>
                                <td className="text-slate-400 font-mono text-xs">{new Date(l.endDate).toLocaleDateString()}</td>
                                <td className="text-slate-300 text-xs">{l.reason || '—'}</td>
                                <td><span className={`badge ${l.status === 'Approved' ? 'badge-success' : l.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span></td>
                                <td>{l.status === 'Pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => API.put(`/leave/${l.id}`, { status: 'Approved' }).then(() => window.location.reload())} className="text-[10px] btn-success py-1.5 px-3 uppercase font-black">Approve</button>
                                        <button onClick={() => API.put(`/leave/${l.id}`, { status: 'Rejected' }).then(() => window.location.reload())} className="text-[10px] btn-danger py-1.5 px-3 uppercase font-black">Reject</button>
                                    </div>
                                )}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (activeTab === 'surveys') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Churn Surveys</h1>
            <div className="data-table-wrapper glass-card">
                <table className="data-table">
                    <thead><tr><th>Employee</th><th>Department</th><th>Score</th><th>Forwarded</th><th>Action</th></tr></thead>
                    <tbody>
                        {data.surveys.map(s => (
                            <tr key={s.id}>
                                <td className="text-white font-bold">{s.employeeName}</td>
                                <td className="text-slate-400 text-xs">{s.department}</td>
                                <td><span className={`font-mono font-black ${s.percentageScore >= 70 ? 'text-emerald-400' : s.percentageScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{s.percentageScore?.toFixed(0)}%</span></td>
                                <td className="text-slate-500 font-mono text-xs">{new Date(s.forwardedAt).toLocaleDateString()}</td>
                                <td className="flex gap-2">
                                    <button 
                                        onClick={() => runPrediction(s.id)} 
                                        disabled={predictingId === s.id}
                                        className={`text-[10px] btn-primary py-2 px-3 uppercase font-black tracking-widest flex items-center gap-2 ${predictingId === s.id ? 'opacity-70' : ''}`}
                                    >
                                        {predictingId === s.id ? (
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Brain className="w-3.5 h-3.5" />
                                        )}
                                        {predictingId === s.id ? 'Analyzing...' : 'Run AI'}
                                    </button>
                                    <button onClick={() => startChat(s.employeeId, s.employeeName)} className="text-[10px] btn-secondary py-2 px-3 uppercase font-black tracking-widest flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Chat</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (activeTab === 'predictions') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary-400" />
                AI Risk Analysis & Strategic Control
            </h1>

            {/* Departmental Risk Heatmap */}
            <div className="glass-card mb-8 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Organizational Attrition Heatmap
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                    {heatmap.length === 0 ? <p className="text-slate-500 text-xs p-4">No heatmap data yet.</p> : heatmap.map((h, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{h.id || 'Dept'}</div>
                                <div className="flex items-end gap-2 mb-2">
                                    <div className={`text-2xl font-black ${h.avgRisk > 60 ? 'text-red-400' : h.avgRisk > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {Math.round(h.avgRisk)}%
                                    </div>
                                    <div className="text-[10px] text-slate-500 mb-1 opacity-60">AVG RISK</div>
                                </div>
                                <div className="flex gap-3 text-[10px] font-bold text-slate-400">
                                    <span>👥 {h.totalEmployees} STAFF</span>
                                    <span className="text-red-500/80">⚠ {h.highRiskCount} AT RISK</span>
                                </div>
                                <div className="mt-3 text-[10px] text-amber-500/80 font-mono tracking-tighter">
                                    EST. TURNOVER COST: <span className="font-black text-white">₹{(h.totalCost || 0).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${h.avgRisk > 60 ? 'bg-red-500 w-full' : h.avgRisk > 40 ? 'bg-amber-500 w-1/2' : 'bg-emerald-500 w-1/4'}`} />
                        </div>
                    ))}
                </div>
            </div>

            {data.predictions.length === 0 ? <div className="glass-card text-center py-20"><Brain className="w-16 h-16 text-primary-400/20 mx-auto mb-4 animate-pulse" /><p className="text-slate-500 uppercase font-black tracking-widest">No analytic signatures detected.</p></div> :
            <div className="space-y-6">
                {data.predictions.map(p => (
                    <div key={p.id} className="glass-card relative overflow-hidden group border-white/10 hover:border-primary-500/30 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Sparkles className="w-5 h-5 text-primary-400" />
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black bg-gradient-to-br ${p.prediction === 'Stay' ? 'from-emerald-500 to-green-600' : p.prediction === 'At Risk' ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'} shadow-lg shadow-black/20`}>
                                    {p.employeeName?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">{p.employeeName}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-sm text-slate-400">{p.department}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Employee ID: {p.employeeId}</span>
                                        <button onClick={() => startChat(p.employeeId, p.employeeName)} className="ml-2 text-primary-400 hover:scale-110 transition-transform">
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-2 ${
                                    p.prediction === 'Stay' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                    p.prediction === 'At Risk' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                                    'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                    {p.prediction === 'Stay' && <CheckCircle className="w-4 h-4" />}
                                    {p.prediction === 'At Risk' && <AlertTriangle className="w-4 h-4" />}
                                    {p.prediction === 'Leave' && <TrendingUp className="w-4 h-4" />}
                                    {p.prediction} / {p.riskLevel}
                                </div>
                                {p.confidenceScore && <div className="text-[10px] text-slate-500 font-mono">MODEL CONFIDENCE: {p.confidenceScore}%</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                            {[
                                { l: 'LGBM', v: p.lightgbmScore }, 
                                { l: 'C-BST', v: p.catboostScore }, 
                                { l: 'BERT', v: p.bertSentimentScore }, 
                                { l: 'GNN', v: p.gnnScore }, 
                                { l: 'CONSENSUS', v: p.ensembleScore }, 
                                { l: 'LOSS COST', v: `₹${(p.attritionCost || 0).toLocaleString()}`, isCost: true }
                            ].map((m, i) => (
                                <div key={i} className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/5 group-hover:bg-white/[0.05] transition-all">
                                    <div className={`text-xl font-black mb-1 ${m.isCost ? 'text-amber-400' : (m.v <= 35 ? 'text-emerald-400' : m.v <= 65 ? 'text-amber-400' : 'text-red-400')}`}>
                                        {m.v}
                                    </div>
                                    <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{m.l}</div>
                                </div>
                            ))}
                        </div>

                        {p.geminiInsight && (
                            <div className="p-5 rounded-2xl bg-primary-500/5 border border-primary-500/10 mb-6 group hover:bg-primary-500/[0.08] transition-all">
                                <div className="flex items-center gap-2 text-primary-400 text-xs font-black uppercase tracking-widest mb-3">
                                    <Sparkles className="w-4 h-4" /> Strategic AI Synthesis
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed font-medium italic opacity-90">
                                    "{p.geminiInsight}"
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 lg:col-span-1">
                                <div className="text-[10px] font-black text-emerald-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3" /> Retention Roadmap
                                </div>
                                <div className="space-y-3">
                                    {(() => {
                                        const strats = typeof p.retentionStrategies === 'string' ? JSON.parse(p.retentionStrategies) : (p.retentionStrategies || []);
                                        if (strats.length > 0) return strats.map((s, i) => (
                                            <div key={i} className="text-xs text-slate-400 flex items-start gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> 
                                                <span className="leading-tight">{s}</span>
                                            </div>
                                        ));
                                        return <div className="text-xs text-slate-600">No strategies generated.</div>;
                                    })()}
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-primary-500/5 border border-primary-500/10 lg:col-span-1">
                                <div className="text-[10px] font-black text-primary-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <Bot className="w-3.5 h-3.5" /> Retention Simulator
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black mb-2">
                                            <span>Salary Adjust</span>
                                            <span id={`salary-val-${p.id}`} className="text-primary-400">+0%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="100" defaultValue="0" 
                                            id={`salary-${p.surveyId}`}
                                            onChange={e => document.getElementById(`salary-val-${p.id}`).innerText = `+${e.target.value}%`}
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500" 
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black mb-2">
                                            <span>Stress Reduced</span>
                                            <span id={`stress-val-${p.id}`} className="text-primary-400">0pts</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="10" defaultValue="0" 
                                            id={`stress-${p.surveyId}`}
                                            onChange={e => document.getElementById(`stress-val-${p.id}`).innerText = `${e.target.value}pts`}
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary-500" 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => runSimulation(p.surveyId, document.getElementById(`salary-${p.surveyId}`).value, document.getElementById(`stress-${p.surveyId}`).value)}
                                        disabled={simulating === p.surveyId}
                                        className="w-full btn-primary !py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        {simulating === p.surveyId ? <span className="animate-spin text-lg">◌</span> : <><Brain className="w-3.5 h-3.5" /> Run Scenario</>}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/10 lg:col-span-1">
                                <div className="text-[10px] font-black text-rose-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Corrective Action
                                </div>
                                <p className="text-[10px] text-slate-500 mb-4 uppercase leading-relaxed font-bold">Issue demerit points for mitigating risk signatures detected by GNN pattern matching.</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        placeholder="Points" 
                                        id={`demerit-${p.employeeId}`}
                                        className="premium-input !py-2.5 !px-4 !text-sm flex-1 !bg-slate-900/50" 
                                    />
                                    <button 
                                        onClick={async () => {
                                            const amt = document.getElementById(`demerit-${p.employeeId}`).value;
                                            if (!amt) return;
                                            try {
                                                await API.post(`/users/${p.employeeId}/demerits`, { amount: Number(amt), reason: 'Risk Factor Mitigation' });
                                                alert('Action Logged. Points subtracted from employee Flux score.');
                                            } catch (err) { alert('Action failed'); }
                                        }}
                                        className="btn-danger !py-2 px-5 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Issue
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                            <div className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> HR Case Management
                            </div>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Case Decision</label>
                                    <select 
                                        id={`decision-${p.surveyId}`}
                                        defaultValue={p.hrDecision || 'Pending'}
                                        className="premium-input !py-2 !text-sm w-full"
                                    >
                                        <option value="Pending">Pending Assignment</option>
                                        <option value="Under Review">Under Review</option>
                                        <option value="Stay">Retain Employee</option>
                                        <option value="Leave">Process Exit</option>
                                    </select>
                                </div>
                                <div className="flex-[2]">
                                    <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Official HR Notes</label>
                                    <input 
                                        type="text"
                                        id={`notes-${p.surveyId}`}
                                        defaultValue={p.hrNotes || ''}
                                        placeholder="Add context or mitigation details..."
                                        className="premium-input !py-2 !text-sm w-full"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={() => saveDecision(p.surveyId, document.getElementById(`decision-${p.surveyId}`).value, document.getElementById(`notes-${p.surveyId}`).value)}
                                        className="btn-primary !py-2 px-6 text-[10px] font-black uppercase tracking-widest h-[38px]"
                                    >
                                        Save Case
                                    </button>
                                </div>
                            </div>
                            {p.decidedAt && (
                                <div className="mt-3 text-[10px] text-slate-500 uppercase font-black">
                                    Last Updated: {new Date(p.decidedAt).toLocaleString()}
                                </div>
                            )}
                        </div>

                        {(() => {
                            const sim = typeof p.lastSimulation === 'string' ? JSON.parse(p.lastSimulation) : (p.lastSimulation || {});
                            if (!sim.scenario) return null;
                            return (
                                <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]">
                                    <div className="flex gap-4">
                                        <span className="text-slate-500 uppercase font-black">Latest Sim: <span className="text-slate-300 font-mono tracking-tighter ml-1">{sim.scenario}</span></span>
                                        <span className="text-slate-500 uppercase font-black">Score Drop: <span className="text-emerald-400 font-mono ml-1">-{sim.improvement}%</span></span>
                                    </div>
                                    <div className="text-slate-600 font-bold uppercase tracking-widest">Processed by DeepMind Ensembles</div>
                                </div>
                            );
                        })()}
                    </div>
                ))}
            </div>}
        </div>
    );

    if (activeTab === 'chatbot') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">AI Assistant <span className="text-sm font-normal text-primary-400">(Gemini 2.5)</span></h1>
            <div className="glass-card">
                <div className="min-h-[300px] mb-4 p-4 rounded-xl bg-slate-800/50">
                    {aiResponse ? <p className="text-slate-200 whitespace-pre-wrap">{aiResponse}</p> : <p className="text-slate-500 text-center mt-20">Ask me anything about HR policies, attendance, or workforce analytics!</p>}
                </div>
                <div className="flex gap-2">
                    <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && askAI()} placeholder="Ask about leave policy, attendance trends..." className="input-field flex-1" />
                    <button onClick={askAI} className="btn-primary px-6"><Send className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );

    if (activeTab === 'forecast') {
        if (!forecastData) loadForecast();
        return (
            <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-white mb-6">Workforce Forecast <span className="text-sm font-normal text-primary-400">(Gemini 2.5)</span></h1>
                <div className="glass-card">
                    {!forecastData ? <p className="text-slate-400 text-center py-10">Loading forecast...</p> : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
                                {(forecastData.forecast || []).map((d, i) => (
                                    <div key={i} className="text-center p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{d.day}</div>
                                        <div className={`text-2xl font-black ${d.predictedAttendance > 90 ? 'text-emerald-400' : d.predictedAttendance > 80 ? 'text-amber-400' : d.predictedAttendance > 0 ? 'text-red-400' : 'text-slate-600'}`}>
                                            {d.predictedAttendance > 0 ? `${d.predictedAttendance}%` : '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {forecastData.insight && <p className="text-sm text-slate-300 p-4 rounded-xl bg-primary-500/5 border border-primary-500/15">{forecastData.insight}</p>}
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (activeTab === 'chat') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <MessageSquare className="w-7 h-7 text-primary-400" /> HR Chat Center
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card lg:col-span-1">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Conversations ({data.chats.length})
                    </h3>
                    {data.chats.length === 0 ? (
                        <div className="text-center py-10">
                            <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">No conversations yet.</p>
                            <p className="text-xs text-slate-600 mt-1">Employees can start a chat from their dashboard.</p>
                        </div>
                    ) : data.chats.map(c => {
                        const msgs = typeof c.messages === 'string' ? JSON.parse(c.messages) : (c.messages || []);
                        const unread = msgs.filter(m => m.sender === 'employee' && !m.read).length;
                        return (
                            <button key={c.id} onClick={() => openChat(c)}
                                className={`w-full text-left p-3 rounded-xl mb-2 transition-all flex items-center justify-between ${
                                    selectedChat?.id === c.id 
                                    ? 'bg-primary-500/20 border border-primary-500/30' 
                                    : 'bg-slate-800/40 hover:bg-slate-800/80 border border-transparent'
                                }`}>
                                <div>
                                    <div className="text-sm text-white font-bold">{c.employeeName}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{msgs.length} messages</div>
                                </div>
                                {unread > 0 && (
                                    <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                        {unread}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="glass-card lg:col-span-2 flex flex-col">
                    {!selectedChat ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                            <MessageSquare className="w-14 h-14 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-400 font-semibold">Select a conversation</p>
                            <p className="text-xs text-slate-600 mt-1">Click on an employee's name in the list to open their chat</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                                    {selectedChat.employeeName?.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{selectedChat.employeeName}</div>
                                    <div className="text-xs text-slate-500">Employee ID: {selectedChat.employeeId}</div>
                                </div>
                            </div>
                            <div className="h-[400px] overflow-y-auto space-y-3 mb-4 p-3 rounded-xl bg-slate-800/30">
                                {loadingChat ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-slate-500 text-sm animate-pulse">Loading messages...</div>
                                    </div>
                                ) : chatMessages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-slate-600 text-sm">No messages yet. Start the conversation!</p>
                                    </div>
                                ) : chatMessages.map((m, i) => (
                                    <div key={i} className={`flex ${m.sender === 'hr' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm leading-relaxed ${
                                            m.sender === 'hr' 
                                            ? 'bg-primary-500 text-white rounded-br-sm' 
                                            : 'bg-slate-700 text-slate-200 rounded-bl-sm'
                                        }`}>
                                            {m.content}
                                            <div className="text-[10px] opacity-50 mt-1">
                                                {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    value={chatInput} 
                                    onChange={e => setChatInput(e.target.value)} 
                                    placeholder="Type a message to employee..." 
                                    className="input-field flex-1"
                                    onKeyDown={e => e.key === 'Enter' && sendHRMessage()}
                                />
                                <button onClick={sendHRMessage} className="btn-primary px-4">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );


    if (activeTab === 'wellness') return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Wellness & Mood Analytics</h1>
                <p className="text-slate-400">Holistic monitoring of workforce emotional health and physical well-being.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                    { label: 'Stress Index', value: (data.wellnessStats.avgStress || 0).toFixed(1), icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                    { label: 'Sleep Quality', value: (data.wellnessStats.avgSleep || 0).toFixed(1), icon: Sparkles, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Activity Goal', value: (data.wellnessStats.avgActivity || 0).toFixed(1), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Total Logs', value: data.wellnessStats.count || 0, icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                        <div className="text-xs text-slate-500 uppercase font-black tracking-tighter mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4" /> Behavioral Snapshot Logs
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr className="bg-slate-900/50">
                                <th>Employee</th>
                                <th>Real-Time Mood</th>
                                <th>Stress / Sleep</th>
                                <th>Steps / Water</th>
                                <th>AI Sentiment Analysis</th>
                                <th>Context Log</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.wellness.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-20 text-slate-500">No organizational wellness data recorded yet.</td></tr>
                            ) : data.wellness.map(w => (
                                <tr key={w.id} className="hover:bg-white/[0.01] transition-colors">
                                    <td>
                                        <div className="font-bold text-slate-200">{w.employee?.name || w.employeeName || 'Unknown'}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{w.employee?.department || '—'}</div>
                                    </td>
                                    <td>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-lg ${
                                            w.mood === 'Happy' ? 'bg-emerald-500' : w.mood === 'Sad' ? 'bg-indigo-500' : w.mood === 'Anxious' ? 'bg-amber-500' : 'bg-slate-600'
                                        }`}>
                                            {w.mood}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <span className="text-rose-400 font-mono text-xs">S:{w.stressLevel}</span>
                                            <span className="text-blue-400 font-mono text-xs">P:{w.sleepQuality}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-xs text-slate-400">👣 {w.steps} / 💧 {w.hydration}</div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] font-bold uppercase ${w.sentiment === 'Positive' ? 'text-emerald-400' : w.sentiment === 'Negative' ? 'text-rose-400' : 'text-amber-400'}`}>
                                                {w.sentiment} Analysis
                                            </span>
                                            <div className="text-[10px] text-slate-500 leading-tight italic truncate max-w-[200px]" title={w.geminiAdvice}>
                                                "{w.geminiAdvice || 'System processing...'}"
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-[10px] text-slate-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    if (activeTab === 'cafeteria') return (
        <div className="animate-fade-in space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Cafeteria & Food Polls</h1>
                    <p className="text-slate-400">Manage employee food choices and kitchen feedback.</p>
                </div>
                <button onClick={() => setShowPollForm(!showPollForm)} className="btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Food Poll
                </button>
            </div>

            {showPollForm && (
                <div className="glass-card p-6 border-primary-500/30">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Create New Consensus Poll</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input value={pollForm.question} onChange={e => setPollForm(p => ({...p, question: e.target.value}))} placeholder="Poll Question (e.g. Next week's special?)" className="premium-input text-sm md:col-span-2" />
                        <input value={pollForm.options} onChange={e => setPollForm(p => ({...p, options: e.target.value}))} placeholder="Options (comma separated, e.g. Pizza, Salad, Pasta)" className="premium-input text-sm" />
                        <input type="date" value={pollForm.endDate} onChange={e => setPollForm(p => ({...p, endDate: e.target.value}))} className="premium-input text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCreatePoll} className="btn-primary px-10 py-3 uppercase font-black text-xs tracking-widest flex-1 md:flex-none">Publish Poll</button>
                        <button onClick={() => setShowPollForm(false)} className="btn-secondary px-8 py-3 uppercase font-black text-xs tracking-widest">Cancel</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-amber-400" /> Active Poll Consensus
                    </h3>
                    {(!Array.isArray(polls) || polls.length === 0) ? (
                        <div className="text-center py-10">
                            <UtensilsCrossed className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm italic">No active polls created yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {polls.map(p => (
                                <div key={p.id} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 relative group">
                                    <button onClick={() => handleDeletePoll(p.id)} className="absolute top-4 right-4 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <h4 className="text-sm font-bold text-white mb-4 pr-8 tracking-tight">{p.question}</h4>
                                    <div className="space-y-4">
                                        {Array.isArray(p.options) && p.options.map(o => {
                                            const total = p.options.reduce((s, opt) => s + (opt.votes || 0), 0) || 1;
                                            const pct = (((o.votes || 0) / total) * 100).toFixed(0);
                                            return (
                                                <div key={o.id} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-slate-400 font-medium">{o.label}</span>
                                                        <span className="text-white font-bold">{o.votes || 0} votes · {pct}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-1000" 
                                                            style={{ width: `${pct}%` }} 
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-slate-500 flex justify-between items-center font-bold uppercase tracking-widest">
                                        <span>Status: {p.status}</span>
                                        <span>Ends: {p.endDate || 'N/A'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="glass-card">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-400" /> Employee Dish Suggestions
                    </h3>
                    <CafeteriaView readOnly={true} />
                </div>
            </div>
        </div>
    );

    if (activeTab === 'promotions') return <PromotionsManager />;

    return <div className="animate-fade-in"><h1 className="text-2xl font-bold text-white mb-4">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1><div className="glass-card"><p className="text-slate-400">Section under development.</p></div></div>;

}
