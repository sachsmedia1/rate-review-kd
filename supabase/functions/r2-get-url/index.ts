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

    // Get environment variables (without VITE_ prefix)
    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const publicUrl = Deno.env.get('R2_PUBLIC_URL');

    if (!accountId) {
      throw new Error('Missing R2 account ID');
    }

    // Parse request body
    const { path } = await req.json();

    if (!path) {
      throw new Error('Missing path parameter');
    }

    console.log(`[R2 Get URL] Generating URL for: ${path}`);

    // Get bucket name for URL generation
    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    
    if (!bucketName) {
      throw new Error('Missing R2 bucket name');
    }

    // Generate public URL using EU endpoint with bucket name
    const url = publicUrl 
      ? `${publicUrl}/${path}`
      : `https://${accountId}.eu.r2.cloudflarestorage.com/${bucketName}/${path}`;

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
