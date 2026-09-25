import {
  getPublicSupabase,
  normalizeProduct,
  sendError,
} from "../src/vercelApiUtils";

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const supabase = getPublicSupabase();

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Supabase products error:",
        error
      );

      return res.status(500).json({
        error: error.message,
        code: error.code,
      });
    }

    return res.status(200).json(
      (data || []).map(normalizeProduct)
    );
  } catch (error) {
    console.error(
      "Products API error:",
      error
    );

    return sendError(
      res,
      error,
      "Failed to load products."
    );
  }
}
