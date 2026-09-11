import { createClient } from '@supabase/supabase-js';
import { HttpsProxyAgent } from 'https-proxy-agent';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is missing');
}

if (!supabaseSecretKey) {
  throw new Error('SUPABASE_SECRET_KEY is missing');
}

const proxyUrl =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy;

const fetchOptions = proxyUrl
  ? {
      agent: new HttpsProxyAgent(proxyUrl),
    }
  : undefined;

export const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    global: {
      fetch: async (
        input: RequestInfo | URL,
        init?: RequestInit
      ) => {
        return fetch(input, {
          ...init,
          ...fetchOptions,
        });
      },
    },
  }
);