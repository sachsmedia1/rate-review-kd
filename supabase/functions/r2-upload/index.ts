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

    // Get credentials from request body (sent from frontend where VITE_ vars are available)
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    const accountId = formData.get('accountId') as string;
    const bucketName = formData.get('bucketName') as string;
    const accessKeyId = formData.get('accessKeyId') as string;
    const secretAccessKey = formData.get('secretAccessKey') as string;
    const publicUrl = formData.get('publicUrl') as string;

    console.log('[R2 Upload] Credentials received from frontend:', {
      hasAccountId: !!accountId,
      hasBucketName: !!bucketName,
      hasAccessKeyId: !!accessKeyId,
      hasSecretAccessKey: !!secretAccessKey,
      hasPublicUrl: !!publicUrl
    });

    if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
      const missing = [];
      if (!accountId) missing.push('accountId');
      if (!bucketName) missing.push('bucketName');
      if (!accessKeyId) missing.push('accessKeyId');
      if (!secretAccessKey) missing.push('secretAccessKey');
      
      console.error('[R2 Upload] Missing credentials from frontend:', missing.join(', '));
      throw new Error(`Missing R2 credentials: ${missing.join(', ')}`);
    }

    console.log(`[R2 Upload] Using bucket: ${bucketName}`);

    if (!file || !path) {
      console.error('[R2 Upload] Missing parameters:', { hasFile: !!file, hasPath: !!path });
      throw new Error('Missing file or path parameter');
    }

    console.log(`[R2 Upload] Uploading ${file.name} (${file.size} bytes) to ${path}`);

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
