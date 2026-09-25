import { createClient } from "@supabase/supabase-js";

export function getServerSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url) throw new Error("SUPABASE_URL is missing");
  if (!key) throw new Error("SUPABASE_SECRET_KEY is missing");

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireAdmin(req: any) {
  const authHeader = req.headers?.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Authentication required"), {
      statusCode: 401,
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw Object.assign(new Error("Authentication required"), {
      statusCode: 401,
    });
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw Object.assign(new Error("Invalid or expired session"), {
      statusCode: 401,
    });
  }

  return data.user;
}

export function normalizeImageUrls(
  imageUrls: unknown,
  imageUrl: unknown,
): string[] {
  const urls = Array.isArray(imageUrls)
    ? imageUrls
        .filter(
          (url): url is string =>
            typeof url === "string" && url.trim().length > 0,
        )
        .map((url) => url.trim())
    : [];

  if (urls.length > 0) return urls;

  return typeof imageUrl === "string" && imageUrl.trim().length > 0
    ? [imageUrl.trim()]
    : [];
}

export function normalizeProduct(product: any) {
  const imageUrls = normalizeImageUrls(
    product.image_urls,
    product.image_url,
  );

  return {
    id: product.id,
    name: product.name,
    category: product.category,
    brand: product.brand,
    model: product.model,
    partNumber: product.part_number,
    price: Number(product.price),
    discountPrice:
      product.discount_price !== null &&
      product.discount_price !== undefined
        ? Number(product.discount_price)
        : null,
    showPrice: Boolean(product.show_price),
    availability: product.availability,
    imageUrl: imageUrls[0] || null,
    imageUrls,
  };
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateProductBody(body: any) {
  const name = cleanText(body?.name);
  const category = cleanText(body?.category);
  const brand = cleanText(body?.brand);
  const model = cleanText(body?.model);
  const partNumber = cleanText(body?.partNumber);

  if (!name || !category || !brand || !model || !partNumber) {
    throw Object.assign(
      new Error("Required product fields are missing."),
      { statusCode: 400 },
    );
  }

  const price = Number(body?.price);
  if (!Number.isFinite(price) || price < 0) {
    throw Object.assign(
      new Error("Original price must be a valid non-negative number."),
      { statusCode: 400 },
    );
  }

  let discountPrice: number | null = null;
  if (
    body?.discountPrice !== null &&
    body?.discountPrice !== undefined &&
    body?.discountPrice !== ""
  ) {
    discountPrice = Number(body.discountPrice);
    if (!Number.isFinite(discountPrice) || discountPrice < 0) {
      throw Object.assign(
        new Error("Discount price must be a valid non-negative number."),
        { statusCode: 400 },
      );
    }
    if (discountPrice >= price) {
      throw Object.assign(
        new Error("Discount price must be lower than the original price."),
        { statusCode: 400 },
      );
    }
  }

  const availabilityOptions = [
    "In Stock",
    "Limited Stock",
    "Out of Stock",
    "Pre-order",
  ];

  const availability = availabilityOptions.includes(body?.availability)
    ? body.availability
    : "In Stock";

  const showPrice = typeof body?.showPrice === "boolean" ? body.showPrice : true;

  const imageUrls = normalizeImageUrls(body?.imageUrls, body?.imageUrl);

  return {
    name,
    category,
    brand,
    model,
    partNumber,
    price,
    discountPrice,
    showPrice,
    availability,
    imageUrls,
  };
}

export function sendError(res: any, error: any, fallback = "Something went wrong.") {
  const status = Number(error?.statusCode) >= 400 ? Number(error.statusCode) : 500;
  return res.status(status).json({
    error: error?.message || fallback,
  });
}
