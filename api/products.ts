import { getServerSupabase, normalizeProduct, sendError } from '../src/vercelApiUtils';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return sendError(res, 500, `Database error: ${error.message}`);
    }

    // Safely fallback to empty array if data is null
    const products = (data || []).map(normalizeProduct);
    
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    return res.status(200).json(products);
  } catch (err: any) {
    console.error('Serverless function error:', err);
    return sendError(res, 500, err.message || 'Internal server error');
  }
}