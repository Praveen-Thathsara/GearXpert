import { requireAdmin, getServerSupabase, validateProductBody, sendError, normalizeProduct } from '../../src/vercelApiUtils.js';

export default async function handler(req: any, res: any) {
  try {
    await requireAdmin(req);

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const product = validateProductBody(req.body);
    const supabase = getServerSupabase();

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: product.name,
        category: product.category,
        brand: product.brand,
        model: product.model,
        part_number: product.partNumber,
        price: product.price,
        discount_price: product.discountPrice,
        show_price: product.showPrice,
        availability: product.availability,
        image_url: product.imageUrls[0] || null,
        image_urls: product.imageUrls,
      })
      .select()
      .single();

    if (error) {
      console.error("Add product error:", error);
      return res.status(500).json({
        error: error.message,
        code: error.code,
      });
    }

    return res.status(201).json({
      success: true,
      product: normalizeProduct(data),
    });
  } catch (error) {
    console.error("Admin add product error:", error);
    return sendError(res, error, "Failed to add product.");
  }
}
