export default function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({
    status: "ok",
    supabaseConfigured: Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY
    ),
    emailConfigured: Boolean(
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.BUSINESS_EMAIL
    ),
  });
}
