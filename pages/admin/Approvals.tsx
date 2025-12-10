import React, { useEffect, useState } from 'react';
import { Check, X, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Application, Event, User } from '../../types';
import { MockService } from '../../services/mockService';

const Approvals: React.FC = () => {
  const [pendingApps, setPendingApps] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const allApps = await MockService.getApplications();
    const pending = allApps.filter(a => a.status === 'PENDENTE');
    setPendingApps(pending);
    
    const allEvents = await MockService.getEvents();
    setEvents(allEvents);
    
    const allUsers = await MockService.getUsers();
    setUsers(allUsers);
  };

  const handleAction = async (appId: string, status: 'APROVADO' | 'RECUSADO') => {
    await MockService.updateApplicationStatus(appId, status);
    refreshData();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Central de Aprovações</h1>
        <p className="text-gray-500 mt-2 text-lg">Gerencie todas as solicitações pendentes de escalas.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {pendingApps.length === 0 ? (
           <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="bg-green-100 p-4 rounded-full mb-4">
                  <Check size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Tudo em dia!</h3>
              <p className="text-gray-500">Não há solicitações pendentes no momento.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                   <th className="p-5 font-bold text-gray-500 text-xs uppercase">Colaborador</th>
                   <th className="p-5 font-bold text-gray-500 text-xs uppercase">Evento</th>
                   <th className="p-5 font-bold text-gray-500 text-xs uppercase">Função / Valor</th>
                   <th className="p-5 font-bold text-gray-500 text-xs uppercase">Data da Solicitação</th>
                   <th className="p-5 font-bold text-gray-500 text-xs uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingApps.map(app => {
                   const user = users.find(u => u.id === app.userId);
                   const event = events.find(e => e.id === app.eventId);
                   const func = event?.functions.find(f => f.id === app.functionId);

                   if(!user || !event) return null;

                   return (
                     <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-5">
                           <div className="flex items-center gap-3">
                              <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" />
                              <div>
                                 <p className="font-bold text-gray-900">{user.name}</p>
                                 <p className="text-xs text-gray-500">{user.type}</p>
                              </div>
                           </div>
                        </td>
                        <td className="p-5">
                           <p className="font-medium text-gray-800">{event.title}</p>
                           <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Calendar size={12} /> {new Date(event.date).toLocaleDateString()}
                           </div>
                        </td>
                        <td className="p-5">
                           <p className="font-medium text-gray-800">{func?.name}</p>
                           <span className="text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded">R$ {func?.pay}</span>
                        </td>
                        <td className="p-5 text-sm text-gray-500">
                           {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="p-5 text-right">
                           <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleAction(app.id, 'APROVADO')}
                                className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-green-100 transition-colors"
                              >
                                 <Check size={16} /> Aprovar
                              </button>
                              <button 
                                onClick={() => handleAction(app.id, 'RECUSADO')}
                                className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors"
                              >
                                 <X size={16} /> Recusar
                              </button>
                           </div>
                        </td>
                     </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;