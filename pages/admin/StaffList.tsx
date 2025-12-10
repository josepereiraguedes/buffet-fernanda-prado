import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Star, Phone, Mail, Filter, Upload, X, Save } from 'lucide-react';
import { User as UserType } from '../../types';
import { MockService } from '../../services/mockService';

const StaffList: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Add Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<UserType>>({
      name: '',
      email: '',
      phone: '',
      role: 'STAFF',
      type: 'AVULSO',
      avatar: 'https://picsum.photos/seed/newuser/100/100',
      skills: []
  });

  useEffect(() => {
    setUsers(MockService.getUsers());
  }, []);

  const staffUsers = users.filter(u => u.role === 'STAFF');
  const filteredUsers = staffUsers.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || u.type === roleFilter;
      return matchSearch && matchRole;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const newUser: UserType = {
          ...formData as UserType,
          id: `u_${Date.now()}`,
          rating: 5.0
      };
      
      // Persist to MockService
      MockService.saveUser(newUser);
      
      // Update local state
      setUsers(MockService.getUsers());
      setIsModalOpen(false);
      
      // Reset Form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'STAFF',
        type: 'AVULSO',
        avatar: 'https://picsum.photos/seed/newuser/100/100',
        skills: []
    });
      alert("Colaborador cadastrado com sucesso!");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Colaboradores</h1>
           <p className="text-gray-500 mt-2 text-lg">Gerencie sua equipe e perfis</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center bg-[#EAB308] hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors"
        >
          <Plus size={20} className="mr-2" /> Novo Colaborador
        </button>
      </div>

       {/* Filters */}
       <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full md:w-auto p-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text"
                placeholder="Buscar colaborador..."
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-gray-50/50 text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <select 
            className="p-2.5 border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500 min-w-[160px] text-gray-600"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
        >
            <option value="all">Todos os tipos</option>
            <option value="FIXO">Fixo</option>
            <option value="AVULSO">Avulso</option>
            <option value="DIARISTA">Diarista</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map(user => (
              <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all p-6">
                  <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                          <img src={user.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" />
                          <div>
                              <h3 className="font-bold text-lg text-gray-900">{user.name}</h3>
                              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-medium">{user.type}</span>
                          </div>
                      </div>
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded text-yellow-600 font-bold">
                          <Star size={16} className="fill-current mr-1" />
                          {user.rating}
                      </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          {user.email}
                      </div>
                      <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          {user.phone || 'N/A'}
                      </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                      {user.skills?.map((skill, i) => (
                          <span key={i} className="text-xs bg-rose-50 text-rose-700 px-2 py-1 rounded border border-rose-100">
                              {skill}
                          </span>
                      ))}
                  </div>
              </div>
          ))}
          {filteredUsers.length === 0 && (
             <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed">
                Nenhum colaborador encontrado com estes filtros.
             </div>
          )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                      <h2 className="text-xl font-bold text-gray-900">Novo Colaborador</h2>
                      <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                      <div className="flex items-center gap-6 mb-6">
                          <div className="relative w-24 h-24 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                              <img src={formData.avatar} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm inline-flex items-center">
                                <Upload size={16} className="mr-2" /> Alterar Foto
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                          <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                              <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500">
                                  <option value="AVULSO">Avulso</option>
                                  <option value="FIXO">Fixo</option>
                                  <option value="DIARISTA">Diarista</option>
                              </select>
                          </div>
                           <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Habilidades (separar por vírgula)</label>
                              <input placeholder="Ex: Garçom, Barman" onBlur={e => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})} className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500" />
                          </div>
                      </div>

                      <div className="flex justify-end pt-4">
                          <button type="submit" className="bg-rose-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-rose-700 shadow-md flex items-center">
                              <Save size={20} className="mr-2" /> Salvar Cadastro
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default StaffList;