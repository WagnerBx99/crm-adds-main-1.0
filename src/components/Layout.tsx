import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TinyConfigForm from './integrations/TinyConfigForm';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTinyConfig, setShowTinyConfig] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleTinyConfigSave = () => {
    setShowTinyConfig(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-blue-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30`}>
        <div className="flex items-center justify-between px-4">
          <h2 className="text-2xl font-bold">CRM ADDS</h2>
          <button onClick={toggleSidebar} className="md:hidden">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <nav>
          <Link to="/" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700">
            Dashboard
          </Link>
          <Link to="/clients" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700">
            Clientes
          </Link>
          <Link to="/orders" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700">
            Pedidos
          </Link>
          
          {/* Seção de integrações */}
          <div className="pt-4">
            <h3 className="text-xs text-blue-200 font-semibold uppercase px-4 mb-2">Integrações</h3>
            
            <button 
              onClick={() => setShowTinyConfig(true)}
              className="w-full text-left block py-2.5 px-4 rounded transition duration-200 hover:bg-blue-700"
            >
              Tiny ERP
            </button>
          </div>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-md">
          <div className="flex items-center justify-between p-4">
            <button onClick={toggleSidebar} className="md:hidden">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <div className="text-xl font-semibold">CRM ADDS - Sistema Integrado</div>
            <div className="flex items-center">
              <span className="mr-4">Usuário</span>
              <div className="bg-blue-600 text-white p-2 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
            </div>
          </div>
        </header>
        
        {/* Content area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
      
      {/* Modal de configuração do Tiny */}
      {showTinyConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Configuração do Tiny ERP</h2>
              <button 
                onClick={() => setShowTinyConfig(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <TinyConfigForm onSave={handleTinyConfigSave} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout; 