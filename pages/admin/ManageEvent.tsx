import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Star, User } from 'lucide-react';
import { Event, Application, User as UserType } from '../../types';
import { MockService } from '../../services/mockService';

interface ManageEventProps {
  eventId: string;
  onBack: () => void;
}

const ManageEvent: React.FC<ManageEventProps> = ({ eventId, onBack }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>('all');

  // Evaluation Modal State
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalUser, setEvalUser] = useState<UserType | null>(null);
  const [evalScores, setEvalScores] = useState({ punctuality: 5, posture: 5, productivity: 5, agility: 5 });

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    const allEvents = await MockService.getEvents();
    const evt = allEvents.find(e => e.id === eventId);
    if (evt) setEvent(evt);

    const allApps = await MockService.getApplications();
    const apps = allApps.filter(a => a.eventId === eventId);
    setApplications(apps);

    const allUsers = await MockService.getUsers();
    setUsers(allUsers);
  };

  const handleStatusChange = async (appId: string, status: 'APROVADO' | 'RECUSADO' | 'LISTA_ESPERA') => {
    await MockService.updateApplicationStatus(appId, status);
    
    // Refresh local applications state
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    
    // Always refresh event data to ensure vacancies counters (filled/total) are correct
    const updatedEvents = await MockService.getEvents();
    const updatedEvent = updatedEvents.find(e => e.id === eventId);
    if(updatedEvent) setEvent(updatedEvent);
  };

  const submitEvaluation = () => {
    if (!event || !evalUser) return;
    const avg = (evalScores.punctuality + evalScores.posture + evalScores.productivity + evalScores.agility) / 4;
    MockService.saveEvaluation({
        id: `ev_${Date.now()}`,
        eventId: event.id,
        userId: evalUser.id,
        ...evalScores,
        presence: true,
        notes: "Avaliação do Evento",
        average: avg
    });
    setEvalModalOpen(false);
    alert(`Avaliação salva! Média: ${avg.toFixed(1)}`);
  };

  if (!event) return <div>Carregando...</div>;

  const filteredApps = selectedFunction === 'all' 
    ? applications 
    : applications.filter(a => a.functionId === selectedFunction);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900">
        <ArrowLeft size={20} className="mr-2" /> Voltar
      </button>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
                <p className="text-gray-500">{new Date(event.date).toLocaleDateString()} - {event.address}</p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-bold ${event.status === 'CONCLUIDO' ? 'bg-gray-100' : 'bg-green-100 text-green-800'}`}>
                {event.status}
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {event.functions.map(f => (
                <div key={f.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 font-bold uppercase truncate">{f.name}</p>
                    <div className="flex justify-between items-end mt-1">
                        <span className="text-xl font-bold text-gray-800">{f.filled}/{f.vacancies}</span>
                        <span className="text-xs text-green-600 font-bold">R$ {f.pay}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2">
                        <div className="bg-rose-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (f.filled / f.vacancies) * 100)}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Filtrar por função:</label>
        <select 
            value={selectedFunction} 
            onChange={(e) => setSelectedFunction(e.target.value)}
            className="p-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
            <option value="all">Todas</option>
            {event.functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
                <tr>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Colaborador</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Função Desejada</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {filteredApps.map(app => {
                    const user = users.find(u => u.id === app.userId);
                    const func = event.functions.find(f => f.id === app.functionId);
                    if (!user) return null;

                    return (
                        <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center">
                                    <img src={user.avatar} className="w-10 h-10 rounded-full mr-3 object-cover" />
                                    <div>
                                        <p className="font-medium text-gray-900">{user.name}</p>
                                        <div className="flex items-center text-xs text-yellow-500">
                                            <Star size={10} className="fill-current mr-1" /> {user.rating}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-gray-600">{func?.name}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold 
                                    ${app.status === 'APROVADO' ? 'bg-green-100 text-green-700' : 
                                      app.status === 'RECUSADO' ? 'bg-red-100 text-red-700' : 
                                      'bg-yellow-100 text-yellow-700'}`}>
                                    {app.status}
                                </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                                {app.status === 'PENDENTE' && (
                                    <>
                                        <button onClick={() => handleStatusChange(app.id, 'APROVADO')} className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors" title="Aprovar"><Check size={16}/></button>
                                        <button onClick={() => handleStatusChange(app.id, 'RECUSADO')} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" title="Recusar"><X size={16}/></button>
                                    </>
                                )}
                                {app.status === 'APROVADO' && (
                                     <button onClick={() => handleStatusChange(app.id, 'RECUSADO')} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors" title="Cancelar Aprovação"><X size={16}/></button>
                                )}
                                {event.status === 'CONCLUIDO' && app.status === 'APROVADO' && (
                                    <button onClick={() => { setEvalUser(user); setEvalModalOpen(true); }} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded hover:bg-blue-100">
                                        Avaliar
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
                {filteredApps.length === 0 && (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500">Nenhuma inscrição encontrada para esta função.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* Evaluation Modal */}
      {evalModalOpen && evalUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md animate-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Avaliar {evalUser.name}</h3>
                <div className="space-y-6">
                    {Object.keys(evalScores).map((key) => (
                        <div key={key} className="flex justify-between items-center">
                            <label className="capitalize text-gray-700 font-medium">
                                {key === 'productivity' ? 'Produtividade' : 
                                 key === 'punctuality' ? 'Pontualidade' :
                                 key === 'posture' ? 'Postura' : 'Agilidade'}
                            </label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="range" min="1" max="5" step="0.5"
                                    value={evalScores[key as keyof typeof evalScores]}
                                    onChange={(e) => setEvalScores({...evalScores, [key]: parseFloat(e.target.value)})}
                                    className="w-32 accent-rose-600"
                                />
                                <span className="font-bold w-8 text-right text-rose-600">{evalScores[key as keyof typeof evalScores]}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                    <button onClick={() => setEvalModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                    <button onClick={submitEvaluation} className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold shadow-md transition-colors">Salvar Avaliação</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvent;