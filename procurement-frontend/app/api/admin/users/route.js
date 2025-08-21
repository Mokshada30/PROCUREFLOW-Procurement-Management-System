import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client inside the function to avoid build-time execution
function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export async function GET(request) {
  try {
    // In a real application, you would also verify the user's role to ensure only admins can access this.
    // For this example, we assume this API route is internally protected or called after a client-side role check.

    const supabaseAdmin = createSupabaseAdmin();
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch profiles to get full_name and role
    const userIds = users.users.map(user => user.id);
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError.message);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Merge user data with profile data
    const usersWithRoles = users.users.map(user => {
      const profile = profiles.find(p => p.id === user.id);
      return {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || 'N/A',
        role: profile?.role || 'N/A', // Default to N/A if role not found
      };
    });

    return NextResponse.json(usersWithRoles);
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    // In a real application, ensure this is protected by an admin role check.
    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'User ID and new role are required.' }, { status: 400 });
    }

    // Update the role in the profiles table
    const supabaseAdmin = createSupabaseAdmin();
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (profileUpdateError) {
      console.error('Error updating profile role:', profileUpdateError.message);
      return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
    }

    // Optionally, update the user metadata in auth.users if needed (though role is in profiles)
    // const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
    //   userId,
    //   { user_metadata: { role: newRole } }
    // );

    // if (authUpdateError) {
    //   console.error('Error updating auth user metadata:', authUpdateError.message);
    //   return NextResponse.json({ error: authUpdateError.message }, { status: 500 });
    // }

    return NextResponse.json({ message: 'User role updated successfully.' });
  } catch (error) {
    console.error('Unexpected error in PUT /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
