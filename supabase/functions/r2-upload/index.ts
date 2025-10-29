import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.614.0";

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
    console.log('[R2 Upload] Processing upload request');

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      console.error('[R2 Upload] Missing parameters:', { hasFile: !!file, hasPath: !!path });
      throw new Error('Missing file or path parameter');
    }

    console.log(`[R2 Upload] Uploading ${file.name} (${file.size} bytes) to ${path}`);

    // Get R2 credentials from Supabase Secrets (without VITE_ prefix)
    const accountId = Deno.env.get('R2_ACCOUNT_ID');
    const bucketName = Deno.env.get('R2_BUCKET_NAME');
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const publicUrl = Deno.env.get('R2_PUBLIC_URL');

    console.log('[R2 Upload] Environment check:', {
      hasAccountId: !!accountId,
      hasBucketName: !!bucketName,
      hasAccessKeyId: !!accessKeyId,
      hasSecretAccessKey: !!secretAccessKey,
      hasPublicUrl: !!publicUrl
    });

    if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
      const missing = [];
      if (!accountId) missing.push('R2_ACCOUNT_ID');
      if (!bucketName) missing.push('R2_BUCKET_NAME');
      if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
      if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
      
      console.error('[R2 Upload] Missing Supabase secrets:', missing.join(', '));
      throw new Error(`Missing R2 configuration in Supabase secrets: ${missing.join(', ')}`);
    }

    console.log(`[R2 Upload] Using bucket: ${bucketName}`);

    // Initialize S3 client with EU endpoint
    const endpoint = `https://${accountId}.eu.r2.cloudflarestorage.com`;
    const region = "auto";
    
    console.log(`[R2 Upload] S3 Configuration:`, {
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

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    console.log(`[R2 Upload] File converted to buffer: ${buffer.byteLength} bytes`);
    
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: path,
      Body: new Uint8Array(buffer),
      ContentType: file.type || 'application/octet-stream',
    });

    console.log('[R2 Upload] Sending upload command...');
    const uploadResult = await client.send(command);
    console.log('[R2 Upload] Upload command completed:', uploadResult);

    // Generate public URL using EU endpoint with bucket name
    const url = publicUrl 
      ? `${publicUrl}/${path}`
      : `https://${accountId}.eu.r2.cloudflarestorage.com/${bucketName}/${path}`;

    console.log(`[R2 Upload] Upload successful: ${url}`);

    return new Response(
      JSON.stringify({ url, path }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[R2 Upload] Error:', error);
    console.error('[R2 Upload] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
