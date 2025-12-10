import React, { useEffect, useState } from 'react';
import { DollarSign, Trophy, TrendingUp, Users } from 'lucide-react';
import { MockService } from '../../services/mockService';
import { Event, User } from '../../types';

const Reports: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setEvents(MockService.getEvents());
    setUsers(MockService.getUsers());
  }, []);

  // Stats Calculation
  const finishedEvents = events.filter(e => e.status === 'CONCLUIDO');
  const totalCost = finishedEvents.reduce((acc, event) => {
    return acc + event.functions.reduce((fAcc, func) => fAcc + (func.pay * func.filled), 0);
  }, 0);
  
  const totalStaffWorked = finishedEvents.reduce((acc, event) => {
      return acc + event.functions.reduce((fAcc, func) => fAcc + func.filled, 0);
  }, 0);

  const bestStaff = users
    .filter(u => u.role === 'STAFF')
    .sort((a,b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Relatórios & Métricas</h1>
        <p className="text-gray-500 mt-2 text-lg">Analise o desempenho financeiro e operacional.</p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-white/20 rounded-full"><DollarSign size={24} /></div>
                  <span className="text-rose-100 font-medium">Custo Total (Eventos Concluídos)</span>
              </div>
              <p className="text-3xl font-bold">R$ {totalCost.toLocaleString('pt-BR')}</p>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
               <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Users size={24} /></div>
                  <span className="text-gray-500 font-medium">Escalas Realizadas</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">{totalStaffWorked}</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
               <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><TrendingUp size={24} /></div>
                  <span className="text-gray-500 font-medium">Média de Avaliações</span>
              </div>
              <p className="text-3xl font-bold text-gray-800">4.8/5.0</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ranking */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                 <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                     <Trophy className="text-yellow-500" /> Ranking de Colaboradores
                 </h3>
             </div>
             <div>
                 {bestStaff.map((staff, idx) => (
                     <div key={staff.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>
                                {idx + 1}
                            </span>
                            <img src={staff.avatar} className="w-10 h-10 rounded-full" />
                            <div>
                                <p className="font-bold text-gray-900">{staff.name}</p>
                                <p className="text-xs text-gray-500">{staff.type}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-gray-800">
                            <StarFill score={staff.rating || 0} /> {staff.rating}
                        </div>
                     </div>
                 ))}
             </div>
          </div>

          {/* Recent History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100">
                 <h3 className="text-xl font-bold text-gray-800">Histórico Financeiro Recente</h3>
             </div>
             <table className="w-full text-left">
                 <thead className="bg-gray-50">
                     <tr>
                         <th className="p-4 text-xs font-bold text-gray-500 uppercase">Evento</th>
                         <th className="p-4 text-xs font-bold text-gray-500 uppercase">Data</th>
                         <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Custo Pessoal</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {finishedEvents.slice(0, 6).map(event => {
                         const cost = event.functions.reduce((acc, f) => acc + (f.pay * f.filled), 0);
                         return (
                            <tr key={event.id}>
                                <td className="p-4 font-medium text-gray-800 truncate max-w-[200px]">{event.title}</td>
                                <td className="p-4 text-gray-500 text-sm">{new Date(event.date).toLocaleDateString()}</td>
                                <td className="p-4 text-right font-bold text-rose-600">- R$ {cost}</td>
                            </tr>
                         )
                     })}
                 </tbody>
             </table>
          </div>
      </div>
    </div>
  );
};

const StarFill = ({ score }: { score: number }) => {
    // Simple helper for star icon
    return <span className="text-yellow-500 text-lg">★</span>;
}

export default Reports;