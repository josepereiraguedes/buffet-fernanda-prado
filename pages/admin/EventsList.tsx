import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, MapPin, Users, Clock, LayoutGrid, List as ListIcon, Filter, X, Trash, Save, Upload, Info } from 'lucide-react';
import { Event, EventFunction, EventStatus } from '../../types';
import { MockService } from '../../services/mockService';
import { useToast } from '../../components/ui/Toast';
import { CardSkeleton } from '../../components/ui/Skeleton';

interface EventsListProps {
  navigate: (path: string) => void;
  onManage: (eventId: string) => void;
}

const EventsList: React.FC<EventsListProps> = ({ navigate, onManage }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // View Details Modal State
  const [viewEvent, setViewEvent] = useState<Event | null>(null);

  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    date: '',
    time: '',
    address: '',
    description: '',
    type: 'Casamento',
    status: 'ABERTO',
    imageUrl: 'https://picsum.photos/seed/new/800/400',
  });
  
  // Specific values state
  const [valuePartyHelper, setValuePartyHelper] = useState<number>(150);
  const [valueGeneralHelper, setValueGeneralHelper] = useState<number>(200);

  const [functions, setFunctions] = useState<Partial<EventFunction>[]>([
    { id: 'f_garcom', name: 'Garçom', pay: 180, vacancies: 4, filled: 0 },
    { id: 'f_copeira', name: 'Copeira', pay: 150, vacancies: 2, filled: 0 },
  ]);

  useEffect(() => {
    const fetchEvents = async () => {
        try {
            setLoading(true);
            const data = await MockService.getEvents();
            setEvents(data);
        } catch (error) {
            console.error("Erro ao carregar eventos:", error);
            addToast('error', 'Erro', 'Falha ao carregar lista de eventos');
        } finally {
            setLoading(false);
        }
    };
    fetchEvents();
  }, []);

  // Filter Logic
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Create Form Logic
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const updateFunction = (index: number, field: keyof EventFunction, value: string | number) => {
    const newFuncs = [...functions];
    newFuncs[index] = { ...newFuncs[index], [field]: value };
    setFunctions(newFuncs);
  };

  const addFunction = () => {
    setFunctions([...functions, { id: `f_${Date.now()}`, name: '', pay: 0, vacancies: 1, filled: 0 }]);
  };

  const removeFunction = (index: number) => {
    setFunctions(functions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const newEvent: Event = {
            ...formData as Event,
            id: `e_${Date.now()}`,
            functions: functions as EventFunction[],
            valuePartyHelper,
            valueGeneralHelper
        };
        await MockService.saveEvent(newEvent);
        
        // Refresh list and close modal
        const updatedEvents = await MockService.getEvents();
        setEvents(updatedEvents);
        setIsCreateModalOpen(false);
        addToast('success', 'Evento Criado', `${newEvent.title} foi salvo com sucesso.`);
        
        // Reset form
        setFormData({
            title: '',
            date: '',
            time: '',
            address: '',
            description: '',
            type: 'Casamento',
            status: 'ABERTO',
            imageUrl: 'https://picsum.photos/seed/new/800/400',
        });
        setValuePartyHelper(150);
        setValueGeneralHelper(200);
        setFunctions([
            { id: 'f_garcom', name: 'Garçom', pay: 180, vacancies: 4, filled: 0 },
            { id: 'f_copeira', name: 'Copeira', pay: 150, vacancies: 2, filled: 0 },
        ]);
    } catch(err) {
        addToast('error', 'Erro', 'Falha ao criar evento.');
    }
  };

  // Status Cycle Logic
  const handleStatusClick = async (e: React.MouseEvent, event: Event) => {
      e.stopPropagation();
      const statusOrder: EventStatus[] = ['ABERTO', 'EM_FORMACAO', 'CONCLUIDO', 'CANCELADO'];
      const currentIndex = statusOrder.indexOf(event.status);
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
      
      const updatedEvent = { ...event, status: nextStatus };
      await MockService.saveEvent(updatedEvent);
      
      const refreshedEvents = await MockService.getEvents();
      setEvents(refreshedEvents); 
      addToast('info', 'Status Atualizado', `Evento agora está ${nextStatus.replace('_', ' ')}`);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'ABERTO': return 'bg-emerald-500 text-white hover:bg-emerald-600';
        case 'EM_FORMACAO': return 'bg-amber-500 text-white hover:bg-amber-600';
        case 'CONCLUIDO': return 'bg-slate-500 text-white hover:bg-slate-600';
        case 'CANCELADO': return 'bg-red-500 text-white hover:bg-red-600';
        default: return 'bg-blue-500 text-white';
    }
  };
  
  const getStatusLabel = (status: string) => status.replace('_', ' ');

  if (loading) {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                 <div className="space-y-2 w-1/3"><div className="h-8 bg-gray-200 rounded animate-pulse"></div><div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <CardSkeleton /><CardSkeleton /><CardSkeleton />
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Eventos</h1>
           <p className="text-gray-500 mt-2 text-lg">Gerencie todos os eventos do seu buffet</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="flex items-center justify-center bg-[#EAB308] hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors"
        >
          <Plus size={20} className="mr-2" /> Novo Evento
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full md:w-auto p-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text"
                placeholder="Buscar eventos..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-gray-50/50 text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto p-1 overflow-x-auto">
            <select 
                className="p-2.5 border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500 min-w-[160px] text-gray-600"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="all">Todos os status</option>
                <option value="ABERTO">Aberto</option>
                <option value="EM_FORMACAO">Em Formação</option>
                <option value="CONCLUIDO">Concluído</option>
            </select>

            <select 
                className="p-2.5 border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500 min-w-[160px] text-gray-600"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
            >
                <option value="all">Todos os tipos</option>
                <option value="Casamento">Casamento</option>
                <option value="Festa Infantil">Festa Infantil</option>
                <option value="Corporativo">Corporativo</option>
            </select>

             <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-rose-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <LayoutGrid size={20} />
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 ${viewMode === 'list' ? 'bg-rose-700 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                    <ListIcon size={20} />
                </button>
            </div>
        </div>
      </div>

      {/* Grid */}
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-8`}>
        {filteredEvents.map(event => {
            const totalVacancies = event.functions.reduce((acc, curr) => acc + curr.vacancies, 0);
            const totalFilled = event.functions.reduce((acc, curr) => acc + curr.filled, 0);
            const progress = totalVacancies > 0 ? (totalFilled / totalVacancies) * 100 : 0;

            return (
                <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group flex flex-col">
                    <div className="h-52 relative overflow-hidden">
                        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                        
                        <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 tracking-wide">
                            {event.type}
                        </span>
                        
                        <button 
                            onClick={(e) => handleStatusClick(e, event)}
                            className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm tracking-wide transition-colors cursor-pointer ${getStatusColor(event.status)}`}
                            title="Clique para alterar o status"
                        >
                            {getStatusLabel(event.status)}
                        </button>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                        <h3 className="font-bold text-xl text-gray-900 mb-4 truncate leading-tight">{event.title}</h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center text-gray-500 text-sm">
                                <Calendar size={18} className="mr-2.5 text-gray-400" />
                                <span className="font-medium">{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                                <Clock size={18} className="ml-5 mr-2.5 text-gray-400" />
                                <span className="font-medium">{event.time}</span>
                            </div>
                            <div className="flex items-center text-gray-500 text-sm">
                                <MapPin size={18} className="mr-2.5 text-gray-400" />
                                <span className="truncate">{event.address}</span>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2 text-sm">
                                    <div className="flex items-center text-gray-500 font-medium">
                                        <Users size={18} className="mr-2" />
                                        Equipe
                                    </div>
                                    <span className="text-gray-700 font-bold">{totalFilled}/{totalVacancies} vagas</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div 
                                        className="bg-rose-700 h-2 rounded-full transition-all duration-500" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setViewEvent(event)}
                                    className="flex-1 py-2.5 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm shadow-sm"
                                >
                                    Ver Detalhes
                                </button>
                                <button 
                                    onClick={() => onManage(event.id)}
                                    className="flex-1 py-2.5 px-4 bg-[#9F2A46] text-white rounded-lg font-medium hover:bg-rose-900 transition-colors text-sm shadow-md"
                                >
                                    Gerenciar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
      
      {filteredEvents.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="text-gray-400" size={24}/>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum evento encontrado</h3>
            <p className="text-gray-500 mt-1">Tente ajustar seus filtros de busca ou crie um novo evento.</p>
        </div>
      )}

      {/* View Details Modal */}
      {viewEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="relative h-48 bg-gray-200">
                    <img src={viewEvent.imageUrl} alt={viewEvent.title} className="w-full h-full object-cover" />
                    <button 
                        onClick={() => setViewEvent(null)}
                        className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="absolute bottom-4 left-4">
                         <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm tracking-wide ${getStatusColor(viewEvent.status)}`}>
                            {getStatusLabel(viewEvent.status)}
                        </span>
                    </div>
                </div>
                
                <div className="p-8 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{viewEvent.title}</h2>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
                        <span className="flex items-center gap-1"><Calendar size={16} className="text-rose-500"/> {new Date(viewEvent.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock size={16} className="text-rose-500"/> {viewEvent.time}</span>
                        <span className="flex items-center gap-1"><MapPin size={16} className="text-rose-500"/> {viewEvent.address}</span>
                    </div>
                    
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-2">Sobre o Evento</h3>
                        <p className="text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">{viewEvent.description}</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                             <Users size={18} className="text-rose-600" />
                             Equipe Solicitada
                        </h3>
                        <div className="space-y-2">
                            {viewEvent.functions.map((func) => (
                                <div key={func.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:border-rose-200 transition-colors">
                                    <div>
                                        <p className="font-bold text-gray-700">{func.name}</p>
                                        <p className="text-xs text-gray-400">{func.filled} de {func.vacancies} vagas preenchidas</p>
                                    </div>
                                    <div className="font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full text-sm">
                                        R$ {func.pay}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button 
                        onClick={() => {
                            onManage(viewEvent.id);
                            setViewEvent(null);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                    >
                        Gerenciar Escalas
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                   <div>
                        <h2 className="text-2xl font-bold text-gray-900">Cadastrar Novo Evento</h2>
                        <p className="text-gray-500 text-sm">Preencha os dados e defina as escalas.</p>
                   </div>
                   <button onClick={() => setIsCreateModalOpen(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full p-2 transition-colors">
                     <X size={20} />
                   </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Basic Info */}
                    <section>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-rose-600 rounded-full block"></span>
                            Dados do Evento
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             {/* Image Upload */}
                             <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Capa do Evento</label>
                                <div className="flex items-center gap-4">
                                    <div className="relative w-32 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="flex items-center justify-center w-full px-4 py-3 bg-white border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-rose-400 transition-all group">
                                            <div className="flex items-center space-x-2 text-gray-500 group-hover:text-rose-600">
                                                <Upload size={20} />
                                                <span className="text-sm font-medium">Carregar imagem...</span>
                                            </div>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                        <p className="text-xs text-gray-400 mt-1">Recomendado: 800x400px (JPG, PNG)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Evento</label>
                                <input required name="title" onChange={handleInputChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-gray-900 transition-shadow" placeholder="Ex: Casamento Silva & Souza" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                <input required type="date" name="date" onChange={handleInputChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                                <input required type="time" name="time" onChange={handleInputChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                                <input required name="address" onChange={handleInputChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Rua, Número, Bairro, Cidade" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
                                <select name="type" onChange={handleInputChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none">
                                    <option value="Casamento">Casamento</option>
                                    <option value="Festa Infantil">Festa Infantil</option>
                                    <option value="Corporativo">Corporativo</option>
                                    <option value="Debutante">Debutante</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Observações</label>
                                <textarea name="description" onChange={handleInputChange} className="w-full p-3 bg-white border border-gray-300 rounded-lg h-24 text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none resize-none" placeholder="Detalhes importantes para a equipe..." />
                            </div>
                        </div>
                    </section>

                    {/* Functions & Pay */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                             <div className="flex items-center gap-2">
                                <Users className="text-yellow-600" size={24} />
                                <h3 className="text-xl font-bold text-gray-800">Funções e Valores</h3>
                             </div>
                             <button 
                                type="button"
                                onClick={addFunction} 
                                className="flex items-center text-sm bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <Plus size={16} className="mr-1" /> Adicionar Função
                            </button>
                        </div>
                        
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">Valor Auxiliar de Festa (R$)</label>
                                   <input 
                                      type="number"
                                      value={valuePartyHelper}
                                      onChange={(e) => setValuePartyHelper(Number(e.target.value))}
                                      className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none"
                                   />
                                   <p className="text-xs text-gray-500 mt-2 font-medium">Valor padrão para funções durante o evento</p>
                                </div>
                                <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">Valor Auxiliar Geral (R$)</label>
                                   <input 
                                      type="number"
                                      value={valueGeneralHelper}
                                      onChange={(e) => setValueGeneralHelper(Number(e.target.value))}
                                      className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none"
                                   />
                                   <p className="text-xs text-gray-500 mt-2 font-medium">Inclui pré, durante e pós evento</p>
                                </div>
                             </div>
                        </div>

                        <div className="space-y-4">
                            {functions.map((func, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 items-end hover:border-rose-200 transition-colors">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Função</label>
                                        <input 
                                        value={func.name} 
                                        onChange={(e) => updateFunction(idx, 'name', e.target.value)}
                                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" 
                                        placeholder="Ex: Garçom"
                                        />
                                    </div>
                                    <div className="w-full md:w-40">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor (R$)</label>
                                        <input 
                                        type="number"
                                        value={func.pay} 
                                        onChange={(e) => updateFunction(idx, 'pay', Number(e.target.value))}
                                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-green-500 outline-none" 
                                        />
                                    </div>
                                    <div className="w-full md:w-40">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vagas</label>
                                        <input 
                                        type="number"
                                        value={func.vacancies} 
                                        onChange={(e) => updateFunction(idx, 'vacancies', Number(e.target.value))}
                                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-rose-500 outline-none" 
                                        />
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => removeFunction(idx)}
                                        className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-6 py-3 rounded-lg text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="flex items-center bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition-all hover:scale-[1.02]"
                    >
                        <Save size={20} className="mr-2" /> Publicar Evento
                    </button>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default EventsList;