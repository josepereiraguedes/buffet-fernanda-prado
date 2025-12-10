import React, { useState } from 'react';
import { User, Save, Upload, Star, Award, Shirt, Shield } from 'lucide-react';
import { User as UserType } from '../../types';
import { MockService } from '../../services/mockService';

interface StaffProfileProps {
  user: UserType;
  onUpdate: (u: UserType) => void;
}

const UNIFORM_OPTIONS = [
    'Calça Social Preta', 'Camisa Social Branca', 'Sapato Social Preto', 
    'Avental Preto', 'Dolmã Branca', 'Touca', 'Luvas Brancas', 'Gravata Borboleta'
];

const StaffProfile: React.FC<StaffProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
      name: user.name,
      phone: user.phone || '',
      skills: user.skills?.join(', ') || '',
      avatar: user.avatar,
      uniforms: user.uniforms || [],
      pixKey: user.pixKey || ''
  });

  // Gamification Logic
  const points = user.points || 0;
  const level = Math.floor(points / 500) + 1;
  const nextLevel = level * 500;
  const progress = ((points - (level - 1) * 500) / 500) * 100;

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      const updatedUser: UserType = {
          ...user,
          name: formData.name,
          phone: formData.phone,
          skills: formData.skills.split(',').map(s => s.trim()),
          avatar: formData.avatar,
          uniforms: formData.uniforms,
          pixKey: formData.pixKey
      };
      
      MockService.saveUser(updatedUser);
      onUpdate(updatedUser);
      setIsEditing(false);
      alert('Perfil atualizado com sucesso!');
  };

  const toggleUniform = (item: string) => {
      if (formData.uniforms.includes(item)) {
          setFormData({ ...formData, uniforms: formData.uniforms.filter(u => u !== item) });
      } else {
          setFormData({ ...formData, uniforms: [...formData.uniforms, item] });
      }
  };

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Gamification */}
        <div className="space-y-6">
            {/* Gamification Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider">Seu Nível</p>
                            <h2 className="text-4xl font-bold text-white mt-1">{level}</h2>
                        </div>
                        <Award size={48} className="text-yellow-400" />
                    </div>
                    
                    <div className="mb-2 flex justify-between text-xs text-indigo-200 font-medium">
                        <span>{points} pts</span>
                        <span>Próximo: {nextLevel} pts</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                        <div className="bg-gradient-to-r from-rose-500 to-orange-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-xs text-indigo-300 mt-4">
                        Ganhe pontos completando eventos com pontualidade e recebendo boas avaliações!
                    </p>
                </div>
                {/* Decorative circles */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl"></div>
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
            </div>

            {/* Reputation Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Star className="text-yellow-500" /> Reputação
                </h3>
                <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl font-bold text-gray-900">{user.rating?.toFixed(1) || '5.0'}</div>
                    <div className="flex text-yellow-400">
                        {[1,2,3,4,5].map(s => <Star key={s} size={20} className={s <= Math.round(user.rating || 5) ? 'fill-current' : 'text-gray-200'} />)}
                    </div>
                </div>
                <p className="text-sm text-gray-500">
                    Sua nota média baseada nas avaliações dos administradores após cada evento.
                </p>
            </div>
        </div>

        {/* Right Column: Profile Form */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Dados do Perfil</h2>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-rose-600 font-bold text-sm hover:underline">
                            Editar Perfil
                        </button>
                    )}
                </div>

                <form onSubmit={handleSave} className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                         <div className="flex flex-col items-center gap-3">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm relative group">
                                <img src={formData.avatar} className="w-full h-full object-cover" />
                                {isEditing && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Upload className="text-white" />
                                    </div>
                                )}
                            </div>
                            {isEditing && (
                                <label className="text-xs text-rose-600 font-bold cursor-pointer hover:underline">
                                    Alterar Foto
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            )}
                         </div>

                         <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                                    <input 
                                        disabled={!isEditing}
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 disabled:text-gray-500 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone / WhatsApp</label>
                                    <input 
                                        disabled={!isEditing}
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 disabled:text-gray-500 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Habilidades</label>
                                    <input 
                                        disabled={!isEditing}
                                        value={formData.skills}
                                        onChange={e => setFormData({...formData, skills: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 disabled:text-gray-500 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none transition-colors"
                                        placeholder="Ex: Garçom, Barman, Copeira"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Separe por vírgulas.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chave Pix</label>
                                    <input 
                                        disabled={!isEditing}
                                        value={formData.pixKey}
                                        onChange={e => setFormData({...formData, pixKey: e.target.value})}
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 disabled:text-gray-500 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none transition-colors"
                                        placeholder="CPF, Email ou Aleatória"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Contrato</label>
                                     <div className="p-2 bg-gray-100 rounded text-gray-600 text-sm font-medium">{user.type}</div>
                                </div>
                                <div>
                                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                     <div className="p-2 bg-gray-100 rounded text-gray-600 text-sm font-medium truncate">{user.email}</div>
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                             <Shirt className="text-gray-400" /> Meus Uniformes
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">Selecione as vestimentas que você possui. Isso ajuda a sugerir eventos compatíveis.</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {UNIFORM_OPTIONS.map(item => (
                                <button
                                    key={item}
                                    type="button"
                                    disabled={!isEditing}
                                    onClick={() => toggleUniform(item)}
                                    className={`text-sm p-3 rounded-lg border text-left transition-all ${
                                        formData.uniforms.includes(item)
                                            ? 'bg-rose-50 border-rose-200 text-rose-700 font-medium'
                                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {formData.uniforms.includes(item) && <span className="mr-2 text-rose-500">✓</span>}
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                            <button 
                                type="button" 
                                onClick={() => { setIsEditing(false); setFormData({ ...formData, name: user.name, pixKey: user.pixKey || '' }); }}
                                className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="px-6 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md flex items-center"
                            >
                                <Save size={18} className="mr-2" /> Salvar Alterações
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    </div>
  );
};

export default StaffProfile;