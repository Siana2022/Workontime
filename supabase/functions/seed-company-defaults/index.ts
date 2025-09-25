import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'
import { corsHeaders } from '../_shared/cors.ts'

console.log(`Function "seed-company-defaults" up and running!`)

// Define the default incident types to be created for a new company
const DEFAULT_INCIDENT_TYPES = [
  { name: 'Error en el fichaje', description: 'Incidencia generada automáticamente cuando un empleado reporta un error en su fichaje.' },
  // We can add more default types here in the future
]

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the user that called the function.
    // This way your row-level-security (RLS) policies are applied.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Ensure the user is an admin before allowing them to seed data
    // You might need a more specific role check here, like 'Super Admin'
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401,
        })
    }
    // Note: Add role check here if needed, for now we just check for authenticated user.

    const { company_id } = await req.json()
    if (!company_id) {
      throw new Error('company_id is required in the request body.')
    }

    const recordsToInsert = DEFAULT_INCIDENT_TYPES.map(it => ({
      ...it,
      company_id: company_id,
    }))

    // Use upsert to avoid creating duplicates.
    // It will attempt to insert, but if a record with the same name and company_id
    // already exists, it will do nothing.
    const { error } = await supabaseClient
      .from('incident_types')
      .upsert(recordsToInsert, { onConflict: 'name, company_id' })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ message: `Successfully seeded default data for company ${company_id}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})