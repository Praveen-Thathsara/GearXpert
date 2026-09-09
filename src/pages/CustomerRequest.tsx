import React from "react";
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Send, AlertCircle } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { submitRequest } from '../api';
import { CustomerDetails } from '../types';

export function CustomerRequest() {
  const { items, getCartItemCount, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CustomerDetails>({
    fullName: '',
    phone: '',
    whatsapp: '',
    location: '',
    email: '',
    address: '',
    message: ''
  });

  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof CustomerDetails, string>>>({});

  // Redirect if cart is empty
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (validationErrors[name as keyof CustomerDetails]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof CustomerDetails, string>> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone Number is required';
    if (!formData.whatsapp.trim()) errors.whatsapp = 'WhatsApp Number is required';
    if (!formData.location.trim()) errors.location = 'Location (City/Town) is required';

    if (formData.email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      // Scroll to top to see errors if any
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await submitRequest(formData, items);

      clearCart();

      navigate('/success', {
        state: {
          requestNumber: response.requestNumber,
          customer: formData,
          items: items
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again or contact us via WhatsApp.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <nav className="mb-8">
        <Link to="/cart" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-amber-500 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Cart
        </Link>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8 md:gap-12">

        {/* Form Section */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-extrabold text-zinc-100 mb-2">Complete Your Parts Request</h1>
          <p className="text-zinc-400 mb-8 text-lg">Please provide your contact details so our team can reach out to you with pricing and availability confirmation.</p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-r-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-900 p-6 md:p-8 rounded-sm shadow-none border border-zinc-800">

            {/* Required Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold border-b border-zinc-800 pb-2">Required Information</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-zinc-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-sm border ${validationErrors.fullName ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'} focus:outline-none focus:ring-2`}
                    placeholder="John Perera"
                  />
                  {validationErrors.fullName && <p className="mt-1 text-sm text-red-600 font-medium">{validationErrors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-zinc-300 mb-2">Location (City/Town) *</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-sm border ${validationErrors.location ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'} focus:outline-none focus:ring-2`}
                    placeholder="e.g., Negombo"
                  />
                  {validationErrors.location && <p className="mt-1 text-sm text-red-600 font-medium">{validationErrors.location}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-zinc-300 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-sm border ${validationErrors.phone ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'} focus:outline-none focus:ring-2`}
                    placeholder="077 123 4567"
                  />
                  {validationErrors.phone && <p className="mt-1 text-sm text-red-600 font-medium">{validationErrors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="whatsapp" className="block text-sm font-semibold text-zinc-300 mb-2">WhatsApp Number *</label>
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, whatsapp: prev.phone }));
                        setValidationErrors(prev => ({ ...prev, whatsapp: undefined }));
                      }}
                      className="whitespace-nowrap px-3 py-3 text-xs bg-zinc-800 border border-zinc-700 border-r-0 rounded-l-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                    >
                      Same as Phone
                    </button>
                    <input
                      type="tel"
                      id="whatsapp"
                      name="whatsapp"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      className={`flex-1 min-w-0 block px-4 py-3 rounded-none rounded-r-sm border ${validationErrors.whatsapp ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'} focus:outline-none focus:ring-2`}
                      placeholder="077 123 4567"
                    />
                  </div>
                  {validationErrors.whatsapp && <p className="mt-1 text-sm text-red-600 font-medium">{validationErrors.whatsapp}</p>}
                </div>
              </div>
            </div>

            {/* Optional Information */}
            <div className="space-y-6 pt-4">
              <h3 className="text-xl font-bold border-b border-zinc-800 pb-2 text-zinc-400">Optional Details</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-semibold text-zinc-300 mb-2">Delivery Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-sm border border-zinc-700 focus:ring-amber-500 focus:outline-none focus:ring-2"
                    placeholder="Full street address if delivery is needed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-zinc-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-sm border ${validationErrors.email ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'} focus:outline-none focus:ring-2`}
                    placeholder="your.email@example.com"
                  />
                  {validationErrors.email && <p className="mt-1 text-sm text-red-600 font-medium">{validationErrors.email}</p>}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="message" className="block text-sm font-semibold text-zinc-300 mb-2">Additional Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-sm border border-zinc-700 focus:ring-amber-500 focus:outline-none focus:ring-2 resize-y"
                    placeholder="e.g., Please check availability and let me know the final price. I need this urgently."
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full md:w-auto md:min-w-[250px] flex items-center justify-center gap-2 font-bold py-4 px-8 rounded-sm transition-colors shadow-none text-lg ${isSubmitting
                    ? 'bg-amber-800 cursor-not-allowed text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Request...
                  </>
                ) : (
                  <>
                    Send Parts Request <Send className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-950 rounded-sm p-6 border border-zinc-700 sticky top-24">
            <h3 className="font-bold text-zinc-100 mb-4 pb-4 border-b border-zinc-700">Request Items ({getCartItemCount()})</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded shrink-0 flex items-center justify-center">
                    <span className="text-[10px] text-zinc-500">IMG</span>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-100 leading-tight">{item.name}</p>
                    <p className="text-zinc-400 font-mono text-xs mt-0.5">{item.partNumber}</p>
                    <p className="text-zinc-400 mt-1">Qty: <span className="font-semibold">{item.quantity}</span></p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-700 text-sm text-zinc-400">
              By submitting this request, you agree that our team will contact you regarding availability and final pricing for the listed items.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
