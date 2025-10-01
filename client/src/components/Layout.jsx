import React from 'react';
import Navigation from './Navigation';
import Breadcrumb from './Breadcrumb';

const Layout = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Sidebar Navigation */}
      <Navigation user={user} onLogout={onLogout} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          {/* Breadcrumb Navigation */}
          <Breadcrumb user={user} />
          
          {/* Page Content */}
          <div className="mt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
