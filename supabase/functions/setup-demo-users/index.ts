import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DemoUser {
  email: string;
  password: string;
  full_name: string;
  role: string;
  phone: string;
}

const demoUsers: DemoUser[] = [
  {
    email: 'admin@school.com',
    password: 'admin123',
    full_name: 'Admin User',
    role: 'admin',
    phone: '+1234567890'
  },
  {
    email: 'teacher@school.com',
    password: 'teacher123',
    full_name: 'John Teacher',
    role: 'teacher',
    phone: '+1234567891'
  },
  {
    email: 'student@school.com',
    password: 'student123',
    full_name: 'Jane Student',
    role: 'student',
    phone: '+1234567892'
  },
  {
    email: 'manager@school.com',
    password: 'manager123',
    full_name: 'Manager User',
    role: 'manager',
    phone: '+1234567893'
  }
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = [];

    for (const user of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('email', user.email)
          .maybeSingle();

        if (existingProfile) {
          results.push({ email: user.email, status: 'already_exists' });
          continue;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

        if (authError) {
          results.push({ email: user.email, status: 'error', error: authError.message });
          continue;
        }

        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            email: user.email,
            full_name: user.full_name,
            phone: user.phone,
            role: user.role,
            status: 'active'
          });

        if (profileError) {
          // Try to clean up auth user if profile creation fails
          await supabase.auth.admin.deleteUser(authData.user.id);
          results.push({ email: user.email, status: 'error', error: profileError.message });
          continue;
        }

        results.push({ email: user.email, status: 'created', id: authData.user.id });
      } catch (error) {
        results.push({ email: user.email, status: 'error', error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});