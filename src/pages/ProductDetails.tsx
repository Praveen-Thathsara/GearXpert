import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, ShieldCheck, Truck } from 'lucide-react';
import { fetchProducts } from '../api';
import { Product } from '../types';
import { useCartStore } from '../store/cartStore';
import { WhatsAppButton } from '../components/WhatsAppButton';

export function ProductDetails() {
  const { slug } = useParams(); // Using ID directly as route param
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const products = await fetchProducts();
        const found = products.find(p => p.id === slug);
        setProduct(found || null);
      } catch (error) {
        console.error('Failed to load product', error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="h-8 w-32 bg-zinc-800 rounded mb-8"></div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square bg-zinc-800 rounded-sm"></div>
          <div className="space-y-6">
            <div className="h-10 bg-zinc-800 rounded w-3/4"></div>
            <div className="h-6 bg-zinc-800 rounded w-1/4"></div>
            <div className="h-24 bg-zinc-800 rounded"></div>
            <div className="h-12 bg-zinc-800 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-zinc-100 mb-4">Product Not Found</h2>
        <p className="text-zinc-400 mb-8">The part you are looking for does not exist or has been removed.</p>
        <Link to="/#catalog" className="bg-amber-500 text-zinc-950 font-medium py-3 px-6 rounded-sm hover:bg-amber-400">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-zinc-400 mb-8">
        <Link to="/#catalog" className="hover:text-amber-500 flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Catalog
        </Link>
        <span className="mx-3">/</span>
        <span className="truncate">{product.category}</span>
        <span className="mx-3">/</span>
        <span className="font-medium text-zinc-100 truncate">{product.name}</span>
      </nav>

      <div className="bg-zinc-900 rounded-sm shadow-none border border-zinc-800 overflow-hidden">
        <div className="grid md:grid-cols-2">
          
          {/* Product Image area */}
          <div className="bg-zinc-950 aspect-square md:aspect-auto flex items-center justify-center p-12 border-b md:border-b-0 md:border-r border-zinc-800 relative">
             <div className="absolute top-6 left-6 flex flex-col gap-2">
                <span className="bg-zinc-900 text-zinc-200 font-semibold px-3 py-1 rounded-sm shadow-none border border-zinc-700 text-sm">
                  {product.brand}
                </span>
                <span className={`text-xs font-medium px-3 py-1 rounded-sm shadow-none w-max ${
                  product.availability === 'In Stock' 
                    ? 'bg-green-100 text-green-800' 
                    : product.availability.includes('Limited')
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {product.availability}
                </span>
             </div>
             <span className="text-zinc-500 font-medium text-2xl text-center leading-tight">
               {product.name}
               <span className="block text-sm text-zinc-400 mt-3 font-normal">High-Resolution Image Placeholder</span>
             </span>
          </div>

          {/* Product Info area */}
          <div className="p-8 md:p-12 flex flex-col">
            <div className="mb-2 text-amber-500 font-semibold tracking-wide uppercase text-sm">
              {product.category}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100 mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 text-zinc-400 mb-8 pb-8 border-b border-zinc-800">
              <div>Part No: <span className="font-mono text-zinc-100 font-medium">{product.partNumber}</span></div>
              <div className="w-1 h-1 bg-gray-300 rounded-sm"></div>
              <div>Model: <span className="font-medium text-zinc-100">{product.model}</span></div>
            </div>

            <div className="text-3xl font-bold text-zinc-100 mb-8">
              {product.showPrice ? `Rs. ${product.price.toLocaleString()}` : 'Contact for Price'}
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-zinc-100 mb-3 text-lg">Compatibility</h3>
              <p className="text-zinc-400 leading-relaxed">
                This part is guaranteed to fit <strong>{product.brand} {product.model}</strong>. Please contact us on WhatsApp if you are unsure about compatibility with your specific vehicle year or variant.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex items-center border border-zinc-700 rounded-sm overflow-hidden h-14 bg-zinc-900 sm:w-32 shrink-0">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-amber-500 transition-colors"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    readOnly
                    className="flex-1 text-center font-bold text-zinc-100 outline-none w-full h-full border-x border-zinc-700"
                  />
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-amber-500 transition-colors"
                  >
                    +
                  </button>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium h-14 px-8 rounded-sm transition-colors text-lg shadow-none"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Request
                </button>
              </div>

              <div className="w-full">
                <WhatsAppButton 
                  message={`Hello, I am interested in ${product.name} (Part No: ${product.partNumber}). Is this available?`}
                  className="w-full h-14 text-lg"
                >
                  Ask on WhatsApp
                </WhatsAppButton>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-800">
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                Quality Assured
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-400">
                <Truck className="w-5 h-5 text-amber-500" />
                Fast Confirmation
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
