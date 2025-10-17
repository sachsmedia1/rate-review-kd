import { Client } from "https://deno.land/x/mysql@v2.12.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    host: string;
    user: string;
    database: string;
    connected: boolean;
    testQuery?: string;
  };
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting MySQL connection test...');
    
    // Get MySQL credentials from environment
    const host = Deno.env.get('MYSQL_HOST');
    const user = Deno.env.get('MYSQL_USER');
    const password = Deno.env.get('MYSQL_PASSWORD');
    const database = Deno.env.get('MYSQL_DATABASE');

    // Validate all credentials are present
    if (!host || !user || !password || !database) {
      const missing = [];
      if (!host) missing.push('MYSQL_HOST');
      if (!user) missing.push('MYSQL_USER');
      if (!password) missing.push('MYSQL_PASSWORD');
      if (!database) missing.push('MYSQL_DATABASE');
      
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    console.log(`Attempting to connect to ${host} as ${user}...`);

    // Parse host and port
    const [hostname, portStr] = host.split(':');
    const port = portStr ? parseInt(portStr, 10) : 3306;

    // Create MySQL client
    const client = await new Client().connect({
      hostname: hostname,
      port: port,
      username: user,
      password: password,
      db: database,
    });

    console.log('MySQL connection established successfully!');

    // Try a simple test query
    const result = await client.query('SELECT 1 as test');
    console.log('Test query executed successfully:', result);

    // Close the connection
    await client.close();
    console.log('MySQL connection closed');

    const response: ConnectionTestResult = {
      success: true,
      message: 'MySQL-Verbindung erfolgreich hergestellt und getestet!',
      details: {
        host: `${hostname}:${port}`,
        user: user,
        database: database,
        connected: true,
        testQuery: 'SELECT 1 as test - OK'
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('MySQL connection error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    const response: ConnectionTestResult = {
      success: false,
      message: 'MySQL-Verbindung fehlgeschlagen',
      error: errorMessage
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
