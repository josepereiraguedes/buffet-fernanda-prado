import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { MockService } from './services/mockService';
import { User } from './types';
import { AdminLogin, StaffLogin, StaffRegister } from './pages/AuthScreens';

// Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageEvent from './pages/admin/ManageEvent';
import EventsList from './pages/admin/EventsList';
import StaffList from './pages/admin/StaffList';
import Approvals from './pages/admin/Approvals';
import Reports from './pages/admin/Reports';
import StaffMarketplace from './pages/staff/StaffMarketplace';
import StaffProfile from './pages/staff/StaffProfile';
import StaffJobs from './pages/staff/StaffJobs';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [manageEventId, setManageEventId] = useState<string | null>(null);
  
  // Auth State (Only for Staff toggling between Login/Register)
  const [staffAuthMode, setStaffAuthMode] = useState<'staff_login' | 'staff_register'>('staff_login');
  
  // Check if we are on the admin path
  const isAdminPath = window.location.pathname.startsWith('/admin');

  useEffect(() => {
    // Restore session if exists
    const loggedUser = MockService.getCurrentUser();
    if (loggedUser) {
      setUser(loggedUser);
      // Ensure redirect to correct dashboard on load
      if (window.location.pathname === '/' || currentPath === '/') {
          setCurrentPath(loggedUser.role === 'ADMIN' ? '/admin/dashboard' : '/staff/marketplace');
      }
    } else {
        // If not logged in, sync currentPath with window
        setCurrentPath(window.location.pathname);
    }
  }, []);

  // SECURITY: Route Protection Logic
  useEffect(() => {
    if (user) {
        // If Staff tries to access Admin pages -> Redirect to Staff Dashboard
        if (user.role === 'STAFF' && currentPath.startsWith('/admin')) {
            console.warn("Acesso não autorizado: Staff tentando acessar Admin. Redirecionando.");
            setCurrentPath('/staff/marketplace');
        }
        
        // If Admin tries to access Staff specific pages (optional) -> Redirect to Admin Dashboard
        if (user.role === 'ADMIN' && currentPath.startsWith('/staff')) {
            setCurrentPath('/admin/dashboard');
        }
    }
  }, [currentPath, user]);

  const handleLogout = async () => {
    await MockService.logout();
    setUser(null);
    setCurrentPath('/');
    setStaffAuthMode('staff_login');
  };

  const navigate = (path: string) => {
    window.scrollTo(0, 0);
    setCurrentPath(path);
  };

  const updateCurrentUser = (u: User) => {
      setUser(u);
  };

  // --- LOGIN ROUTING LOGIC ---
  if (!user) {
      if (isAdminPath) {
          // If URL is /admin..., show strictly Admin Login
          return <AdminLogin onLogin={setUser} onNavigate={() => {}} />;
      } else {
          // Default (Root URL) -> Show Staff Login/Register
          if (staffAuthMode === 'staff_register') {
              return <StaffRegister onLogin={setUser} onNavigate={(screen) => {
                  if (screen === 'staff_login') setStaffAuthMode('staff_login');
              }} />;
          }
          return <StaffLogin onLogin={setUser} onNavigate={(screen) => {
              if (screen === 'staff_register') setStaffAuthMode('staff_register');
          }} />;
      }
  }

  const renderContent = () => {
    // Admin Routes
    if (user.role === 'ADMIN') {
        if (currentPath === '/admin/dashboard') return <AdminDashboard navigate={navigate} />;
        
        if (currentPath === '/admin/events') {
             return <EventsList navigate={navigate} onManage={(id) => { setManageEventId(id); navigate(`/admin/events/${id}`); }} />;
        }
        if (currentPath.startsWith('/admin/events/') && manageEventId) {
            return <ManageEvent eventId={manageEventId} onBack={() => navigate('/admin/events')} />;
        }
        
        if (currentPath === '/admin/staff') return <StaffList />;
        if (currentPath === '/admin/approvals') return <Approvals />;
        if (currentPath === '/admin/reports') return <Reports />;
    }

    // Staff Routes
    if (user.role === 'STAFF') {
        if (currentPath === '/staff/dashboard') return <StaffMarketplace user={user} />;
        if (currentPath === '/staff/marketplace') return <StaffMarketplace user={user} />;
        if (currentPath === '/staff/my-jobs') return <StaffJobs user={user} />;
        if (currentPath === '/staff/profile') return <StaffProfile user={user} onUpdate={updateCurrentUser} />;
    }

    // Fallback if route protection above hasn't triggered yet or valid 404
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Página não encontrada</h2>
            <p className="text-gray-500 mb-6">A página {currentPath} não existe ou você não tem permissão.</p>
            <button 
                onClick={() => navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/staff/marketplace')}
                className="bg-rose-600 text-white px-6 py-2 rounded-lg hover:bg-rose-700"
            >
                Voltar ao Início
            </button>
        </div>
    );
  };

  return (
    <Layout user={user} onLogout={handleLogout} navigate={navigate} currentPath={currentPath}>
      {renderContent()}
    </Layout>
  );
};

export default App;