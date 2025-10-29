import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, postal_code, review_id } = await req.json();
    
    console.log('🗺️ Geocoding request:', { city, postal_code, review_id });

    if (!city) {
      return new Response(
        JSON.stringify({ error: 'City is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('❌ GOOGLE_MAPS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build address string
    const address = postal_code 
      ? `${postal_code} ${city}, Deutschland`
      : `${city}, Deutschland`;

    console.log('📍 Geocoding address:', address);

    // Call Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      console.error('❌ Geocoding failed:', geocodeData.status);
      
      // Update review with failed status if review_id provided (using SERVICE_ROLE to bypass RLS)
      if (review_id) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabase
          .from('reviews')
          .update({ geocoding_status: 'failed' })
          .eq('id', review_id);
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Geocoding failed',
          status: geocodeData.status 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const location = geocodeData.results[0].geometry.location;
    const latitude = location.lat;
    const longitude = location.lng;

    // Validate coordinates are in Germany
    const GERMANY_BOUNDS = { north: 55.5, south: 47.0, east: 15.5, west: 5.5 };
    if (latitude < GERMANY_BOUNDS.south || latitude > GERMANY_BOUNDS.north || 
        longitude < GERMANY_BOUNDS.west || longitude > GERMANY_BOUNDS.east) {
      console.error('❌ Coordinates outside Germany:', { latitude, longitude });
      return new Response(
        JSON.stringify({ error: 'Location outside Germany' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Geocoding successful:', { latitude, longitude });

    // Update review with geocoded coordinates if review_id provided (using SERVICE_ROLE to bypass RLS)
    if (review_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          latitude,
          longitude,
          geocoding_status: 'success',
          geocoded_at: new Date().toISOString()
        })
        .eq('id', review_id);

      if (updateError) {
        console.error('❌ Failed to update review:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update review with coordinates' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('✅ Review updated with coordinates');
      }
    }

    return new Response(
      JSON.stringify({ 
        latitude, 
        longitude,
        geocoding_status: 'success'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
