const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 implementation for R2
async function createAwsSignature(
  method: string,
  url: string,
  body: ArrayBuffer,
  headers: Record<string, string>,
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  service: string
) {
  const encoder = new TextEncoder();
  
  // Create canonical request
  const canonicalUri = new URL(url).pathname;
  const canonicalQueryString = '';
  const canonicalHeaders = Object.entries(headers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key.toLowerCase()}:${value.trim()}\n`)
    .join('');
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';');
  
  // Hash the payload
  const payloadHash = await crypto.subtle.digest('SHA-256', body);
  const payloadHashHex = Array.from(new Uint8Array(payloadHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHashHex
  ].join('\n');
  
  // Create string to sign
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = timestamp.slice(0, 8);
  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  
  const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    timestamp,
    credentialScope,
    canonicalRequestHashHex
  ].join('\n');
  
  // Calculate signature
  const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
    const kDate = await hmac(encoder.encode(`AWS4${key}`).buffer, encoder.encode(dateStamp).buffer);
    const kRegion = await hmac(kDate, encoder.encode(regionName).buffer);
    const kService = await hmac(kRegion, encoder.encode(serviceName).buffer);
    const kSigning = await hmac(kService, encoder.encode('aws4_request').buffer);
    return kSigning;
  };
  
  const hmac = async (key: ArrayBuffer, data: ArrayBuffer) => {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return await crypto.subtle.sign('HMAC', cryptoKey, data);
  };
  
  const signingKey = await getSignatureKey(secretAccessKey, date, region, service);
  const signature = await hmac(signingKey, encoder.encode(stringToSign).buffer);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Build authorization header
  const authorizationHeader = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signatureHex}`
  ].join(', ');
  
  return { authorizationHeader, timestamp };
}

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

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    console.log(`[R2 Upload] File converted to buffer: ${buffer.byteLength} bytes`);
    
    // Build R2 URL
    const endpoint = `https://${accountId}.eu.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${bucketName}/${path}`;
    
    console.log(`[R2 Upload] Target URL: ${url}`);
    
    // Prepare headers
    const contentType = file.type || 'application/octet-stream';
    const date = new Date().toUTCString();
    
    const headers: Record<string, string> = {
      'Host': `${accountId}.eu.r2.cloudflarestorage.com`,
      'Content-Type': contentType,
      'Content-Length': buffer.byteLength.toString(),
      'x-amz-content-sha256': Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', buffer)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      'x-amz-date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
    };
    
    // Create AWS Signature
    const { authorizationHeader, timestamp } = await createAwsSignature(
      'PUT',
      url,
      buffer,
      headers,
      accessKeyId,
      secretAccessKey,
      'auto',
      's3'
    );
    
    headers['Authorization'] = authorizationHeader;
    headers['x-amz-date'] = timestamp;
    
    console.log('[R2 Upload] Sending upload request with AWS Signature V4...');
    
    // Upload to R2 using fetch
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers,
      body: buffer,
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[R2 Upload] Upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        body: errorText
      });
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    
    console.log('[R2 Upload] Upload completed successfully');

    // Generate public URL
    const publicFileUrl = publicUrl 
      ? `${publicUrl}/${path}`
      : `${endpoint}/${bucketName}/${path}`;

    console.log(`[R2 Upload] Upload successful: ${publicFileUrl}`);

    return new Response(
      JSON.stringify({ url: publicFileUrl, path }),
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
