import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { User, Role } from './types';
import Login from './pages/Login';
import Checklist from './pages/Checklist';
import Dashboard from './pages/Dashboard';
import Rules from './pages/Rules';
import Training from './pages/Training';
import AdminPage from './pages/Admin';
import { Menu, LogOut, CheckSquare, BarChart2, BookOpen, PlayCircle, Settings, X } from 'lucide-react';

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

// Sidebar / Navigation Component
const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const menuItems = [
    { label: 'Công Việc', icon: CheckSquare, to: '/checklist', roles: ['admin', 'manager', 'kitchen', 'service'] },
    { label: 'Báo Cáo', icon: BarChart2, to: '/dashboard', roles: ['admin', 'manager'] },
    { label: 'Nội Quy', icon: BookOpen, to: '/rules', roles: ['admin', 'manager', 'kitchen', 'service'] },
    { label: 'Đào Tạo', icon: PlayCircle, to: '/training', roles: ['admin', 'manager', 'kitchen', 'service'] },
    { label: 'Quản Trị', icon: Settings, to: '/admin', roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose}></div>}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:block md:z-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
           <span className="font-extrabold text-2xl text-brand-600">PHOBBQ</span>
           <button onClick={onClose} className="md:hidden text-gray-500"><X size={24}/></button>
        </div>

        <div className="p-4 space-y-2">
          {filteredMenu.map(item => (
            <Link 
              key={item.to} 
              to={item.to} 
              onClick={() => onClose()}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${path === item.to ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-100 bg-gray-50">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                 {user?.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                 <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                 <p className="text-xs text-gray-500 capitalize">{user?.role === 'kitchen' ? 'Bếp' : user?.role === 'service' ? 'Phục vụ' : user?.role}</p>
              </div>
           </div>
           <button onClick={logout} className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 w-full px-4 py-2 rounded-lg transition-colors">
              <LogOut size={16} /> Đăng Xuất
           </button>
        </div>
      </aside>
    </>
  );
};

// Layout
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const getTitle = () => {
     switch(location.pathname) {
        case '/checklist': return 'Danh Sách Công Việc';
        case '/dashboard': return 'Dashboard & Báo Cáo';
        case '/rules': return 'Nội Quy Nhà Hàng';
        case '/training': return 'Quy Trình Chuẩn (SOP)';
        case '/admin': return 'Quản Trị Hệ Thống';
        default: return 'PHOBBQ';
     }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
         {/* Mobile Header */}
         <header className="bg-white shadow-sm h-16 flex items-center px-4 sticky top-0 z-30 md:hidden">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600">
               <Menu size={24} />
            </button>
            <h1 className="ml-2 font-bold text-gray-800">{getTitle()}</h1>
         </header>

         {/* Desktop Header Title (Optional, mostly for spacing) */}
         <header className="hidden md:flex h-16 items-center px-8 bg-white border-b border-gray-100 sticky top-0 z-20">
            <h1 className="text-xl font-bold text-gray-800">{getTitle()}</h1>
         </header>

         <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full">
               {children}
            </div>
         </main>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.JSX.Element; allowedRoles?: Role[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
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
          
          <Route path="/checklist" element={<ProtectedRoute><Checklist /></ProtectedRoute>} />
          <Route path="/rules" element={<ProtectedRoute><Rules /></ProtectedRoute>} />
          <Route path="/training" element={<ProtectedRoute><Training /></ProtectedRoute>} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={[Role.ADMIN, Role.MANAGER]}><Dashboard /></ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}><AdminPage /></ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/checklist" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}