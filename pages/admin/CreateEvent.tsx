import React, { useState } from 'react';
import { Plus, Trash, Save, ArrowLeft } from 'lucide-react';
import { Event, EventFunction } from '../../types';
import { MockService } from '../../services/mockService';

interface CreateEventProps {
  onBack: () => void;
}

const CreateEvent: React.FC<CreateEventProps> = ({ onBack }) => {
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

  const [functions, setFunctions] = useState<Partial<EventFunction>[]>([
    { id: 'f_aux_festa', name: 'Auxiliar de Festa (Somente Evento)', pay: 150, vacancies: 4, filled: 0 },
    { id: 'f_aux_geral', name: 'Auxiliar Geral (Pré/Durante/Pós)', pay: 200, vacancies: 2, filled: 0 },
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: Event = {
      ...formData as Event,
      id: `e_${Date.now()}`,
      functions: functions as EventFunction[],
    };
    MockService.saveEvent(newEvent);
    onBack();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={20} className="mr-2" /> Voltar para Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">Cadastrar Novo Evento</h2>
          <p className="text-gray-500">Preencha os dados e defina as escalas.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Info */}
          <section>
            <h3 className="text-lg font-semibold text-rose-600 mb-4 border-b pb-2">1. Dados do Evento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Evento</label>
                <input required name="title" onChange={handleInputChange} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Ex: Casamento Silva & Souza" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input required type="date" name="date" onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                <input required type="time" name="time" onChange={handleInputChange} className="w-full p-2 border rounded-lg" />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                <input required name="address" onChange={handleInputChange} className="w-full p-2 border rounded-lg" placeholder="Rua, Número, Bairro, Cidade" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
                <select name="type" onChange={handleInputChange} className="w-full p-2 border rounded-lg">
                  <option value="Casamento">Casamento</option>
                  <option value="Festa Infantil">Festa Infantil</option>
                  <option value="Corporativo">Corporativo</option>
                  <option value="Debutante">Debutante</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Observações</label>
                <textarea name="description" onChange={handleInputChange} className="w-full p-2 border rounded-lg h-24" placeholder="Detalhes importantes para a equipe..." />
              </div>
            </div>
          </section>

          {/* Functions & Pay */}
          <section>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-semibold text-rose-600">2. Funções e Pagamentos</h3>
              <button type="button" onClick={addFunction} className="flex items-center text-sm text-rose-600 font-medium hover:text-rose-700">
                <Plus size={16} className="mr-1" /> Adicionar Função
              </button>
            </div>

            <div className="space-y-4">
              {functions.map((func, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Função</label>
                    <input 
                      value={func.name} 
                      onChange={(e) => updateFunction(idx, 'name', e.target.value)}
                      className="w-full p-2 border rounded text-sm" 
                      placeholder="Nome da função"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Valor (R$)</label>
                    <input 
                      type="number"
                      value={func.pay} 
                      onChange={(e) => updateFunction(idx, 'pay', Number(e.target.value))}
                      className="w-full p-2 border rounded text-sm font-semibold text-green-700" 
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Vagas</label>
                    <input 
                      type="number"
                      value={func.vacancies} 
                      onChange={(e) => updateFunction(idx, 'vacancies', Number(e.target.value))}
                      className="w-full p-2 border rounded text-sm" 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeFunction(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded mb-[2px]"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end pt-6 border-t">
            <button type="submit" className="flex items-center bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition-colors">
              <Save size={20} className="mr-2" /> Publicar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;