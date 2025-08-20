import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

export const useUserRole = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error.message);
          setRole(null);
        } else if (profile) {
          setRole(profile.role);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    };

    fetchUserRole();
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchUserRole();
      }
    });
    return () => { authSubscription.unsubscribe(); };
  }, []);

  return { role, loading };
};
