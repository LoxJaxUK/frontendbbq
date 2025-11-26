import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, Role } from './types';
import Login from './pages/Login';
import Checklist from './pages/Checklist';
import Dashboard from './pages/Dashboard';
import { Menu, LogOut, CheckSquare, BarChart2 } from 'lucide-react';

// Auth Context
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isDashboard = location.pathname === '/dashboard';
  const isChecklist = location.pathname === '/checklist';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-brand-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <span className="bg-white text-brand-600 px-2 py-0.5 rounded-md text-sm">PHOBBQ</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs opacity-80">{user?.department || 'Quản lý'}</div>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-brand-700 rounded-full transition-colors"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4">
        {children}
      </main>

      {/* Mobile Bottom Nav - Only show if manager to switch views, or purely for aesthetic consistent spacing */}
      {user?.role === Role.MANAGER && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <a 
            href="#/checklist" 
            className={`flex flex-col items-center gap-1 ${isChecklist ? 'text-brand-600' : 'text-gray-500'}`}
          >
            <CheckSquare size={24} />
            <span className="text-[10px] font-medium">Việc cần làm</span>
          </a>
          <a 
            href="#/dashboard" 
            className={`flex flex-col items-center gap-1 ${isDashboard ? 'text-brand-600' : 'text-gray-500'}`}
          >
            <BarChart2 size={24} />
            <span className="text-[10px] font-medium">Báo cáo</span>
          </a>
        </nav>
      )}
    </div>
  );
};

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.JSX.Element; allowedRoles?: Role[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect staff trying to access manager pages
    return <Navigate to="/checklist" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('phobbq_token');
    const storedUser = localStorage.getItem('phobbq_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('phobbq_token', authToken);
    localStorage.setItem('phobbq_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('phobbq_token');
    localStorage.removeItem('phobbq_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/checklist" element={
            <ProtectedRoute>
              <Checklist />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={[Role.MANAGER]}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/checklist" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}