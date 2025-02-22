
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/user-management';

export const getTestUsers = async (): Promise<Profile[]> => {
  const { data: testUsers, error } = await supabase
    .from('test_users')
    .select('*');

  if (error) {
    console.error('Error fetching test users:', error);
    return [];
  }

  if (!testUsers?.length) {
    return [];
  }

  return testUsers.map(user => ({
    id: user.id,
    role: user.role,
    created_at: user.created_at,
    is_test_data: true,
    display_name: user.display_name,
    credentials: {
      email: user.email,
      password: user.password
    }
  }));
};
