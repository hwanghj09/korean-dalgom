import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 
            onClick={() => navigate('/')} 
            className="text-xl font-bold cursor-pointer text-blue-600"
          >
            달곰 국어
          </h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}