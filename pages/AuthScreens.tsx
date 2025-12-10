import React, { useState } from 'react';
import { User, Lock, Mail, Phone, Briefcase, UserPlus } from 'lucide-react';
import { MockService } from '../services/mockService';
import { User as UserType } from '../types';

interface AuthProps {
    onLogin: (user: UserType) => void;
    onNavigate: (screen: 'admin_login' | 'staff_login' | 'staff_register') => void;
}

// SHARED LAYOUT
const AuthLayout: React.FC<{ children: React.ReactNode, title: string, subtitle: string, colorClass: string }> = ({ children, title, subtitle, colorClass }) => (
    <div className={`min-h-screen bg-gradient-to-br ${colorClass} flex items-center justify-center p-4`}>
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-1">Fernanda Prado</h1>
                <p className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Buffet & Eventos</p>
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-1">{title}</h2>
            <p className="text-sm text-gray-500 text-center mb-6">{subtitle}</p>
            {children}
        </div>
    </div>
);

// 1. ADMIN LOGIN - STRICTLY SEPARATED
export const AdminLogin: React.FC<AuthProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = await MockService.login(email, password);
            if (user && user.role === 'ADMIN') {
                onLogin(user);
            } else {
                setError('Acesso negado. Esta área é restrita a administradores.');
                await MockService.logout();
            }
        } catch (err: any) {
            setError('Credenciais inválidas.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Portal Administrativo" subtitle="Gestão Exclusiva do Buffet" colorClass="from-slate-800 to-gray-900">
            <form onSubmit={handleLogin} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">{error}</div>}
                
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email Corporativo</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all text-gray-900"
                            placeholder="admin@fernandaprado.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all text-gray-900"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl mt-4 disabled:opacity-70">
                    {loading ? 'Verificando...' : 'Acessar Painel'}
                </button>
            </form>
            <div className="mt-6 text-center text-xs text-gray-400">
                <Lock size={12} className="inline mr-1" /> Ambiente Seguro
            </div>
        </AuthLayout>
    );
};

// 2. STAFF LOGIN - PUBLIC FACING
export const StaffLogin: React.FC<AuthProps> = ({ onLogin, onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = await MockService.login(email, password);
            if (user && user.role === 'STAFF') {
                onLogin(user);
            } else {
                 // Even if creds work, if role is ADMIN, dont let them login here to avoid confusion
                 if (user?.role === 'ADMIN') {
                     setError('Administradores devem usar o portal específico.');
                     await MockService.logout();
                 } else {
                     setError('Conta não encontrada.');
                 }
            }
        } catch (err: any) {
            setError('Email ou senha incorretos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Área do Colaborador" subtitle="Bem-vindo(a) à equipe Fernanda Prado" colorClass="from-rose-600 to-orange-500">
            <form onSubmit={handleLogin} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">{error}</div>}
                
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email Cadastrado</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-gray-900"
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-gray-900"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl mt-4 disabled:opacity-70">
                    {loading ? 'Entrando...' : 'Acessar Escalas'}
                </button>
            </form>
            
            <div className="mt-6 border-t pt-6 text-center">
                <p className="text-sm text-gray-500 mb-3">Ainda não faz parte da equipe?</p>
                <button 
                    onClick={() => onNavigate('staff_register')}
                    className="text-rose-600 font-bold hover:underline flex items-center justify-center gap-2 w-full"
                >
                    <UserPlus size={16} /> Criar Cadastro Grátis
                </button>
            </div>
        </AuthLayout>
    );
};

// 3. STAFF REGISTER
export const StaffRegister: React.FC<AuthProps> = ({ onLogin, onNavigate }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const newUser = await MockService.registerUser(name, email, phone, password);
            onLogin(newUser);
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Junte-se à Equipe" subtitle="Preencha seus dados para começar a receber eventos" colorClass="from-rose-600 to-orange-500">
            <form onSubmit={handleRegister} className="space-y-4">
                {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">{error}</div>}
                
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-gray-900"
                            placeholder="Seu nome"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-gray-900"
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Telefone / WhatsApp</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            required
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-gray-900"
                            placeholder="(11) 99999-9999"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Criar Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all text-gray-900"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button disabled={loading} type="submit" className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl mt-4 disabled:opacity-70">
                    {loading ? 'Criando Conta...' : 'Finalizar Cadastro'}
                </button>
            </form>
            
            <div className="mt-4 text-center">
                 <button onClick={() => onNavigate('staff_login')} className="text-sm text-gray-500 hover:text-rose-600">
                    Já tenho conta? Fazer Login
                </button>
            </div>
        </AuthLayout>
    );
};
