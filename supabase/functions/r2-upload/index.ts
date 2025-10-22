import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3@^3.614.0";

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

    // Get environment variables
    const accountId = Deno.env.get('VITE_R2_ACCOUNT_ID');
    const bucketName = Deno.env.get('VITE_R2_BUCKET_NAME');
    const accessKeyId = Deno.env.get('VITE_R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('VITE_R2_SECRET_ACCESS_KEY');
    const publicUrl = Deno.env.get('VITE_R2_PUBLIC_URL');

    if (!accountId || !bucketName || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing R2 configuration');
    }

    console.log(`[R2 Upload] Using bucket: ${bucketName}`);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      throw new Error('Missing file or path parameter');
    }

    console.log(`[R2 Upload] Uploading ${file.name} to ${path}`);

    // Initialize S3 client
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    
    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: path,
      Body: new Uint8Array(buffer),
      ContentType: file.type,
    });

    await client.send(command);

    // Generate public URL
    const url = publicUrl 
      ? `${publicUrl}/${path}`
      : `https://pub-${accountId}.r2.dev/${path}`;

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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
