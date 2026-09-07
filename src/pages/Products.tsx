import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { fetchProducts } from '../api';
import { Product } from '../types';

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filters state
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Sync state with URL params
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

  const updateSearchParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Derive filter options from data
  const categories = Array.from(new Set(products.map(p => p.category))).sort();
  const brands = Array.from(new Set(products.map(p => p.brand))).sort();

  // Filter and Sort logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.model.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchesBrand = selectedBrand ? product.brand === selectedBrand : true;

    return matchesSearch && matchesCategory && matchesBrand;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'newest':
        return parseInt(b.id) - parseInt(a.id); // Mock logic for newest
      case 'featured':
      default:
        return 0; // Keep original order
    }
  });

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6">
        {/* Modern Filter Bar */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm shadow-2xl flex flex-col gap-4">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-zinc-100 uppercase tracking-wide font-heading">Filter Catalog</span>
              {searchTerm && (
                <div className="ml-4 flex items-center bg-amber-500/20 text-amber-500 px-3 py-1 rounded-full text-xs font-semibold">
                  Search: "{searchTerm}"
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      updateSearchParams('search', '');
                    }}
                    className="ml-2 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-sm font-medium text-zinc-400 uppercase tracking-wider hidden sm:block">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 text-zinc-100 rounded-sm py-2 px-3 focus:outline-none focus:border-amber-500 w-full sm:w-auto cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="name-asc">Name: A-Z</option>
                <option value="name-desc">Name: Z-A</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          <div className="h-px w-full bg-zinc-800"></div>

          {/* Category Filter Pills */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Category</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedCategory('');
                  updateSearchParams('category', '');
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  selectedCategory === '' 
                    ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                    : 'bg-zinc-950 text-zinc-400 border-zinc-700 hover:border-amber-500 hover:text-amber-500'
                }`}
              >
                All
              </button>
              {categories.map((category: string) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    updateSearchParams('category', category);
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    selectedCategory === category 
                      ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                      : 'bg-zinc-950 text-zinc-400 border-zinc-700 hover:border-amber-500 hover:text-amber-500'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter Pills */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Vehicle Brand</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedBrand('')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  selectedBrand === '' 
                    ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                    : 'bg-zinc-950 text-zinc-400 border-zinc-700 hover:border-amber-500 hover:text-amber-500'
                }`}
              >
                All Brands
              </button>
              {brands.map((brand: string) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    selectedBrand === brand 
                      ? 'bg-amber-500 text-zinc-950 border-amber-500' 
                      : 'bg-zinc-950 text-zinc-400 border-zinc-700 hover:border-amber-500 hover:text-amber-500'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
          
        </div>

        {/* Product Grid */}
        <div className="flex-1 w-full mt-2">
          <div className="hidden md:flex justify-between items-center mb-6">
            <span className="text-zinc-400 font-medium">{filteredProducts.length} Results</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <div key={n} className="bg-zinc-800 rounded-sm h-[320px] animate-pulse"></div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-zinc-950 rounded-sm border border-zinc-800">
              <Search className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-100 mb-2">No parts found</h3>
              <p className="text-zinc-400 max-w-md mx-auto">
                We couldn't find any parts matching your current filters. Try adjusting your search or clearing filters.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedBrand('');
                  setSearchParams(new URLSearchParams());
                }}
                className="mt-6 text-amber-500 font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
