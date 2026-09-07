import { Link } from 'react-router-dom';
import { ShoppingCart, Search } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { config } from '../config';

export function Header() {
  const cartItemCount = useCartStore((state) => state.getCartItemCount());

  return (
    <header className="bg-zinc-900 shadow-none sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-amber-500 text-zinc-950 p-2 border-r-4 border-b-4 border-amber-600 rounded-sm transform -skew-x-6 group-hover:skew-x-0 transition-transform">
              <span className="font-bold text-xl leading-none italic font-heading">GXP</span>
            </div>
            <span className="font-bold font-heading uppercase tracking-widest text-xl text-zinc-100 hidden sm:block italic">{config.businessName}</span>
          </Link>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            <a href="/#catalog" className="text-zinc-400 hover:text-amber-500 p-2">
              <Search className="w-5 h-5" />
            </a>
            
            <Link to="/cart" className="text-zinc-400 hover:text-amber-500 p-2 relative">
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-sm h-5 w-5 flex items-center justify-center transform translate-x-1 -translate-y-1">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
