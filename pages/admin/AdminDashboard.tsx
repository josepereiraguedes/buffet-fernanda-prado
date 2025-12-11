import React, { useEffect, useState } from 'react';
import { Calendar, Users, DollarSign, Clock, CheckCircle, Bell, AlertTriangle, Info } from 'lucide-react';
import { MockService } from '../../services/mockService';
import { Event, User, Application, Notification } from '../../types';

interface AdminDashboardProps {
  navigate: (path: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Poll for updates (faster polling for dashboard responsiveness)
    const interval = setInterval(loadData, 5000); 
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
      try {
        // Parallel fetching
        const [e, u, a, n] = await Promise.all([
            MockService.getEvents(),
            MockService.getUsers(),
            MockService.getApplications(),
            MockService.getNotifications()
        ]);
        
        setEvents(e);
        setUsers(u);
        setApplications(a);
        
        // Filter notifications relevant to ADMIN
        setNotifications(n.filter(notif => notif.targetRole === 'ADMIN'));
      } catch (err) {
          console.error("Dashboard Load Error", err);
      } finally {
          setLoading(false);
      }
  };

  if (loading) {
      return <div className="p-12 text-center text-gray-500">Carregando dados do painel...</div>;
  }

  // Real Metrics Calculation
  const activeEvents = events.filter(e => e.status !== 'CONCLUIDO' && e.status !== 'CANCELADO').length;
  const staffCount = users.filter(u => u.role === 'STAFF').length;
  const pendingCount = applications.filter(a => a.status === 'PENDENTE').length;
  
  const estimatedCost = events
    .filter(e => e.status !== 'CANCELADO')
    .reduce((acc, evt) => {
        return acc + evt.functions.reduce((fAcc, f) => fAcc + (f.pay * f.vacancies), 0);
    }, 0);

  const formatCurrency = (val: number) => {
      if (val >= 1000) return `R$ ${(val/1000).toFixed(1)}k`;
      return `R$ ${val}`;
  };

  const nextEvent = events
    .filter(e => e.status !== 'CONCLUIDO' && e.status !== 'CANCELADO')
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Painel Administrativo</h2>
        <p className="text-gray-500">Bem-vinda de volta, Fernanda.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Calendar size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Eventos Ativos</p>
            <p className="text-2xl font-bold text-gray-800">{activeEvents}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Base de Staff</p>
            <p className="text-2xl font-bold text-gray-800">{staffCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full"><DollarSign size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Custo Projetado</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(estimatedCost)}</p>
          </div>
        </div>
        <div 
            onClick={() => navigate('/admin/approvals')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className={`p-3 rounded-full ${pendingCount > 0 ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
              <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Aprovações Pendentes</p>
            <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-orange-600' : 'text-gray-800'}`}>{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Next Event & Notifications */}
        <div className="lg:col-span-2 space-y-8">
            {/* Notifications Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Bell size={18} className="text-gray-500" />
                        Alertas & Notificações
                    </h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{notifications.length}</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Nenhuma notificação recente.</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map(n => (
                                <div key={n.id} className={`p-4 flex gap-3 ${n.type === 'ALERT' ? 'bg-red-50/50' : 'bg-white'}`}>
                                    <div className="mt-1">
                                        {n.type === 'ALERT' && <AlertTriangle size={18} className="text-red-500" />}
                                        {n.type === 'INFO' && <Info size={18} className="text-blue-500" />}
                                        {n.type === 'SUCCESS' && <CheckCircle size={18} className="text-green-500" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`text-sm font-bold ${n.type === 'ALERT' ? 'text-red-700' : 'text-gray-800'}`}>{n.title}</h4>
                                            <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

          {/* Next Event */}
          <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Próximo Evento</h3>
                <button onClick={() => navigate('/admin/events')} className="text-sm text-rose-600 font-medium hover:underline">Ver todos</button>
            </div>
            {nextEvent ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                    <img src={nextEvent.imageUrl || 'https://via.placeholder.com/150'} className="w-full md:w-48 h-32 object-cover rounded-lg" />
                    <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                        <span className="text-xs font-bold text-rose-500 uppercase">{nextEvent.type}</span>
                        <h4 className="text-xl font-bold text-gray-900 mt-1">{nextEvent.title}</h4>
                        <p className="text-gray-500 text-sm mt-1">{new Date(nextEvent.date).toLocaleDateString()} às {nextEvent.time}</p>
                        <p className="text-gray-500 text-sm">{nextEvent.address}</p>
                        </div>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                        {nextEvent.status}
                        </span>
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <div className="flex -space-x-2">
                           {/* Show avatars of approved staff */}
                           {applications
                                .filter(a => a.eventId === nextEvent.id && a.status === 'APROVADO')
                                .slice(0, 5)
                                .map(a => {
                                    const u = users.find(u => u.id === a.userId);
                                    return u ? <img key={u.id} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white" title={u.name} /> : null;
                                })
                           }
                           {applications.filter(a => a.eventId === nextEvent.id && a.status === 'APROVADO').length === 0 && (
                               <span className="text-xs text-gray-400 italic">Nenhum staff confirmado</span>
                           )}
                        </div>
                        <button onClick={() => navigate(`/admin/events/${nextEvent.id}`)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800">
                        Gerenciar Equipe
                        </button>
                    </div>
                    </div>
                </div>
            ) : (
                <div className="p-8 bg-white text-center text-gray-500 rounded-xl border border-dashed">Nenhum evento futuro agendado.</div>
            )}
            </div>
        </div>

        {/* Top Staff */}
        <div>
           <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Ranking Staff</h3>
            <button onClick={() => navigate('/admin/staff')} className="text-sm text-rose-600 font-medium hover:underline">Ver todos</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {users
              .filter(u => u.role === 'STAFF')
              .sort((a,b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 5)
              .map((staff, idx) => (
                <div key={staff.id} className="flex items-center p-4 border-b last:border-0 hover:bg-gray-50">
                  <span className={`w-6 font-bold ${idx < 3 ? 'text-yellow-500' : 'text-gray-400'}`}>#{idx + 1}</span>
                  <img src={staff.avatar} className="w-10 h-10 rounded-full mx-3" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{staff.name}</p>
                    <p className="text-xs text-gray-500">{staff.type}</p>
                  </div>
                  <div className="flex items-center text-yellow-500 font-bold text-sm">
                    <CheckCircle size={14} className="mr-1" />
                    {staff.rating}
                  </div>
                </div>
            ))}
            {users.filter(u => u.role === 'STAFF').length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">Nenhum colaborador encontrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;