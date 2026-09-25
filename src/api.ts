import { Product, CustomerDetails, CartItem } from "./types";

const API_BASE = "/api";

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Server returned ${response.status} ${response.statusText}. Please try again.`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Request failed with status ${response.status}.`
    );
  }

  return data as T;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_BASE}/products`, {
    headers: { Accept: "application/json" },
  });

  return readJson<Product[]>(response);
}

export async function submitRequest(
  customer: CustomerDetails,
  items: CartItem[],
) {
  const response = await fetch(`${API_BASE}/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      customer,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      })),
    }),
  });

  return readJson<{
    success: boolean;
    message: string;
    requestNumber: string;
  }>(response);
}
