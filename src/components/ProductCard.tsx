import React from "react";
import { Link } from 'react-router-dom';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import { config } from '../config';

interface ProductCardProps {
  product: Product;
  key?: React.Key;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const getWhatsAppLink = () => {
    const message = encodeURIComponent(
      `Hello, I am interested in ${product.name} (Part No: ${product.partNumber}). Is this available?`
    );
    const numericNumber = config.whatsapp.replace(/[^0-9]/g, '');
    return `https://wa.me/${numericNumber}?text=${message}`;
  };

  return (
    <div className="bg-zinc-900 rounded-sm border border-zinc-800 overflow-hidden hover:border-amber-500/50 transition-colors flex flex-col h-full group">
      {/* Image Placeholder */}
      <div className="aspect-[16/9] bg-zinc-800 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/10 to-transparent z-10" />
        <span className="text-zinc-500 font-medium text-sm text-center leading-tight">
          {product.name}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2 gap-2">
          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-sm uppercase tracking-wider truncate">
            {product.category}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm whitespace-nowrap ${
            product.availability === 'In Stock' 
              ? 'bg-green-500/10 text-green-500' 
              : product.availability.includes('Limited')
                ? 'bg-orange-500/10 text-orange-500'
                : 'bg-red-500/10 text-red-500'
          }`}>
            {product.availability}
          </span>
        </div>

        <h3 className="font-bold text-zinc-100 text-sm mb-1 leading-tight group-hover:text-amber-500 transition-colors line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-xs text-zinc-500 mb-2">
          PN: <span className="font-mono text-zinc-400">{product.partNumber}</span>
        </p>

        <p className="text-xs text-zinc-500 mb-4 line-clamp-1 flex-grow">
          Fits: {product.brand} {product.model}
        </p>

        <div className="mt-auto pt-3 border-t border-zinc-800">
          <div className="font-bold text-zinc-100 mb-3 text-sm">
            {product.showPrice ? `Rs. ${product.price.toLocaleString()}` : 'Contact Price'}
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => addItem(product)}
              className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-1.5 px-3 text-xs rounded-sm transition-colors uppercase tracking-wide"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Add
            </button>
            <div className="flex gap-1.5">
              <Link
                to={`/products/${product.id}`}
                className="flex-1 text-center bg-zinc-950 hover:bg-zinc-800 text-zinc-400 font-bold py-1.5 px-3 text-xs rounded-sm transition-colors border border-zinc-800 uppercase tracking-wide"
              >
                Details
              </Link>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center bg-zinc-950 hover:bg-zinc-800 text-green-500 p-1.5 rounded-sm transition-colors border border-zinc-800"
                title="Ask on WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
