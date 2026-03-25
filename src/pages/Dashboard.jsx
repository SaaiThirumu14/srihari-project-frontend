import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Brain, LogOut, LayoutDashboard, Users, ClipboardCheck, CalendarCheck, CalendarDays, FileBarChart, Bot, Menu, X,
    MessageSquare, Heart, UtensilsCrossed, Package, ChefHat, BarChart3, Shield, Settings, Sparkles, Award, ListTodo } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import HRDashboard from './HRDashboard';
import TeamLeaderDashboard from './TeamLeaderDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import ChefDashboard from './ChefDashboard';

const sidebarConfig = {
    Admin: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'promotions', label: 'Promotions', icon: Award },
        { id: 'wellness', label: 'Wellness', icon: Heart },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'settings', label: 'Settings', icon: Settings },
    ],
    HR: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'leaves', label: 'Leave Requests', icon: CalendarDays },
        { id: 'surveys', label: 'Churn Surveys', icon: FileBarChart },
        { id: 'predictions', label: 'AI Predictions', icon: Brain },
        { id: 'wellness', label: 'Wellness Analytics', icon: Heart },
        { id: 'chat', label: 'HR Chat', icon: MessageSquare },
        { id: 'chatbot', label: 'AI Assistant', icon: Bot },
        { id: 'forecast', label: 'Workforce Forecast', icon: BarChart3 },
    ],
    TeamLeader: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'tasks', label: 'Task Management', icon: ListTodo },
        { id: 'team', label: 'My Team', icon: Users },
        { id: 'attendance', label: 'Team Attendance', icon: CalendarCheck },
        { id: 'surveys', label: 'Survey Review', icon: FileBarChart },
        { id: 'promotions', label: 'Promotions', icon: Award },
        { id: 'wellness', label: 'Wellness', icon: Heart },
    ],
    Employee: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
        { id: 'leaves', label: 'My Leaves', icon: CalendarDays },
        { id: 'tasks', label: 'My Tasks', icon: ListTodo },
        { id: 'survey', label: 'Churn Survey', icon: ClipboardCheck },
        { id: 'wellness', label: 'Wellness', icon: Heart },
        { id: 'cafeteria', label: 'Cafeteria', icon: UtensilsCrossed },
        { id: 'rewards', label: 'Rewards', icon: Sparkles },
        { id: 'chat', label: 'HR Chat', icon: MessageSquare },
    ],
    Chef: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'menu', label: 'Menu Manager', icon: UtensilsCrossed },
        { id: 'orders', label: 'Live Orders', icon: ChefHat },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'polls', label: 'Food Polls', icon: BarChart3 },
    ],
};

const roleColors = {
    Admin: 'from-red-500 to-rose-600', HR: 'from-purple-500 to-violet-600',
    TeamLeader: 'from-blue-500 to-cyan-600', Employee: 'from-emerald-500 to-green-600', Chef: 'from-amber-500 to-orange-600'
};

export default function Dashboard() {
    const { user, logout } = useAuth();
    const role = user?.role || 'Employee';
    const items = sidebarConfig[role] || sidebarConfig.Employee;
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const renderDashboard = () => {
        switch (role) {
            case 'Admin': return <AdminDashboard activeTab={activeTab} />;
            case 'HR': return <HRDashboard activeTab={activeTab} />;
            case 'TeamLeader': return <TeamLeaderDashboard activeTab={activeTab} />;
            case 'Employee': return <EmployeeDashboard activeTab={activeTab} />;
            case 'Chef': return <ChefDashboard activeTab={activeTab} />;
            default: return <EmployeeDashboard activeTab={activeTab} />;
        }
    };

    return (
        <div className="min-h-screen bg-surface-900 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-surface-950/80 border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-black gradient-text uppercase tracking-tight">WorkspaceAI</span>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                    {isSidebarOpen ? <X className="w-6 h-6 transition-transform" /> : <Menu className="w-6 h-6 transition-transform" />}
                </button>
            </header>

            {/* Sidebar Overlay (Mobile Only) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-surface-950/90 border-r border-white/5 flex flex-col transition-transform duration-300 transform
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6 border-b border-white/5 hidden md:block">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-black gradient-text uppercase tracking-tight">WorkspaceAI</span>
                    </div>
                </div>

                <div className="p-4">
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleColors[role]} flex items-center justify-center text-white text-sm font-black shadow-lg`}>
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">{user?.name}</div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{role} Profile</div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4 scrollbar-hide">
                    {items.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsSidebarOpen(false);
                            }}
                            className={`
                                flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 w-full text-left font-semibold group
                                ${activeTab === item.id 
                                    ? 'bg-gradient-to-r from-primary-500/10 to-transparent text-primary-400 border-l-4 border-primary-500' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="text-sm tracking-wide">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button 
                        onClick={logout} 
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl w-full text-left font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all group"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> 
                        <span className="text-sm uppercase tracking-widest">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 transition-all duration-300 min-h-screen">
                <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10">
                    <motion.div 
                        key={activeTab} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {renderDashboard()}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
