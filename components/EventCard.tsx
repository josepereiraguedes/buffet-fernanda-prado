import React from 'react';
import { Calendar, MapPin, Users, Clock, DollarSign } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
  showPay?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick, showPay = false }) => {
  const statusColors = {
    ABERTO: 'bg-green-100 text-green-800',
    EM_FORMACAO: 'bg-yellow-100 text-yellow-800',
    CONCLUIDO: 'bg-gray-100 text-gray-800',
    CANCELADO: 'bg-red-100 text-red-800',
  };

  const formattedDate = new Date(event.date).toLocaleDateString('pt-BR');

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="h-40 overflow-hidden relative">
        <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[event.status]}`}>
            {event.status.replace('_', ' ')}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-xs font-medium uppercase tracking-wider">{event.type}</p>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-2 truncate">{event.title}</h3>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-rose-500" />
            <span>{formattedDate} às {event.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin size={16} className="text-rose-500" />
            <span className="truncate">{event.address}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-rose-500" />
            <span>{event.functions.reduce((acc, curr) => acc + curr.vacancies, 0)} vagas no total</span>
          </div>
        </div>

        {showPay && (
          <div className="border-t pt-3 mt-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Oportunidades</p>
            <div className="flex flex-wrap gap-2">
              {event.functions.slice(0, 3).map(f => (
                <div key={f.id} className="inline-flex items-center bg-gray-50 px-2 py-1 rounded border border-gray-200 text-xs">
                  <span className="font-medium mr-1">{f.name}:</span>
                  <span className="text-green-600 font-bold">R$ {f.pay}</span>
                </div>
              ))}
              {event.functions.length > 3 && (
                <span className="text-xs text-gray-400 py-1">+ {event.functions.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;