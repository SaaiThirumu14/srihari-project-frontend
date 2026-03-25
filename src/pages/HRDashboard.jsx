import { useState, useEffect } from 'react';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Brain, Users, CalendarCheck, FileBarChart, MessageSquare, Bot, BarChart3, AlertTriangle, CheckCircle, Clock, Send, TrendingUp, Sparkles, Heart } from 'lucide-react';

export default function HRDashboard({ activeTab }) {
    const { user } = useAuth();
    const [data, setData] = useState({ attendance: [], leaves: [], surveys: [], predictions: [], chats: [], stats: {}, wellness: [], wellnessStats: {} });
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [selectedChat, setSelectedChat] = useState(null);
    const [aiQuery, setAiQuery] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [forecastData, setForecastData] = useState(null);

    useEffect(() => {
        Promise.all([
            API.get('/attendance/all').catch(() => ({ data: [] })),
            API.get('/leave/all').catch(() => ({ data: [] })),
            API.get('/survey/hr/all').catch(() => ({ data: { surveys: [] } })),
            API.get('/ai/predictions/all').catch(() => ({ data: { predictions: [] } })),
            API.get('/chat').catch(() => ({ data: { chats: [] } })),
            API.get('/ai/stats').catch(() => ({ data: {} })),
            API.get('/wellness/analytics').catch(() => ({ data: { data: [], analytics: {} } })),
        ]).then(([att, lv, sv, pr, ch, st, wl]) => {
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
        });
    }, []);

    const runPrediction = async (surveyId) => {
        try {
            await API.post(`/ai/predict/${surveyId}`);
            const r = await API.get('/ai/predictions/all');
            setData(prev => ({ ...prev, predictions: r.data.predictions || [] }));
        } catch {}
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
                            <div key={l._id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                                <div>
                                    <div className="text-sm text-white font-medium">{l.employeeId?.name || 'Employee'}</div>
                                    <div className="text-xs text-slate-400">{l.reason}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${l.status === 'Approved' ? 'badge-success' : l.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span>
                                    {l.status === 'Pending' && (
                                        <div className="flex gap-1">
                                            <button onClick={() => API.put(`/leave/${l._id}`, { status: 'Approved' }).then(() => window.location.reload())} className="text-xs btn-success py-1 px-2">✓</button>
                                            <button onClick={() => API.put(`/leave/${l._id}`, { status: 'Rejected' }).then(() => window.location.reload())} className="text-xs btn-danger py-1 px-2">✗</button>
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
                            <div key={s._id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                                <div>
                                    <div className="text-sm text-white font-medium">{s.employeeName}</div>
                                    <div className="text-xs text-slate-400">{s.department} · Score: {s.percentageScore?.toFixed(0)}%</div>
                                </div>
                                <button onClick={() => runPrediction(s._id)} className="text-xs btn-primary py-1 px-3">
                                    <Brain className="w-3 h-3 inline mr-1" />Run AI
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
                    <thead><tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th><th>Anomaly</th></tr></thead>
                    <tbody>
                        {data.attendance.slice(0, 20).map(a => (
                            <tr key={a._id}>
                                <td className="text-white font-medium">{a.employeeId?.name || 'N/A'}</td>
                                <td className="text-slate-400 font-mono text-xs">{new Date(a.date).toLocaleDateString()}</td>
                                <td className="text-slate-300 font-mono text-xs">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : '—'}</td>
                                <td className="text-slate-300 font-mono text-xs">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '—'}</td>
                                <td><span className={`badge ${a.status === 'Present' ? 'badge-success' : a.status === 'Late' ? 'badge-warning' : 'badge-danger'}`}>{a.status}</span></td>
                                <td>{a.anomalyDetected ? <span className="badge badge-danger">⚠ {a.anomalyReason}</span> : <span className="text-[10px] text-slate-500 uppercase font-bold">Normal</span>}</td>
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
                            <tr key={l._id}>
                                <td className="text-white font-medium">{l.employeeId?.name || 'Employee'}</td>
                                <td className="text-slate-400 font-mono text-xs">{new Date(l.startDate).toLocaleDateString()}</td>
                                <td className="text-slate-400 font-mono text-xs">{new Date(l.endDate).toLocaleDateString()}</td>
                                <td className="text-slate-300 text-xs">{l.reason || '—'}</td>
                                <td><span className={`badge ${l.status === 'Approved' ? 'badge-success' : l.status === 'Rejected' ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span></td>
                                <td>{l.status === 'Pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => API.put(`/leave/${l._id}`, { status: 'Approved' }).then(() => window.location.reload())} className="text-[10px] btn-success py-1.5 px-3 uppercase font-black">Approve</button>
                                        <button onClick={() => API.put(`/leave/${l._id}`, { status: 'Rejected' }).then(() => window.location.reload())} className="text-[10px] btn-danger py-1.5 px-3 uppercase font-black">Reject</button>
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
                            <tr key={s._id}>
                                <td className="text-white font-bold">{s.employeeName}</td>
                                <td className="text-slate-400 text-xs">{s.department}</td>
                                <td><span className={`font-mono font-black ${s.percentageScore >= 70 ? 'text-emerald-400' : s.percentageScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{s.percentageScore?.toFixed(0)}%</span></td>
                                <td className="text-slate-500 font-mono text-xs">{new Date(s.forwardedAt).toLocaleDateString()}</td>
                                <td><button onClick={() => runPrediction(s._id)} className="text-[10px] btn-primary py-2 px-4 uppercase font-black tracking-widest flex items-center gap-2"><Brain className="w-3.5 h-3.5" /> Run AI</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (activeTab === 'predictions') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">AI Predictions <span className="text-sm font-normal text-primary-400">(Gemini 2.5 Enhanced)</span></h1>
            {data.predictions.length === 0 ? <div className="glass-card text-center py-10"><Brain className="w-12 h-12 text-primary-400 mx-auto mb-3" /><p className="text-slate-400">No predictions yet. Run AI analysis on forwarded surveys.</p></div> :
            <div className="space-y-4">
                {data.predictions.map(p => (
                    <div key={p._id} className="glass-card relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">{p.employeeName}</h3>
                                <p className="text-sm text-slate-400">{p.department}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`badge text-sm ${p.prediction === 'Stay' ? 'badge-success' : p.prediction === 'At Risk' ? 'badge-warning' : 'badge-danger'}`}>
                                    {p.prediction} · {p.riskLevel}
                                </span>
                                {p.confidenceScore && <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Confidence: {p.confidenceScore}%</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
                            {[{ l: 'LGBM', v: p.lightgbmScore }, { l: 'C-BST', v: p.catboostScore }, { l: 'BERT', v: p.bertSentimentScore }, { l: 'GNN', v: p.gnnScore }, { l: 'CONSENSUS', v: p.ensembleScore }, { l: 'COST', v: `₹${(p.attritionCost || 0).toLocaleString()}`, isCost: true }].map((m, i) => (
                                <div key={i} className="text-center p-3 rounded-xl bg-slate-800/50 border border-white/5">
                                    <div className={`text-lg font-bold ${m.isCost ? 'text-amber-400' : m.v <= 35 ? 'text-emerald-400' : m.v <= 65 ? 'text-amber-400' : 'text-red-400'}`}>{m.v}</div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">{m.l}</div>
                                </div>
                            ))}
                        </div>

                        {p.geminiInsight && (
                            <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/15 mb-4 group hover:bg-primary-500/10 transition-all">
                                <div className="flex items-center gap-2 text-primary-300 text-sm font-semibold mb-2"><Sparkles className="w-4 h-4" /> Strategic AI Analysis</div>
                                <p className="text-sm text-slate-300 leading-relaxed">{p.geminiInsight}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {p.retentionStrategies?.length > 0 && (
                                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                                    <div className="text-xs font-black text-emerald-400 mb-3 uppercase tracking-tighter">Retention Roadmap</div>
                                    <div className="space-y-2">
                                        {p.retentionStrategies.map((s, i) => <div key={i} className="text-xs text-slate-400 flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" /> {s}</div>)}
                                    </div>
                                </div>
                            )}
                            
                            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15">
                                <div className="text-xs font-black text-red-400 mb-3 uppercase tracking-tighter">Behavioral Corrective Action</div>
                                <p className="text-[10px] text-slate-500 mb-3 uppercase">Assign demerit points based on risk survey responses or sentiment analysis.</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="number" 
                                        placeholder="Points" 
                                        id={`demerit-${p.employeeId}`}
                                        className="premium-input !py-1.5 !px-3 !text-sm flex-1" 
                                    />
                                    <button 
                                        onClick={async () => {
                                            const amt = document.getElementById(`demerit-${p.employeeId}`).value;
                                            if (!amt) return;
                                            try {
                                                await API.post(`/users/${p.employeeId}/demerits`, { amount: Number(amt), reason: 'Risk Factor Mitigation' });
                                                alert('Demerits Issued. Points deducted from Flux Score.');
                                            } catch (err) { alert('Action failed'); }
                                        }}
                                        className="btn-danger !py-1 px-4 text-xs font-bold"
                                    >
                                        Issue
                                    </button>
                                </div>
                            </div>
                        </div>
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
            <h1 className="text-2xl font-bold text-white mb-6">HR Chat</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card lg:col-span-1">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">Conversations</h3>
                    {data.chats.length === 0 ? <p className="text-sm text-slate-500">No chats yet</p> : data.chats.map(c => (
                        <button key={c._id} onClick={() => { setSelectedChat(c); setChatMessages(c.messages || []); }}
                            className={`w-full text-left p-3 rounded-xl mb-2 transition-all ${selectedChat?._id === c._id ? 'bg-primary-500/20 border border-primary-500/30' : 'bg-slate-800/40 hover:bg-slate-800/80'}`}>
                            <div className="text-sm text-white font-medium">{c.employeeName}</div>
                            <div className="text-xs text-slate-400">{c.messages?.length || 0} messages</div>
                        </button>
                    ))}
                </div>
                <div className="glass-card lg:col-span-2">
                    {!selectedChat ? <p className="text-slate-400 text-center py-20">Select a conversation</p> : (
                        <>
                            <h3 className="text-lg font-semibold text-white mb-4">Chat with {selectedChat.employeeName}</h3>
                            <div className="h-[400px] overflow-y-auto space-y-3 mb-4 p-3 rounded-xl bg-slate-800/30">
                                {chatMessages.map((m, i) => (
                                    <div key={i} className={`flex ${m.sender === 'hr' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${m.sender === 'hr' ? 'bg-primary-500 text-white' : 'bg-slate-700 text-slate-200'}`}>{m.content}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="input-field flex-1"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && chatInput.trim()) {
                                            API.post('/chat/send', { employeeId: selectedChat.employeeId, content: chatInput }).then(r => {
                                                setChatMessages(prev => [...prev, r.data.message]);
                                                setChatInput('');
                                            });
                                        }
                                    }} />
                                <button onClick={() => {
                                    if (chatInput.trim()) {
                                        API.post('/chat/send', { employeeId: selectedChat.employeeId, content: chatInput }).then(r => {
                                            setChatMessages(prev => [...prev, r.data.message]);
                                            setChatInput('');
                                        });
                                    }
                                }} className="btn-primary px-4"><Send className="w-4 h-4" /></button>
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
                                <tr key={w._id} className="hover:bg-white/[0.01] transition-colors">
                                    <td>
                                        <div className="font-bold text-slate-200">{w.employeeId?.name || 'Unknown'}</div>
                                        <div className="text-[10px] text-slate-500 uppercase">{w.employeeId?.department}</div>
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

    return <div className="animate-fade-in"><h1 className="text-2xl font-bold text-white mb-4">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1><div className="glass-card"><p className="text-slate-400">Section under development.</p></div></div>;

}
