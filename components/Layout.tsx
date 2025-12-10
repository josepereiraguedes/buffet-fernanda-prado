import React, { useState } from 'react';
import { User, LogOut, Calendar, Users, Home, Award, Menu, X, CheckSquare, BarChart3, Settings } from 'lucide-react';
import { User as UserType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: UserType;
  onLogout: () => void;
  navigate: (path: string) => void;
  currentPath: string;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, navigate, currentPath }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user.role === 'ADMIN';

  const menuItems = isAdmin
    ? [
        { label: 'Dashboard', icon: Home, path: '/admin/dashboard' },
        { label: 'Meus Eventos', icon: Calendar, path: '/admin/events' },
        { label: 'Aprovações', icon: CheckSquare, path: '/admin/approvals' },
        { label: 'Colaboradores', icon: Users, path: '/admin/staff' },
        { label: 'Relatórios', icon: BarChart3, path: '/admin/reports' },
      ]
    : [
        { label: 'Mural de Eventos', icon: Home, path: '/staff/marketplace' },
        { label: 'Minhas Escalas', icon: Calendar, path: '/staff/my-jobs' },
        { label: 'Meu Perfil', icon: User, path: '/staff/profile' },
      ];

  const handleNav = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white z-50 px-4 py-3 shadow-sm flex items-center justify-between">
        <span className="font-bold text-lg text-rose-600">Fernanda Prado</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h1 className="text-xl font-bold text-rose-500 leading-tight">Fernanda Prado</h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Buffet & Eventos</p>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPath === item.path
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center space-x-3 mb-4">
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-rose-500 object-cover" />
              <div>
                <p className="text-sm font-medium truncate max-w-[140px]">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role === 'ADMIN' ? 'Administrador' : 'Colaborador'}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 min-h-screen transition-all">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;