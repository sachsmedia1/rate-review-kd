const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[R2 Get URL] Processing get-url request');

    // Get environment variables
    const accountId = Deno.env.get('VITE_R2_ACCOUNT_ID');
    const publicUrl = Deno.env.get('VITE_R2_PUBLIC_URL');

    if (!accountId) {
      throw new Error('Missing R2 account ID');
    }

    // Parse request body
    const { path } = await req.json();

    if (!path) {
      throw new Error('Missing path parameter');
    }

    console.log(`[R2 Get URL] Generating URL for: ${path}`);

    // Generate public URL
    const url = publicUrl 
      ? `${publicUrl}/${path}`
      : `https://pub-${accountId}.r2.dev/${path}`;

    console.log(`[R2 Get URL] Generated URL: ${url}`);

    return new Response(
      JSON.stringify({ url, path }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[R2 Get URL] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
