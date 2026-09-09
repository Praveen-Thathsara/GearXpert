import { Link, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, MessageCircle } from 'lucide-react';
import { config } from '../config';

export function Success() {
  const location = useLocation();

  const requestNumber = location.state?.requestNumber;
  const customer = location.state?.customer;
  const items = location.state?.items || [];

  if (!requestNumber || !customer || !items.length) {
    return <Navigate to="/" replace />;
  }

  const whatsappNumber = config.whatsapp.replace(/\D/g, '');

  const whatsappMessage = `Hello ${config.businessName},

I would like to request the following vehicle parts:

Request Number: ${requestNumber}

Requested Parts:

${items
  .map(
    (item: any, index: number) =>
      `${index + 1}. ${item.name}
Part No: ${item.partNumber}
Quantity: ${item.quantity}`
  )
  .join('\n\n')}

Customer Details:

Name: ${customer.fullName}
Phone: ${customer.phone}
WhatsApp: ${customer.whatsapp}
Location: ${customer.location}
${customer.address ? `Address: ${customer.address}` : ''}
${customer.email ? `Email: ${customer.email}` : ''}

${customer.message ? `Additional Message:
${customer.message}` : ''}

Thank you.`;

  const whatsappUrl =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">

      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <h1 className="text-4xl font-extrabold text-zinc-100 mb-6">
        Request Submitted Successfully!
      </h1>

      <p className="text-zinc-400 text-lg mb-8">
        Your request has been received. Our team will contact you shortly
        to confirm availability and pricing.
      </p>

      <div className="bg-zinc-950 border border-zinc-700 rounded-sm p-6 mb-8">
        <p className="text-sm text-zinc-400 uppercase tracking-wider mb-2">
          Request Number
        </p>

        <p className="text-2xl font-mono font-bold text-amber-500">
          {requestNumber}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">

        <Link
          to="/"
          className="w-full sm:w-auto bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold py-4 px-8 rounded-sm transition-colors flex items-center justify-center gap-2"
        >
          Continue Shopping
          <ArrowRight className="w-5 h-5" />
        </Link>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-sm transition-colors flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          Send Request via WhatsApp
        </a>

      </div>
    </div>
  );
}