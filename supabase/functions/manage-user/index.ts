import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, userId, updates } = await req.json()

    console.log(`[manage-user] Action: ${action}, UserId: ${userId}`)

    switch (action) {
      case 'update_password': {
        if (!updates?.password || updates.password.length < 8) {
          throw new Error('Passwort muss mindestens 8 Zeichen lang sein')
        }

        console.log('[manage-user] Updating password...')
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: updates.password }
        )

        if (error) {
          console.error('[manage-user] Password update error:', error)
          throw error
        }

        console.log('[manage-user] Password updated successfully')
        return new Response(
          JSON.stringify({ success: true, message: 'Passwort erfolgreich aktualisiert' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      case 'delete_user': {
        console.log('[manage-user] Deleting user from auth...')
        
        // Delete from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) {
          console.error('[manage-user] Auth delete error:', authError)
          // Continue anyway, the CASCADE should have cleaned up the DB
        }

        console.log('[manage-user] User deleted successfully')
        return new Response(
          JSON.stringify({ success: true, message: 'Nutzer erfolgreich gelöscht' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      default:
        throw new Error(`Unbekannte Aktion: ${action}`)
    }
  } catch (error: any) {
    console.error('[manage-user] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Fehler bei der Nutzer-Verwaltung' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
