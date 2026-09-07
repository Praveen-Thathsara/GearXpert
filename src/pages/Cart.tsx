import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingCart, Plus, Minus, Info } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export function Cart() {
  const { items, removeItem, increaseQuantity, decreaseQuantity, getCartTotal, getCartItemCount } = useCartStore();
  const navigate = useNavigate();

  const totalItems = getCartItemCount();
  const estimatedTotal = getCartTotal();
  const hasHiddenPrices = items.some(item => !item.showPrice);

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-24 h-24 bg-amber-500/10 text-amber-300 rounded-sm flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-100 mb-4">Your parts request is empty.</h2>
        <p className="text-zinc-400 mb-8 text-lg">Browse our parts catalog and add the items you need to request availability and pricing.</p>
        <Link to="/#catalog" className="inline-block bg-amber-500 text-zinc-950 font-medium py-3 px-8 rounded-sm hover:bg-amber-400 transition-colors shadow-none text-lg">
          Browse Parts Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-zinc-100 mb-8">Your Parts Request</h1>
      
      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-zinc-900 rounded-sm shadow-none border border-zinc-700 overflow-hidden flex flex-col sm:flex-row">
              <div className="w-full sm:w-48 h-48 sm:h-auto bg-zinc-950 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-zinc-800 p-4 shrink-0">
                <span className="text-xs text-zinc-500 text-center uppercase tracking-widest font-semibold">{item.name} Image</span>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-zinc-100 leading-tight mb-1">{item.name}</h3>
                    <p className="text-sm text-zinc-400 font-mono">Part No: {item.partNumber}</p>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-zinc-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-sm transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="text-lg font-bold text-zinc-100 mt-2 mb-6">
                  {item.showPrice ? `Rs. ${item.price.toLocaleString()}` : <span className="text-zinc-400 text-base font-medium">Price on Request</span>}
                </div>
                
                <div className="mt-auto flex items-center gap-4">
                  <div className="flex items-center border border-zinc-700 rounded-sm overflow-hidden h-10 w-32 bg-zinc-900">
                    <button 
                      onClick={() => decreaseQuantity(item.id)}
                      className="w-10 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center font-semibold text-zinc-100 h-full flex items-center justify-center border-x border-zinc-700">
                      {item.quantity}
                    </div>
                    <button 
                      onClick={() => increaseQuantity(item.id)}
                      className="w-10 h-full flex items-center justify-center text-zinc-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {item.showPrice && item.quantity > 1 && (
                    <div className="text-sm text-zinc-400 font-medium">
                      Subtotal: Rs. {(item.price * item.quantity).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-4">
            <Link to="/#catalog" className="text-amber-500 font-medium hover:underline inline-block">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Request Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-950 rounded-sm p-6 md:p-8 border border-zinc-700 sticky top-24">
            <h2 className="text-xl font-bold text-zinc-100 mb-6 pb-4 border-b border-zinc-700">Request Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-zinc-400">
                <span>Selected Parts</span>
                <span className="font-medium text-zinc-100">{totalItems} items</span>
              </div>
              
              {estimatedTotal > 0 && (
                <div className="flex justify-between text-zinc-400 pt-2 border-t border-zinc-700">
                  <span>Estimated Total</span>
                  <span className="font-bold text-zinc-100 text-lg">Rs. {estimatedTotal.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {hasHiddenPrices && (
              <div className="bg-amber-500/10 text-amber-500 p-4 rounded-sm text-sm mb-6 border border-amber-500/30 flex gap-3">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong>Note on Pricing:</strong> Some items in your request require manual pricing. Final pricing for all items will be confirmed by our team when they contact you.
                </div>
              </div>
            )}
            
            <button
              onClick={() => navigate('/request')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-4 px-6 rounded-sm transition-colors flex items-center justify-center gap-2 shadow-none text-lg"
            >
              Submit Parts Request <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-center text-xs text-zinc-400 mt-4">
              No payment is required right now. We will contact you via WhatsApp or Phone to confirm your request.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
