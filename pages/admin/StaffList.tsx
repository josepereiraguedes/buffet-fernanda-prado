import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Star, Phone, Mail, Filter, Upload, X, Save, Edit2, Trash2, Eye, Shield, Shirt, Wallet, Trophy, Hash, CheckCircle2 } from 'lucide-react';
import { User as UserType, Evaluation } from '../../types';
import { MockService } from '../../services/mockService';
import { useToast } from '../../components/ui/Toast';

const StaffList: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]); // Store all evaluations
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [skillSearch, setSkillSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [detailsUser, setDetailsUser] = useState<UserType | null>(null);
  
  // Evaluation State
  const [evalUser, setEvalUser] = useState<UserType | null>(null);
  const [evalScores, setEvalScores] = useState({ punctuality: 5, posture: 5, productivity: 5, agility: 5 });

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        setLoading(true);
        const [usersData, evalsData] = await Promise.all([
            MockService.getUsers(),
            MockService.getEvaluations()
        ]);
        setUsers(usersData);
        setEvaluations(evalsData);
    } catch (e) {
        console.error(e);
        addToast('error', 'Erro', 'Falha ao carregar dados.');
    } finally {
        setLoading(false);
    }
  };

  const staffUsers = users.filter(u => u.role === 'STAFF');
  const filteredUsers = staffUsers.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || u.type === roleFilter;
      const matchSkill = skillSearch === '' || (u.skills || []).some(s => s.toLowerCase().includes(skillSearch.toLowerCase()));
      
      return matchSearch && matchRole && matchSkill;
  });

  // Metrics
  const totalStaff = staffUsers.length;
  const avgRating = staffUsers.reduce((acc, u) => acc + (u.rating || 0), 0) / (totalStaff || 1);
  const activeUniforms = staffUsers.filter(u => u.uniforms && u.uniforms.length > 0).length;

  // --- Handlers ---

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

  const openCreateModal = () => {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'STAFF',
        type: 'AVULSO',
        avatar: 'https://picsum.photos/seed/newuser/100/100',
        skills: []
      });
      setIsModalOpen(true);
  };

  const openEditModal = (user: UserType) => {
      setEditingUser(user);
      setFormData({
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          type: user.type,
          avatar: user.avatar,
          skills: user.skills,
          uniforms: user.uniforms,
          pixKey: user.pixKey
      });
      setIsModalOpen(true);
  };

  // Logic to open Evaluation Modal with PRE-FILLED data from User Metrics
  const handleOpenEvaluation = (user: UserType) => {
      if (user.metrics) {
          // If we have saved metrics on the profile, use them (Primary Source)
          setEvalScores({
              punctuality: user.metrics.punctuality,
              posture: user.metrics.posture,
              productivity: user.metrics.productivity,
              agility: user.metrics.agility
          });
      } else if (user.rating) {
          // Fallback: Use rating for all sliders if no detailed metrics exist
          // We do NOT round to nearest step here to preserve the exact rating value initially
          const r = user.rating;
          setEvalScores({ punctuality: r, posture: r, productivity: r, agility: r });
      } else {
          // New user, default to 5
          setEvalScores({ punctuality: 5, posture: 5, productivity: 5, agility: 5 });
      }
      
      setEvalUser(user);
  };

  const handleDelete = async (user: UserType) => {
      if (confirm(`Tem certeza que deseja remover ${user.name}?`)) {
          try {
              await MockService.deleteUser(user.id);
              await fetchData();
              addToast('success', 'Removido', 'Colaborador removido com sucesso.');
          } catch (e) {
              addToast('error', 'Erro', 'Não foi possível remover.');
          }
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
          const userToSave: UserType = {
              ...formData as UserType,
              id: editingUser ? editingUser.id : `u_${Date.now()}`,
              rating: editingUser ? editingUser.rating : 5.0,
              points: editingUser ? editingUser.points : 0,
              metrics: editingUser?.metrics // Keep existing metrics if just editing info
          };
          
          await MockService.saveUser(userToSave);
          await fetchData();
          setIsModalOpen(false);
          addToast('success', 'Salvo', editingUser ? 'Dados atualizados.' : 'Colaborador cadastrado.');
      } catch (e) {
          addToast('error', 'Erro', 'Falha ao salvar dados.');
      }
  };

  // Consistent Rounding Logic for Frontend
  const calculateAverage = (s: typeof evalScores) => {
      const avg = (s.punctuality + s.posture + s.productivity + s.agility) / 4;
      return Math.round(avg * 10) / 10;
  };

  const submitEvaluation = async () => {
      if (!evalUser) return;
      
      // Calculate locally to update UI instantly
      const roundedAvg = calculateAverage(evalScores);
      
      try {
        // Optimistic Update
        setUsers(currentUsers => currentUsers.map(u => {
            if (u.id === evalUser.id) {
                return { ...u, rating: roundedAvg, metrics: evalScores };
            }
            return u;
        }));

        const userToUpdate = evalUser; // capture for closure
        setEvalUser(null); // Close modal first
        addToast('success', 'Avaliação Atualizada', `Nova média: ${roundedAvg.toFixed(1)}`);

        // Perform actual save
        await MockService.updateUserPerformance(userToUpdate.id, evalScores);
        
        // Background refresh to ensure consistency
        const updatedUsers = await MockService.getUsers();
        setUsers(updatedUsers);
      } catch (e) {
          console.error(e);
          addToast('error', 'Erro', 'Falha ao salvar avaliação.');
          fetchData(); // Revert on error
      }
  };

  const getGamificationLevel = (points: number = 0) => Math.floor(points / 500) + 1;

  // Calculate live average for the modal display
  const liveAverage = calculateAverage(evalScores).toFixed(1);

  if (loading) return <div className="p-12 text-center text-gray-500">Carregando equipe...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Equipe & Colaboradores</h1>
           <p className="text-gray-500 mt-2 text-lg">Gerenciamento completo do quadro de funcionários.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center justify-center bg-[#EAB308] hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-colors"
        >
          <Plus size={20} className="mr-2" /> Novo Cadastro
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <User size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Total Equipe</p>
                  <p className="text-2xl font-bold text-gray-900">{totalStaff}</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                  <Star size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Nota Média</p>
                  <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Shirt size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Com Uniforme</p>
                  <p className="text-2xl font-bold text-gray-900">{activeUniforms} <span className="text-sm text-gray-400 font-normal">/ {totalStaff}</span></p>
              </div>
          </div>
      </div>

       {/* Filters */}
       <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text"
                placeholder="Buscar por nome ou email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-gray-50/50 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="relative w-full md:w-48">
             <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
             <input 
                type="text"
                placeholder="Filtrar Habilidade..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-gray-50/50 text-sm"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
            />
        </div>
        <select 
            className="p-2 border border-gray-200 rounded-lg bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500 min-w-[140px] text-sm text-gray-600 h-[38px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
        >
            <option value="all">Todos Tipos</option>
            <option value="FIXO">Fixo</option>
            <option value="AVULSO">Avulso</option>
            <option value="DIARISTA">Diarista</option>
        </select>
      </div>

      {/* Rich List View */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[25%]">Colaborador</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status & Nível</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Avaliação</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ativos</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Habilidades</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map(user => {
                      const level = getGamificationLevel(user.points);
                      const hasPix = !!user.pixKey;
                      const hasUniform = user.uniforms && user.uniforms.length > 0;

                      return (
                      <tr key={user.id} className="hover:bg-rose-50/30 transition-colors group">
                          <td className="p-4">
                              <div className="flex items-center gap-4">
                                  <div className="relative">
                                      <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-900 text-sm leading-tight">{user.name}</p>
                                      <div className="flex items-center gap-2 mt-1 text-gray-500 text-xs">
                                          <span className="flex items-center gap-1"><Phone size={10} /> {user.phone}</span>
                                      </div>
                                  </div>
                              </div>
                          </td>
                          <td className="p-4">
                               <div className="flex flex-col items-start gap-1.5">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                        user.type === 'FIXO' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                                        'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        {user.type}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded-md" title={`Total de Pontos: ${user.points || 0}`}>
                                        <Trophy size={12} className="text-orange-500" />
                                        <span>Nível {level}</span>
                                    </div>
                               </div>
                          </td>
                          <td className="p-4">
                               <button 
                                  onClick={(e) => { e.stopPropagation(); handleOpenEvaluation(user); }}
                                  className="group/rating flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent hover:border-yellow-200 hover:bg-yellow-50 transition-all cursor-pointer bg-white"
                                  title="Clique para avaliar este colaborador"
                               >
                                  <Star size={18} className="text-yellow-400 fill-yellow-400 group-hover/rating:scale-110 transition-transform" />
                                  <span className="font-bold text-gray-800 text-lg">{user.rating?.toFixed(1) || '5.0'}</span>
                                  <span className="text-[10px] text-gray-400 font-medium opacity-0 group-hover/rating:opacity-100 transform translate-x-[-5px] group-hover/rating:translate-x-0 transition-all">
                                      Avaliar
                                  </span>
                               </button>
                          </td>
                          <td className="p-4">
                              <div className="flex items-center gap-3">
                                  <div className={`relative group/icon cursor-help p-1.5 rounded-lg border ${hasUniform ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                      <Shirt size={18} />
                                      {hasUniform && (
                                          <div className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-blue-600 rounded-full border border-white"></div>
                                      )}
                                      {hasUniform && (
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[10px] p-2 rounded hidden group-hover/icon:block z-10">
                                              {user.uniforms?.join(', ')}
                                          </div>
                                      )}
                                  </div>
                                  
                                  <div className={`p-1.5 rounded-lg border ${hasPix ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-400'}`} title={hasPix ? `Pix: ${user.pixKey}` : 'Sem Pix cadastrado'}>
                                      <Wallet size={18} />
                                  </div>
                              </div>
                          </td>
                          <td className="p-4">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {user.skills?.slice(0, 2).map((skill, i) => (
                                      <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 font-medium truncate max-w-[90px]">
                                          {skill}
                                      </span>
                                  ))}
                                  {(user.skills?.length || 0) > 2 && (
                                      <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-1 rounded border border-gray-200" title={user.skills?.slice(2).join(', ')}>
                                          +{user.skills!.length - 2}
                                      </span>
                                  )}
                                  {(!user.skills || user.skills.length === 0) && <span className="text-xs text-gray-300">-</span>}
                              </div>
                          </td>
                          <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                  <button onClick={() => setDetailsUser(user)} className="p-2 bg-white border border-gray-200 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors shadow-sm" title="Ver Detalhes">
                                      <Eye size={16} />
                                  </button>
                                  <button onClick={() => openEditModal(user)} className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm" title="Editar">
                                      <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => handleDelete(user)} className="p-2 bg-white border border-gray-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors shadow-sm" title="Excluir">
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          </td>
                      </tr>
                  )})}
                  {filteredUsers.length === 0 && (
                      <tr>
                          <td colSpan={6} className="p-12 text-center text-gray-500 bg-gray-50">
                              <div className="flex flex-col items-center">
                                  <User size={48} className="text-gray-300 mb-2" />
                                  <p className="font-medium">Nenhum colaborador encontrado.</p>
                                  <p className="text-xs">Tente ajustar os filtros de busca.</p>
                              </div>
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                      <h2 className="text-xl font-bold text-gray-900">{editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
                      <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
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
                              <input 
                                value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills} 
                                onChange={e => setFormData({...formData, skills: e.target.value.split(',').map(s => s.trim())})} 
                                className="w-full p-3 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500" 
                                placeholder="Ex: Garçom, Barman"
                              />
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

      {/* Evaluation Modal */}
      {evalUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in zoom-in duration-200 shadow-2xl overflow-hidden flex flex-col">
                <div className="flex justify-between items-start mb-6 border-b pb-4">
                     <div>
                        <h3 className="text-xl font-bold text-gray-900">Avaliar Desempenho</h3>
                        <p className="text-sm text-gray-500">Atribuir nota para <span className="font-semibold text-rose-600">{evalUser.name}</span></p>
                     </div>
                     <div className="flex flex-col items-end">
                         <span className="text-[10px] uppercase font-bold text-gray-400">Média Calculada</span>
                         <span className={`text-3xl font-bold ${
                             Number(liveAverage) >= 4.5 ? 'text-green-600' :
                             Number(liveAverage) >= 3 ? 'text-yellow-600' : 'text-red-600'
                         }`}>
                             {liveAverage}
                         </span>
                     </div>
                </div>
                
                <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                    {Object.keys(evalScores).map((key) => (
                        <div key={key} className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <label className="capitalize text-gray-700 font-bold text-sm">
                                    {key === 'productivity' ? 'Produtividade' : 
                                    key === 'punctuality' ? 'Pontualidade' :
                                    key === 'posture' ? 'Postura' : 'Agilidade'}
                                </label>
                                <span className="font-bold text-rose-600 text-sm">{evalScores[key as keyof typeof evalScores]}</span>
                            </div>
                            <input 
                                type="range" min="1" max="5" step="0.5"
                                value={evalScores[key as keyof typeof evalScores]}
                                onChange={(e) => setEvalScores({...evalScores, [key]: parseFloat(e.target.value)})}
                                className="w-full accent-rose-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
                                <span>Ruim (1)</span>
                                <span>Excelente (5)</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
                    <button onClick={() => setEvalUser(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">Cancelar</button>
                    <button onClick={submitEvaluation} className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold shadow-md transition-colors">Confirmar Nota</button>
                </div>
            </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsUser && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative">
                   <div className="relative h-32 bg-slate-900">
                       <button onClick={() => setDetailsUser(null)} className="absolute top-4 right-4 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 z-10"><X size={18}/></button>
                       <div className="absolute -bottom-10 left-6">
                           <img src={detailsUser.avatar} className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-md" />
                       </div>
                       <div className="absolute bottom-3 right-6 flex gap-2">
                           <span className="text-xs bg-white/10 text-white px-2 py-1 rounded border border-white/20 backdrop-blur">
                               Cadastrado em {new Date().getFullYear()}
                           </span>
                       </div>
                   </div>
                   <div className="pt-12 px-6 pb-6">
                       <div className="flex justify-between items-start">
                           <div>
                                <h2 className="text-2xl font-bold text-gray-900">{detailsUser.name}</h2>
                                <p className="text-gray-500 font-medium">{detailsUser.role} • <span className="text-rose-600">{detailsUser.type}</span></p>
                           </div>
                           <div className="text-right">
                               <p className="text-xs text-gray-400 uppercase font-bold">Nível</p>
                               <p className="text-2xl font-bold text-gray-900">{getGamificationLevel(detailsUser.points)}</p>
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 mt-6">
                           <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                               <p className="text-xs text-yellow-700 font-bold uppercase mb-1">Reputação</p>
                               <div className="flex items-center gap-1 text-lg font-bold text-gray-800">
                                   <Star size={18} className="text-yellow-500 fill-current" /> {detailsUser.rating?.toFixed(1) || '5.0'}
                               </div>
                           </div>
                           <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                               <p className="text-xs text-indigo-700 font-bold uppercase mb-1">Pontos Totais</p>
                               <div className="flex items-center gap-1 text-lg font-bold text-indigo-600">
                                   <Trophy size={18} /> {detailsUser.points || 0}
                               </div>
                           </div>
                       </div>

                       <div className="mt-6 space-y-4">
                           <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
                               <p className="text-xs text-gray-400 font-bold uppercase mb-2">Dados de Contato</p>
                               <p className="text-gray-700 flex items-center gap-2 text-sm font-medium"><Mail size={14} className="text-gray-400"/> {detailsUser.email}</p>
                               <p className="text-gray-700 flex items-center gap-2 text-sm font-medium"><Phone size={14} className="text-gray-400"/> {detailsUser.phone || 'Sem telefone'}</p>
                           </div>
                           
                           {detailsUser.pixKey ? (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-green-700 font-bold uppercase mb-1">Chave Pix (Verificado)</p>
                                        <p className="text-gray-800 font-mono text-sm">{detailsUser.pixKey}</p>
                                    </div>
                                    <CheckCircle2 className="text-green-500" />
                                </div>
                           ) : (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-600 text-sm flex items-center gap-2">
                                    <Wallet size={16} /> Pix não cadastrado
                                </div>
                           )}

                           <div>
                                <p className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center gap-1"><Shirt size={12}/> Uniformes Disponíveis</p>
                                {detailsUser.uniforms && detailsUser.uniforms.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {detailsUser.uniforms.map((u, i) => (
                                            <span key={i} className="text-xs flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1.5 rounded border border-slate-200">
                                                {u}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Nenhum uniforme registrado.</p>
                                )}
                           </div>
                       </div>
                   </div>
               </div>
          </div>
      )}
    </div>
  );
};

export default StaffList;