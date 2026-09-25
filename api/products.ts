import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl) {
      return res.status(500).json({
        error:
          "Missing SUPABASE_URL or VITE_SUPABASE_URL in Vercel environment variables.",
      });
    }

    if (!supabaseKey) {
      return res.status(500).json({
        error:
          "Missing SUPABASE_SECRET_KEY or VITE_SUPABASE_PUBLISHABLE_KEY in Vercel environment variables.",
      });
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    );

    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,category,brand,model,part_number,price,discount_price,show_price,availability,image_url,image_urls,created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Supabase products error:", error);

      return res.status(500).json({
        error: error.message,
        code: error.code,
      });
    }

    const products = (data || []).map((product: any) => {
      const imageUrls = Array.isArray(product.image_urls)
        ? product.image_urls.filter(
            (url: unknown): url is string =>
              typeof url === "string" &&
              url.trim().length > 0
          )
        : product.image_url
          ? [product.image_url]
          : [];

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
    });

    return res.status(200).json(products);
  } catch (error: any) {
    console.error("Products API error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "Failed to load products.",
    });
  }
}
