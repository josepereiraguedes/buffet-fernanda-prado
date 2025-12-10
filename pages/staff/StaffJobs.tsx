import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, MapPin, DollarSign, XCircle, Star, RefreshCcw, AlertTriangle } from 'lucide-react';
import { User, Application, Event, Evaluation } from '../../types';
import { MockService } from '../../services/mockService';

interface StaffJobsProps {
  user: User;
}

type TabType = 'CONFIRMED' | 'PENDING' | 'HISTORY';

const StaffJobs: React.FC<StaffJobsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<TabType>('CONFIRMED');
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  
  // Cancellation State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [applicationToCancel, setApplicationToCancel] = useState<Application | null>(null);

  const loadData = async () => {
    // Filter out cancelled applications from main lists, but keep them for history if needed? 
    // Usually "My Jobs" shouldn't show cancelled ones in Pending/Confirmed
    const allApps = await MockService.getApplications();
    const myApps = allApps.filter(a => a.userId === user.id);
    setApplications(myApps);
    
    const allEvents = await MockService.getEvents();
    setEvents(allEvents);
    
    const allEvaluations = await MockService.getEvaluations();
    setEvaluations(allEvaluations.filter(e => e.userId === user.id));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [user.id]);

  const getEvent = (eventId: string) => events.find(e => e.id === eventId);
  const getEvaluation = (eventId: string) => evaluations.find(e => e.eventId === eventId);

  // Filter Logic
  const pendingApps = applications.filter(a => (a.status === 'PENDENTE' || a.status === 'LISTA_ESPERA'));
  const confirmedApps = applications.filter(a => {
      const event = getEvent(a.eventId);
      return a.status === 'APROVADO' && event?.status !== 'CONCLUIDO' && event?.status !== 'CANCELADO';
  });
  const historyApps = applications.filter(a => {
      const event = getEvent(a.eventId);
      return (a.status === 'APROVADO' && event?.status === 'CONCLUIDO') || a.status === 'RECUSADO' || a.status === 'CANCELADO' || event?.status === 'CANCELADO'; 
  });

  const initiateCancel = (app: Application) => {
    setApplicationToCancel(app);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!applicationToCancel || !cancelReason.trim()) {
        alert('Por favor, informe o motivo do cancelamento.');
        return;
    }
    
    await MockService.cancelApplication(applicationToCancel.id, cancelReason);
    
    setShowCancelModal(false);
    setApplicationToCancel(null);
    setCancelReason('');
    loadData();
    alert('Candidatura cancelada com sucesso.');
  };

  const renderCard = (app: Application, isHistory = false) => {
    const event = getEvent(app.eventId);
    if (!event) return null;
    const func = event.functions.find(f => f.id === app.functionId);
    const evaluation = isHistory ? getEvaluation(event.id) : null;

    // Special case for cancelled events in history
    const isEventCancelled = event.status === 'CANCELADO';
    const isAppCancelled = app.status === 'CANCELADO';
    const isRejected = app.status === 'RECUSADO';

    return (
        <div key={app.id} className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow ${isRejected || isEventCancelled ? 'border-red-100 bg-red-50/30' : isAppCancelled ? 'border-gray-200 bg-gray-50 opacity-75' : 'border-gray-100'}`}>
            <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-rose-500 uppercase tracking-wide">{event.type}</span>
                    <div className="flex gap-2">
                        {app.status === 'PENDENTE' && <span className="text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock size={12}/> Aguardando Aprovação</span>}
                        {app.status === 'LISTA_ESPERA' && <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1"><Clock size={12}/> Lista de Espera</span>}
                        {app.status === 'APROVADO' && !isHistory && <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle size={12}/> Confirmado</span>}
                        
                        {isHistory && (
                            <>
                                {app.status === 'APROVADO' && event.status === 'CONCLUIDO' && <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Trabalho Concluído</span>}
                                {app.status === 'RECUSADO' && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">Solicitação Recusada</span>}
                                {app.status === 'CANCELADO' && <span className="text-xs font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Cancelado por você</span>}
                                {event.status === 'CANCELADO' && <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">Evento Cancelado</span>}
                            </>
                        )}
                    </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                
                <div className="flex flex-col md:flex-row gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-rose-500" />
                        {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-rose-500" />
                        {event.time}
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-rose-500" />
                        <span className="truncate max-w-[200px]">{event.address}</span>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-white/50 rounded-lg border border-gray-100 inline-block w-full md:w-auto">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Sua Função</p>
                    <div className="flex justify-between items-center gap-6">
                        <span className="font-medium text-gray-900">{func?.name}</span>
                        <span className="font-bold text-green-600 bg-white px-2 py-1 rounded border border-green-100">R$ {func?.pay}</span>
                    </div>
                </div>
            </div>

            {/* Actions & Status Side */}
            <div className="md:border-l pl-0 md:pl-6 flex flex-col items-center justify-center gap-3 min-w-[120px]">
                {!isHistory && (
                    <button 
                        onClick={() => initiateCancel(app)}
                        className="text-xs font-bold text-red-600 border border-red-200 bg-white px-3 py-2 rounded-lg hover:bg-red-50 hover:border-red-300 w-full transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle size={14} /> Cancelar
                    </button>
                )}

                {isHistory && app.status === 'APROVADO' && event.status === 'CONCLUIDO' && (
                    evaluation ? (
                        <div className="text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Sua Nota</p>
                            <div className="flex items-center justify-center bg-yellow-50 text-yellow-600 px-3 py-2 rounded-lg font-bold text-xl">
                                <Star size={20} className="fill-current mr-2" />
                                {evaluation.average.toFixed(1)}
                            </div>
                        </div>
                    ) : (
                         <div className="text-center bg-gray-50 p-3 rounded-lg w-full">
                            <Clock size={20} className="text-gray-300 mx-auto mb-1"/>
                            <span className="text-xs text-gray-400 italic font-medium">Aguardando avaliação</span>
                         </div>
                    )
                )}
                 {isHistory && app.status === 'CANCELADO' && (
                     <div className="text-center w-full">
                         <span className="text-xs text-gray-400">Cancelado em {new Date(app.appliedAt).toLocaleDateString()}</span>
                     </div>
                 )}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Minhas Escalas</h1>
                <p className="text-gray-500">Acompanhe o status das suas candidaturas e agenda.</p>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1 animate-pulse">
                <RefreshCcw size={10} /> Atualizado em tempo real
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('CONFIRMED')}
                className={`pb-3 px-6 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'CONFIRMED' ? 'text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Confirmados
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'CONFIRMED' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'}`}>
                    {confirmedApps.length}
                </span>
                {activeTab === 'CONFIRMED' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-600"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('PENDENTE')}
                className={`pb-3 px-6 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'PENDENTE' ? 'text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Pendentes / Lista de Espera
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'PENDENTE' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'}`}>
                    {pendingApps.length}
                </span>
                {activeTab === 'PENDENTE' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-600"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`pb-3 px-6 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'HISTORY' ? 'text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Histórico
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === 'HISTORY' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-600'}`}>
                    {historyApps.length}
                </span>
                {activeTab === 'HISTORY' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-600"></div>}
            </button>
        </div>

        {/* Content */}
        <div className="space-y-4 min-h-[300px]">
            {activeTab === 'CONFIRMED' && (
                confirmedApps.length > 0 ? confirmedApps.map(a => renderCard(a)) : <EmptyState message="Você não tem eventos confirmados para os próximos dias." icon={<CheckCircle size={48} className="text-gray-200 mb-4"/>} />
            )}
            
            {activeTab === 'PENDENTE' && (
                pendingApps.length > 0 ? pendingApps.map(a => renderCard(a)) : <EmptyState message="Nenhuma solicitação pendente no momento. Confira o mural de eventos!" icon={<Clock size={48} className="text-gray-200 mb-4"/>} />
            )}

            {activeTab === 'HISTORY' && (
                historyApps.length > 0 ? historyApps.map(a => renderCard(a, true)) : <EmptyState message="Seu histórico de eventos aparecerá aqui após a conclusão dos trabalhos." icon={<Calendar size={48} className="text-gray-200 mb-4"/>} />
            )}
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in duration-200">
                  <div className="flex items-start gap-4 mb-4">
                      <div className="bg-red-100 p-3 rounded-full">
                          <AlertTriangle className="text-red-600" size={24} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-gray-900">Cancelar Candidatura</h3>
                          <p className="text-sm text-gray-500">Tem certeza que deseja cancelar sua inscrição? Essa ação liberará sua vaga.</p>
                      </div>
                  </div>
                  
                  <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Motivo do Cancelamento <span className="text-red-500">*</span></label>
                      <textarea 
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none h-24"
                          placeholder="Por favor, explique por que não poderá comparecer..."
                      />
                  </div>

                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setShowCancelModal(false)}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                      >
                          Voltar
                      </button>
                      <button 
                          onClick={confirmCancel}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md"
                      >
                          Confirmar Cancelamento
                      </button>
                  </div>
              </div>
          </div>
        )}
    </div>
  );
};

const EmptyState = ({ message, icon }: { message: string, icon: React.ReactNode }) => (
    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center flex flex-col items-center justify-center h-64">
        {icon}
        <p className="text-gray-500 max-w-sm">{message}</p>
    </div>
);

export default StaffJobs;