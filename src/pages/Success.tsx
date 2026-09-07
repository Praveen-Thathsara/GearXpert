import { Link, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { WhatsAppButton } from '../components/WhatsAppButton';

export function Success() {
  const location = useLocation();
  const requestNumber = location.state?.requestNumber;

  if (!requestNumber) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-sm flex items-center justify-center mx-auto mb-8">
        <CheckCircle2 className="w-12 h-12" />
      </div>
      
      <h1 className="text-4xl font-extrabold text-zinc-100 mb-6">Request Submitted Successfully!</h1>
      
      <div className="bg-zinc-950 border border-zinc-700 rounded-sm p-8 mb-8 inline-block text-left w-full max-w-lg mx-auto">
        <p className="text-zinc-400 mb-4 text-center">
          Thank you for your request. We have received your selected parts and contact details. Our team will contact you shortly to confirm availability and pricing.
        </p>
        <div className="text-center bg-zinc-900 p-4 rounded-sm border border-zinc-700 shadow-none mt-6">
          <p className="text-sm text-zinc-400 font-semibold uppercase tracking-wider mb-1">Request Number</p>
          <p className="text-2xl font-mono font-bold text-amber-500">{requestNumber}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <Link 
          to="/#catalog" 
          className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-800 text-zinc-200 font-bold py-4 px-8 rounded-sm transition-colors flex items-center justify-center gap-2"
        >
          Continue Shopping <ArrowRight className="w-5 h-5" />
        </Link>
        
        <WhatsAppButton 
          message={`Hello, I just submitted a parts request (${requestNumber}). Could you please check it?`}
          className="w-full sm:w-auto text-lg py-4 px-8 rounded-sm"
        />
      </div>
    </div>
  );
}
