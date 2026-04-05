import { useState, useEffect } from 'react';
import API from '../utils/api';
import { UtensilsCrossed, BarChart3 } from 'lucide-react';

export default function CafeteriaView({ readOnly = false }) {
    const [menu, setMenu] = useState([]);
    const [orders, setOrders] = useState([]);
    const [polls, setPolls] = useState([]);

    useEffect(() => {
        API.get('/food/menu').then(r => setMenu(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        API.get('/food/orders').then(r => setOrders(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        API.get('/food/polls').then(r => setPolls(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    }, []);

    const placeOrder = async (item) => {
        if (confirm(`Order ${item.name} for ₹${item.price}?`)) {
            try {
                await API.post('/food/orders', { 
                    items: [{ menuItemId: item.id, name: item.name, quantity: 1, price: item.price }], 
                    totalPrice: item.price, 
                    deliveryTime: '30 mins', 
                    deliveryLocation: 'Desk' 
                }); 
                alert('✅ Order placed successfully!');
                const r = await API.get('/food/orders');
                setOrders(Array.isArray(r.data) ? r.data : []); 
            } catch (e) { alert('❌ Failed to place order.'); }
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-white mb-6">Smart Cafeteria 🍱</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {(!Array.isArray(menu) || menu.length === 0) ? <div className="col-span-full py-10 text-center text-slate-500 italic">No menu items available currently.</div> :
                    menu.filter(m => m.available).map(item => (
                    <div key={item.id} className="glass-card">
                        <div className="flex items-start justify-between mb-2">
                            <div><div className="font-semibold text-white">{item.name}</div><div className="text-xs text-slate-400">{item.category} · {item.calories} cal</div></div>
                            <span className="text-lg font-bold text-emerald-400">₹{item.price}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{item.description}</p>
                        {!readOnly && <button onClick={() => placeOrder(item)} className="btn-primary w-full text-sm py-2">Order Now</button>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="glass-card">
                    <div className="flex items-center gap-2 text-white font-semibold mb-4"><BarChart3 className="w-5 h-5 text-amber-400" /> Active Food Polls</div>
                    {polls.length === 0 ? <p className="text-slate-500 text-sm italic py-4">No active polls at the moment.</p> :
                        polls.map(p => (
                            <div key={p.id} className="p-4 rounded-xl bg-slate-800/40 border border-white/5 mb-3">
                                <div className="text-sm font-semibold text-white mb-3">{p.question}</div>
                                <div className="flex flex-col gap-2">
                                    {(typeof p.options === 'string' ? JSON.parse(p.options) : (p.options || [])).map(o => (
                                        <button key={o.id} onClick={async () => { if(!readOnly) { try { await API.post('/food/polls/vote', { pollId: p.id, optionId: o.id }); const r = await API.get('/food/polls'); setPolls(Array.isArray(r.data) ? r.data : []); } catch(e) {} } }}
                                            className={`w-full py-2 px-3 text-xs bg-slate-700/50 rounded-lg text-slate-300 transition-all text-left flex justify-between border border-transparent ${readOnly ? 'cursor-default' : 'hover:bg-primary-600/30 hover:text-white hover:border-primary-500/30'}`}>
                                            <span>{o.label}</span>
                                            <span className="font-bold opacity-60">{o.votes} votes</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    }
                </div>
                <div className="glass-card">
                    <div className="flex items-center gap-2 text-white font-semibold mb-4"><UtensilsCrossed className="w-5 h-5 text-emerald-400" /> Meal Suggestions</div>
                    <SuggestionForm readOnly={readOnly} />
                </div>
            </div>

            {!readOnly && (
                <div className="glass-card"><h3 className="text-lg font-semibold text-white mb-3">My Orders</h3>
                    {(!Array.isArray(orders) || orders.length === 0) ? <p className="text-slate-400 text-sm italic">No orders yet.</p> :
                    orders.slice(0, 5).map(o => (
                        <div key={o.id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                            <div><div className="text-sm text-white">{(typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || [])).map(i => i.name).join(', ') || 'Smart Snack'}</div><div className="text-xs text-slate-400">₹{o.totalPrice} · {o.createdAt ? new Date(o.createdAt).toLocaleTimeString() : 'Recent'}</div></div>
                            <span className={`badge ${o.status === 'Delivered' ? 'badge-success' : o.status === 'Ready' ? 'badge-warning' : 'badge-primary'}`}>{o.status}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SuggestionForm({ readOnly }) {
    const [sug, setSug] = useState('');
    if (readOnly) return <div className="p-4 text-center text-slate-500 italic border border-dashed border-white/10 rounded-xl">Employees can submit suggestions here.</div>;
    return (
        <div className="flex flex-col gap-3">
            <textarea value={sug} onChange={e => setSug(e.target.value)} placeholder="Suggest a new dish..." className="premium-input !py-3 !px-4 text-xs min-h-[100px]" />
            <button onClick={async () => { if (!sug) return; await API.post('/food/suggestions', { foodName: sug }); setSug(''); alert('✨ Success! Your suggestion has been sent to the Chef.'); }} className="btn-primary py-2.5 text-xs font-bold uppercase tracking-widest">Send to Kitchen</button>
        </div>
    );
}
