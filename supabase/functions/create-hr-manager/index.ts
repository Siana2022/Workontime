import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, pin, fullName, companyId } = await req.json()

    // Create a Supabase client with the Service Role Key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create the user in the auth schema
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: pin,
      email_confirm: true,
    });

    if (authError) throw authError;

    const newUserId = authData.user.id;

    // Create the employee profile
    const { error: profileError } = await supabaseAdmin.from('employees').insert({
      id: newUserId,
      full_name: fullName,
      email: email,
      pin: pin,
      role: 'Gestor de RRHH',
      company_id: companyId,
    });

    if (profileError) {
      // If profile creation fails, clean up the created auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw profileError;
    }

    return new Response(JSON.stringify({ message: `Successfully created user ${email}` }), {
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
