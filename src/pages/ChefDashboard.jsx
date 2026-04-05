import { useState, useEffect } from 'react';
import API from '../utils/api';
import { ChefHat, UtensilsCrossed, Package, BarChart3, Plus, Trash2, Check } from 'lucide-react';

export default function ChefDashboard({ activeTab }) {
    const [menu, setMenu] = useState([]);
    const [orders, setOrders] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [polls, setPolls] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [pollForm, setPollForm] = useState({ question: '', options: '', endDate: '' });
    const [menuForm, setMenuForm] = useState({ name: '', category: 'Lunch', price: '', calories: '', description: '' });
    const [invForm, setInvForm] = useState({ name: '', quantity: '', unit: 'kg', threshold: 10, category: 'Other' });
    const [showMenuForm, setShowMenuForm] = useState(false);
    const [showInvForm, setShowInvForm] = useState(false);
    const [showPollForm, setShowPollForm] = useState(false);

    useEffect(() => {
        const fetchKitchenData = async () => {
            try {
                const [rMenu, rOrd, rInv, rPolls, rSug] = await Promise.all([
                    API.get('/food/menu'),
                    API.get('/food/orders/all'),
                    API.get('/inventory'),
                    API.get('/food/polls'),
                    API.get('/food/suggestions')
                ]);

                setMenu(Array.isArray(rMenu.data) ? rMenu.data : []);
                setInventory(Array.isArray(rInv.data) ? rInv.data : []);
                setSuggestions(Array.isArray(rSug.data) ? rSug.data : []);

                // Robust JSON parsing
                setOrders(Array.isArray(rOrd.data) ? rOrd.data.map(o => ({
                    ...o, 
                    items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || [])
                })) : []);

                setPolls(Array.isArray(rPolls.data) ? rPolls.data.map(p => ({
                    ...p, 
                    options: typeof p.options === 'string' ? JSON.parse(p.options) : (p.options || [])
                })) : []);
            } catch (err) {
                console.error("Chef dashboard fetch failed", err);
            }
        };

        fetchKitchenData();
    }, []);

    const updateOrderStatus = async (id, status) => {
        try {
            await API.put(`/food/orders/${id}`, { status });
            const r = await API.get('/food/orders/all');
            setOrders(Array.isArray(r.data) ? r.data.map(o => ({...o, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items})) : []);
        } catch (e) { console.error("Order update failed", e); }
    };

    if (activeTab === 'overview') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-1">Chef Dashboard 🍳</h1>
            <p className="text-slate-400 mb-8">Kitchen operations overview</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {[
                    { label: 'Menu Items', value: menu.length, icon: UtensilsCrossed, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Pending Orders', value: orders.filter(o => o.status === 'Pending').length, icon: ChefHat, color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: 'Today Delivered', value: orders.filter(o => o.status === 'Delivered').length, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Low Stock', value: inventory.filter(i => i.quantity <= i.threshold).length, icon: Package, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                        <div className="text-sm text-slate-400">{s.label}</div>
                    </div>
                ))}
            </div>
            <div className="glass-card">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
                {orders.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                        <div>
                            <div className="text-sm text-white font-medium">{o.userName}</div>
                            <div className="text-xs text-slate-400">{o.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-emerald-400 font-bold">₹{o.totalPrice}</span>
                            <span className={`badge ${o.status === 'Delivered' ? 'badge-success' : o.status === 'Ready' ? 'badge-warning' : o.status === 'Preparing' ? 'badge-primary' : 'badge-danger'}`}>{o.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (activeTab === 'menu') return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Menu Manager</h1>
                <button onClick={() => setShowMenuForm(!showMenuForm)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>
            </div>
            {showMenuForm && (
                <div className="glass-card mb-8 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <input value={menuForm.name} onChange={e => setMenuForm(p => ({...p, name: e.target.value}))} placeholder="Item name" className="premium-input text-sm" />
                        <select value={menuForm.category} onChange={e => setMenuForm(p => ({...p, category: e.target.value}))} className="premium-input text-sm">
                            <option className="bg-surface-900">Breakfast</option><option className="bg-surface-900">Lunch</option><option className="bg-surface-900">Dinner</option><option className="bg-surface-900">Snacks</option>
                        </select>
                        <input type="number" value={menuForm.price} onChange={e => setMenuForm(p => ({...p, price: e.target.value}))} placeholder="Price (₹)" className="premium-input text-sm" />
                        <input type="number" value={menuForm.calories} onChange={e => setMenuForm(p => ({...p, calories: e.target.value}))} placeholder="Calories" className="premium-input text-sm" />
                        <input value={menuForm.description} onChange={e => setMenuForm(p => ({...p, description: e.target.value}))} placeholder="Description" className="premium-input text-sm sm:col-span-2" />
                    </div>
                    <button onClick={async () => { 
                        try {
                            await API.post('/food/menu', { ...menuForm, price: Number(menuForm.price), calories: Number(menuForm.calories), available: true }); 
                            const r = await API.get('/food/menu');
                            setMenu(Array.isArray(r.data) ? r.data : []);
                            setShowMenuForm(false); 
                        } catch (e) { alert('Failed to add item'); }
                    }} className="btn-primary w-full sm:w-auto px-10 py-3 uppercase font-black text-xs tracking-widest">Publish Item</button>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {menu.map(item => (
                    <div key={item.id} className="glass-card">
                        <div className="flex items-start justify-between mb-2">
                            <div><div className="font-semibold text-white">{item.name}</div><div className="text-xs text-slate-400">{item.category} · {item.calories || 0} cal</div></div>
                            <span className="text-lg font-bold text-emerald-400">₹{item.price}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                        <button onClick={async () => { try { await API.delete(`/food/menu/${item.id}`); const r = await API.get('/food/menu'); setMenu(Array.isArray(r.data) ? r.data : []); } catch(e) {} }}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Remove</button>
                    </div>
                ))}
            </div>
        </div>
    );

    if (activeTab === 'orders') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Live Orders (KDS)</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['Pending', 'Preparing', 'Ready', 'Delivered'].map(status => (
                    <div key={status}>
                        <h3 className={`text-sm font-semibold uppercase mb-3 ${status === 'Pending' ? 'text-red-400' : status === 'Preparing' ? 'text-amber-400' : status === 'Ready' ? 'text-blue-400' : 'text-emerald-400'}`}>{status} ({orders.filter(o => o.status === status).length})</h3>
                        <div className="space-y-3">
                            {orders.filter(o => o.status === status).map(o => (
                                <div key={o.id} className="glass-card !p-4">
                                    <div className="text-sm font-medium text-white mb-1">{o.userName}</div>
                                    <div className="text-xs text-slate-400 mb-2">{o.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</div>
                                    <div className="text-xs text-amber-400 mb-2">₹{o.totalPrice} · {o.deliveryLocation}</div>
                                    {status !== 'Delivered' && (
                                        <button onClick={() => updateOrderStatus(o.id, status === 'Pending' ? 'Preparing' : status === 'Preparing' ? 'Ready' : 'Delivered')}
                                            className="text-xs btn-primary py-1 px-3 w-full">{status === 'Pending' ? 'Start Prep' : status === 'Preparing' ? 'Mark Ready' : 'Deliver'}</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (activeTab === 'inventory') return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Inventory</h1>
                <button onClick={() => setShowInvForm(!showInvForm)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</button>
            </div>
            {showInvForm && (
                <div className="glass-card mb-8 p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <input value={invForm.name} onChange={e => setInvForm(p => ({...p, name: e.target.value}))} placeholder="Name" className="premium-input text-sm" />
                        <input type="number" value={invForm.quantity} onChange={e => setInvForm(p => ({...p, quantity: e.target.value}))} placeholder="Qty" className="premium-input text-sm" />
                        <input value={invForm.unit} onChange={e => setInvForm(p => ({...p, unit: e.target.value}))} placeholder="Unit" className="premium-input text-sm" />
                        <select value={invForm.category} onChange={e => setInvForm(p => ({...p, category: e.target.value}))} className="premium-input text-sm">
                            {['Produce', 'Grains', 'Meat', 'Dairy', 'Spices', 'Other'].map(c => <option key={c} className="bg-surface-900">{c}</option>)}
                        </select>
                    </div>
                    <button onClick={async () => { 
                        try {
                            await API.post('/inventory', { ...invForm, quantity: Number(invForm.quantity) }); 
                            const r = await API.get('/inventory');
                            setInventory(Array.isArray(r.data) ? r.data : []);
                            setShowInvForm(false); 
                        } catch(e) { alert('Failed to update inventory'); }
                    }} className="btn-primary w-full sm:w-auto px-10 py-3 uppercase font-black text-xs tracking-widest">Update Stock</button>
                </div>
            )}
            <div className="data-table-wrapper glass-card">
                <table className="data-table">
                    <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Unit</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{inventory.map(i => (
                        <tr key={i.id}>
                            <td className="text-white font-bold">{i.name}</td>
                            <td className="text-slate-500 text-[10px] uppercase font-black tracking-widest">{i.category}</td>
                            <td className={`font-black font-mono ${i.quantity <= i.threshold ? 'text-red-400' : 'text-emerald-400'}`}>{i.quantity}</td>
                            <td className="text-slate-400 text-xs">{i.unit}</td>
                            <td>{i.quantity <= i.threshold ? <span className="badge badge-danger">Low Stock</span> : <span className="badge badge-success">OK</span>}</td>
                            <td><button onClick={async () => { try { await API.delete(`/inventory/${i.id}`); const r = await API.get('/inventory'); setInventory(Array.isArray(r.data) ? r.data : []); } catch(e) {} }}
                                className="text-red-400 hover:text-red-300 transition-colors p-2"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );

    if (activeTab === 'polls') return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Food Polls</h1>
                <button onClick={() => setShowPollForm(!showPollForm)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create Poll</button>
            </div>
            {showPollForm && (
                <div className="glass-card mb-8 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input value={pollForm.question} onChange={e => setPollForm(p => ({...p, question: e.target.value}))} placeholder="Poll Question (e.g. Next week's special?)" className="premium-input text-sm md:col-span-2" />
                        <input value={pollForm.options} onChange={e => setPollForm(p => ({...p, options: e.target.value}))} placeholder="Options (comma separated)" className="premium-input text-sm" />
                        <input type="date" value={pollForm.endDate} onChange={e => setPollForm(p => ({...p, endDate: e.target.value}))} className="premium-input text-sm" />
                    </div>
                    <button onClick={async () => { 
                        try {
                            const formattedOptions = pollForm.options.split(',').map((o, i) => ({ id: i+1, label: o.trim(), votes: 0 })).filter(o => o.label);
                            await API.post('/food/polls', { question: pollForm.question, options: formattedOptions, endDate: pollForm.endDate });
                            const r = await API.get('/food/polls');
                            setPolls(Array.isArray(r.data) ? r.data.map(p => ({...p, options: typeof p.options === 'string' ? JSON.parse(p.options) : p.options})) : []);
                            setShowPollForm(false);
                            setPollForm({ question: '', options: '', endDate: '' });
                        } catch(e) { alert('Failed to create poll'); }
                    }} className="btn-primary w-full px-10 py-3 uppercase font-black text-xs tracking-widest">Publish Poll</button>
                </div>
            )}
            {(!Array.isArray(polls) || polls.length === 0) ? <div className="glass-card text-center py-10"><p className="text-slate-400">No polls created yet</p></div> :
            polls.map(p => (
                <div key={p.id} className="glass-card mb-4">
                    <h3 className="text-lg font-semibold text-white mb-3">{p.question}</h3>
                    <div className="space-y-2">
                        {Array.isArray(p.options) && p.options.map(o => {
                            const total = p.options.reduce((s, opt) => s + (opt.votes || 0), 0) || 1;
                            const pct = (((o.votes || 0) / total) * 100).toFixed(0);
                            return (
                                <div key={o.id} className="flex items-center gap-3">
                                    <span className="text-sm text-slate-300 w-32">{o.label}</span>
                                    <div className="flex-1 h-3 rounded-full bg-slate-700"><div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-purple-500" style={{ width: `${pct}%` }} /></div>
                                    <span className="text-sm text-white w-16 text-right">{o.votes || 0} ({pct}%)</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );

    if (activeTab === 'suggestions') return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Food Suggestions</h1>
            {(!Array.isArray(suggestions) || suggestions.length === 0) ? <div className="glass-card text-center py-10"><p className="text-slate-400">No suggestions yet.</p></div> :
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map(s => (
                    <div key={s.id} className="glass-card">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-white">{s.employeeName}</span>
                            <span className={`badge ${s.status === 'Accepted' ? 'badge-success' : s.status === 'Rejected' ? 'badge-danger' : 'badge-primary'}`}>{s.status}</span>
                        </div>
                        <p className="text-sm text-slate-300 font-medium mb-1">"{s.foodName}"</p>
                        {s.description && <p className="text-xs text-slate-500 mb-4">{s.description}</p>}
                        {s.status === 'Pending' && (
                            <div className="flex gap-2 mt-4">
                                <button onClick={async () => {
                                    await API.put(`/food/suggestions/${s.id}`, { status: 'Accepted' });
                                    const r = await API.get('/food/suggestions');
                                    setSuggestions(Array.isArray(r.data) ? r.data : []);
                                }} className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/30 transition-colors border border-emerald-500/20">Accept</button>
                                <button onClick={async () => {
                                    await API.put(`/food/suggestions/${s.id}`, { status: 'Rejected' });
                                    const r = await API.get('/food/suggestions');
                                    setSuggestions(Array.isArray(r.data) ? r.data : []);
                                }} className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/30 transition-colors border border-red-500/20">Reject</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>}
        </div>
    );

    return <div className="animate-fade-in"><div className="glass-card"><p className="text-slate-400">Coming soon.</p></div></div>;
}
