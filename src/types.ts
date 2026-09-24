export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  partNumber: string;
  price: number;
  discountPrice?: number | null;
  showPrice: boolean;
  availability: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  whatsapp: string;
  location: string;
  address?: string;
  message?: string;
}