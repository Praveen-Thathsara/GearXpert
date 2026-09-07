import React from "react";
import { MessageCircle } from 'lucide-react';
import { config } from '../config';

interface WhatsAppButtonProps {
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

export function WhatsAppButton({ message = "Hello, I need some help finding a part.", className = "", children }: WhatsAppButtonProps) {
  const numericNumber = config.whatsapp.replace(/[^0-9]/g, '');
  const url = `https://wa.me/${numericNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-sm transition-colors ${className}`}
    >
      <MessageCircle className="w-5 h-5" />
      {children || 'Chat on WhatsApp'}
    </a>
  );
}
