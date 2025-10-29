import { S3Client, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.614.0";

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
    console.log('[R2 Delete] Processing delete request');

    // Get environment variables
    const accountId = Deno.env.get('VITE_R2_ACCOUNT_ID');
    const bucketName = Deno.env.get('VITE_R2_BUCKET_NAME');
    const accessKeyId = Deno.env.get('VITE_R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('VITE_R2_SECRET_ACCESS_KEY');

    if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing R2 configuration');
    }

    // Parse request body
    const { path } = await req.json();

    if (!path) {
      throw new Error('Missing path parameter');
    }

    console.log(`[R2 Delete] Deleting file: ${path}`);

    // Initialize S3 client with EU endpoint
    const endpoint = `https://${accountId}.eu.r2.cloudflarestorage.com`;
    const region = "auto";
    
    console.log(`[R2 Delete] S3 Configuration:`, {
      endpoint,
      region,
      bucket: bucketName,
      accountId: accountId.substring(0, 8) + '...',
    });

    const client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Delete from R2
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: path,
    });

    await client.send(command);

    console.log(`[R2 Delete] Delete successful: ${path}`);

    return new Response(
      JSON.stringify({ success: true, path }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[R2 Delete] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
