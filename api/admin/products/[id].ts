import {
  getServerSupabase,
  normalizeProduct,
  requireAdmin,
  sendError,
  validateProductBody,
} from "../../../src/vercelApiUtils.js";

export default async function handler(req: any, res: any) {
  try {
    await requireAdmin(req);

    const id = req.query?.id;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Product ID is required." });
    }

    const supabase = getServerSupabase();

    if (req.method === "PATCH") {
      const product = validateProductBody(req.body);

      const { data, error } = await supabase
        .from("products")
        .update({
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
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Update product error:", error);
        return res.status(500).json({
          error: error.message,
          code: error.code,
        });
      }

      return res.status(200).json({
        success: true,
        product: normalizeProduct(data),
      });
    }

    if (req.method === "DELETE") {
      const { data: existing, error: findError } = await supabase
        .from("products")
        .select("id")
        .eq("id", id)
        .maybeSingle();

      if (findError) {
        return res.status(500).json({
          error: findError.message,
          code: findError.code,
        });
      }

      if (!existing) {
        return res.status(404).json({ error: "Product not found." });
      }

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Delete product error:", error);
        return res.status(500).json({
          error: error.message,
          code: error.code,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Product deleted successfully.",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Admin product API error:", error);
    return sendError(res, error, "Failed to update product.");
  }
}
