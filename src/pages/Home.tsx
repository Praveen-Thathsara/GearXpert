import React from "react";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Products } from './Products';

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}#catalog`);
    } else {
      navigate(`/#catalog`);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-zinc-950">
      {/* Minimal Hero Section */}
      <section className="bg-zinc-950 text-zinc-100 py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-900 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
            <span className="text-amber-500 font-heading">GEARXPERT</span> PARTS CATALOG
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Find the exact vehicle and motorcycle spare parts you need. Fast, simple, and reliable.
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row max-w-lg mx-auto pt-4 shadow-2xl">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search parts, brands, models..."
                className="block w-full pl-12 pr-4 py-4 border border-zinc-800 rounded-t-sm sm:rounded-l-sm sm:rounded-t-none bg-zinc-900 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-4 px-8 rounded-b-sm sm:rounded-r-sm sm:rounded-b-none transition-colors whitespace-nowrap uppercase tracking-wider text-lg"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Full Catalog Section */}
      <section id="catalog" className="py-8 md:py-12 bg-zinc-950 px-4 sm:px-6 lg:px-8 scroll-mt-20 flex-grow">
        <div className="max-w-7xl mx-auto">
          <Products />
        </div>
      </section>
    </div>
  );
}
