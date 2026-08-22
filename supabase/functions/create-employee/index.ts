// Dayflow HRMS — Edge Function: create-employee
// Provisions an employee in Supabase Auth & Profile with an auto-generated Login ID
// Strictly restricted to authenticated Admin users

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Verify caller identity using their JWT
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized caller' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check if caller is Admin in their company
    const { data: callerProfile, error: profileError } = await userClient
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Caller is not an organization administrator' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = await req.json();
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      job_position,
      department,
      manager_name,
      location,
      monthly_wage,
      date_of_joining,
    } = payload;

    if (!email || !first_name || !last_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, first_name, last_name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Admin client with service role to provision auth user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const tempPassword = password || `TempPass@${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: newAuthUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        phone,
        role: 'employee',
        company_id: callerProfile.company_id,
      },
    });

    if (createUserError || !newAuthUser.user) {
      return new Response(JSON.stringify({ error: createUserError?.message || 'Failed to create user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = newAuthUser.user.id;

    // 4. Update additional profile details if provided
    await adminClient
      .from('profiles')
      .update({
        job_position: job_position || null,
        department: department || null,
        manager_name: manager_name || null,
        location: location || null,
        date_of_joining: date_of_joining || new Date().toISOString().split('T')[0],
      })
      .eq('id', userId);

    // 5. If initial salary is provided, create salary structure
    if (monthly_wage && Number(monthly_wage) > 0) {
      await adminClient.from('salary_structures').insert({
        user_id: userId,
        company_id: callerProfile.company_id,
        monthly_wage: Number(monthly_wage),
      });
    }

    // Fetch the created profile with its generated Login ID
    const { data: createdProfile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Employee successfully created',
        user: {
          id: userId,
          email,
          login_id: createdProfile?.login_id,
          temporary_password: tempPassword,
          profile: createdProfile,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
