import { Product, CustomerDetails, CartItem } from './types';

const API_BASE = '/api';

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}

export async function submitRequest(customer: CustomerDetails, items: CartItem[]) {
  // Map cart items to what the backend expects
  const payloadItems = items.map(item => ({
    productId: item.id,
    quantity: item.quantity
  }));

  const response = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer,
      items: payloadItems
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit request');
  }

  return data;
}
