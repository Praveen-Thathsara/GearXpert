import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { config } from '../config';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-amber-500 text-zinc-950 p-2 rounded-sm">
                <span className="font-bold text-xl leading-none">GXP</span>
              </div>
              <span className="font-bold text-xl text-zinc-100">{config.businessName}</span>
            </div>
            <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-zinc-100 font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-amber-400 transition-colors">Home</Link></li>
              <li><Link to="/#catalog" className="hover:text-amber-400 transition-colors">Products Catalog</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-zinc-100 font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>{config.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                <a href={`tel:${config.phone.replace(/\\s/g, '')}`} className="hover:text-amber-400 transition-colors">
                  {config.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-green-500 shrink-0" />
                <a href={`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="hover:text-green-400 transition-colors">
                  {config.whatsappDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                <a href={`mailto:${config.email}`} className="hover:text-amber-400 transition-colors">
                  {config.email}
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-zinc-400">
          <p>© {currentYear} {config.businessName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
