import React, { useState, useEffect } from 'react';
import { Event, Application, User } from '../../types';
import { MockService } from '../../services/mockService';
import EventCard from '../../components/EventCard';
import { CheckCircle, Clock, XCircle, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { CardSkeleton } from '../../components/ui/Skeleton';

interface StaffMarketplaceProps {
  user: User;
}

const StaffMarketplace: React.FC<StaffMarketplaceProps> = ({ user }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null); // Track which button is loading
  const { addToast } = useToast();

  // Cancellation State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [applicationToCancel, setApplicationToCancel] = useState<Application | null>(null);

  const loadData = async () => {
    try {
        const allEvents = await MockService.getEvents();
        const activeEvents = allEvents.filter(e => e.status !== 'CONCLUIDO' && e.status !== 'CANCELADO');
        setEvents(activeEvents);
        
        const allApps = await MockService.getApplications();
        setApplications(allApps.filter(a => a.userId === user.id));
        
        // If a modal is open, refresh its event data
        if (selectedEvent) {
            const updatedEvent = activeEvents.find(e => e.id === selectedEvent.id);
            if (updatedEvent) {
                setSelectedEvent(updatedEvent);
            } else {
                setSelectedEvent(null);
            }
        }
    } catch (e) {
        console.error(e);
        addToast('error', 'Erro ao carregar dados', 'Não foi possível atualizar o mural.');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user.id]); 

  const getApplicationForEvent = (eventId: string) => applications.find(a => a.eventId === eventId && a.status !== 'CANCELADO');

  const handleApply = async (roleId: string) => {
    if (!selectedEvent) return;
    setApplyingId(roleId);
    
    const existingApp = applications.find(a => a.eventId === selectedEvent.id && a.status !== 'CANCELADO');
    if (existingApp) {
        addToast('info', 'Já inscrito', 'Você já possui uma inscrição ativa para este evento.');
        setApplyingId(null);
        return;
    }

    try {
        const newApp: Application = {
            id: '', // DB auto-gen
            eventId: selectedEvent.id,
            userId: user.id,
            functionId: roleId,
            status: 'PENDENTE',
            appliedAt: new Date().toISOString()
        };

        await MockService.createApplication(newApp);
        await loadData();
        setSelectedEvent(null); 
        addToast('success', 'Candidatura Enviada!', 'Aguarde a aprovação do administrador.');
        
        // Non-blocking warning about PIX after success
        if (!user.pixKey) {
            setTimeout(() => {
                 addToast('warning', 'Perfil Incompleto', 'Cadastre sua chave PIX no perfil para receber pagamentos.');
            }, 1000);
        }

    } catch(e: any) {
        console.error(e);
        addToast('error', 'Erro na candidatura', e.message || 'Tente novamente mais tarde.');
    } finally {
        setApplyingId(null);
    }
  };

  const initiateCancel = (app: Application) => {
      setApplicationToCancel(app);
      setCancelReason('');
      setShowCancelModal(true);
  };

  const confirmCancel = async () => {
      if (!applicationToCancel || !cancelReason.trim()) {
          addToast('warning', 'Motivo Obrigatório', 'Por favor, informe o motivo do cancelamento.');
          return;
      }
      
      try {
          await MockService.cancelApplication(applicationToCancel.id, cancelReason);
          
          setShowCancelModal(false);
          setApplicationToCancel(null);
          setCancelReason('');
          await loadData();
          setSelectedEvent(null); // Close main modal
          addToast('info', 'Cancelado', 'Sua candidatura foi cancelada.');
      } catch (e) {
          addToast('error', 'Erro ao cancelar');
      }
  };

  if (loading && events.length === 0) {
      return (
          <div className="space-y-6">
              <div className="flex justify-between items-center">
                  <div>
                      <h2 className="text-2xl font-bold text-gray-800">Mural de Eventos</h2>
                      <p className="text-sm text-gray-500">Eventos disponíveis para candidatura em tempo real.</p>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Mural de Eventos</h2>
            <p className="text-sm text-gray-500">Eventos disponíveis para candidatura em tempo real.</p>
        </div>
        {!user.pixKey && (
            <div className="hidden md:flex items-center text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                <AlertCircle size={16} className="mr-2" />
                Complete seu perfil cadastrando sua chave PIX.
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
                Nenhum evento disponível no momento.
            </div>
        ) : (
            events.map(event => {
                const app = getApplicationForEvent(event.id);
                const totalVacancies = event.functions.reduce((acc, f) => acc + f.vacancies, 0);
                const totalFilled = event.functions.reduce((acc, f) => acc + f.filled, 0);
                const isFullyBooked = totalFilled >= totalVacancies;

                return (
                    <div key={event.id} className="relative group">
                        <div className={isFullyBooked && !app ? "opacity-75 grayscale transition-all hover:grayscale-0" : ""}>
                            <EventCard 
                                event={event} 
                                showPay={true} 
                                onClick={() => setSelectedEvent(event)} 
                            />
                        </div>
                        
                        {app && (
                             <div className="absolute top-3 left-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 text-xs font-bold border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                {app.status === 'PENDENTE' && <Clock size={14} className="text-yellow-600"/>}
                                {app.status === 'APROVADO' && <CheckCircle size={14} className="text-green-600"/>}
                                {app.status === 'RECUSADO' && <XCircle size={14} className="text-red-600"/>}
                                {app.status === 'LISTA_ESPERA' && <Clock size={14} className="text-orange-600"/>}
                                <span className={
                                    app.status === 'APROVADO' ? 'text-green-700' : 
                                    app.status === 'RECUSADO' ? 'text-red-700' : 
                                    app.status === 'LISTA_ESPERA' ? 'text-orange-700' : 'text-yellow-700'
                                }>
                                    {app.status === 'PENDENTE' ? 'Aguardando Aprovação' : 
                                     app.status === 'LISTA_ESPERA' ? 'Lista de Espera' :
                                     app.status}
                                </span>
                             </div>
                        )}
                        
                        {!app && isFullyBooked && (
                             <div className="absolute top-3 left-3 bg-gray-900/90 text-white px-3 py-1.5 rounded-full shadow-sm text-xs font-bold">
                                Lotação Esgotada
                             </div>
                        )}
                    </div>
                );
            })
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="h-40 bg-gray-200 relative shrink-0">
                    <img src={selectedEvent.imageUrl || 'https://via.placeholder.com/300'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors">
                        <XCircle size={24} />
                    </button>
                    <div className="absolute bottom-4 left-6 text-white">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-90">{selectedEvent.type}</p>
                        <h3 className="text-2xl font-bold leading-tight">{selectedEvent.title}</h3>
                    </div>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <div className="flex items-start gap-4 mb-6 text-sm text-gray-600">
                        <div className="flex-1 space-y-2">
                             <p className="flex items-center gap-2"><Clock size={16} className="text-rose-500"/> {new Date(selectedEvent.date).toLocaleDateString()} às {selectedEvent.time}</p>
                             <p className="flex items-center gap-2"><CheckCircle size={16} className="text-rose-500"/> {selectedEvent.address}</p>
                        </div>
                    </div>
                    
                    <p className="text-gray-600 mb-6 bg-gray-50 p-4 rounded-lg text-sm leading-relaxed border border-gray-100">
                        {selectedEvent.description}
                    </p>

                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        Vagas Disponíveis
                    </h4>
                    
                    <div className="space-y-3">
                        {selectedEvent.functions.map(f => {
                            const hasApplied = getApplicationForEvent(selectedEvent.id);
                            const isMyApplication = hasApplied?.functionId === f.id;
                            const isFull = f.filled >= f.vacancies;
                            const isLoading = applyingId === f.id;

                            return (
                                <div 
                                    key={f.id} 
                                    className={`border rounded-lg p-4 flex justify-between items-center transition-all ${
                                        isMyApplication ? 'border-l-4 border-l-rose-500 bg-rose-50' :
                                        hasApplied ? 'border-gray-200 opacity-50' :
                                        isFull ? 'border-gray-200 bg-gray-50' :
                                        'border-gray-200 hover:border-rose-400 hover:shadow-md bg-white'
                                    }`}
                                >
                                    <div>
                                        <p className="font-bold text-gray-800">{f.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${isFull ? 'bg-gray-200 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                                                {f.filled}/{f.vacancies} preenchidas
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-green-700 font-bold text-lg">R$ {f.pay}</span>
                                        
                                        {isMyApplication ? (
                                            <button 
                                                onClick={() => hasApplied && initiateCancel(hasApplied)}
                                                className="text-xs font-bold text-red-600 border border-red-200 bg-white px-3 py-1.5 rounded hover:bg-red-50 flex items-center gap-1"
                                            >
                                                <XCircle size={12}/> Cancelar
                                            </button>
                                        ) : hasApplied ? (
                                            <span className="text-xs font-bold text-gray-400">Outra função</span>
                                        ) : (
                                            <button 
                                                disabled={isFull || isLoading}
                                                onClick={() => handleApply(f.id)}
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-2 ${
                                                    isFull 
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                        : 'bg-rose-600 text-white hover:bg-rose-700 hover:scale-105 transform'
                                                }`}
                                            >
                                                {isLoading && <Loader2 size={14} className="animate-spin" />}
                                                {isFull ? 'Esgotado' : 'Candidatar-se'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      )}

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

export default StaffMarketplace;