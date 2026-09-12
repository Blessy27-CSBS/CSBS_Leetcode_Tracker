import * as crypto from 'crypto';
import { supabase } from './server/supabase.js';

async function fixMariaInSupabase() {
  if (!supabase) {
    console.warn('[Supabase] Client is not configured.');
    return;
  }

  const regNo = '711724UCB126';
  const studentId = 's_1788861576272_fq3ko';
  const email = '24ucb126mariab@kgkite.ac.in';
  const defaultHash = crypto.createHash('sha256').update(regNo.trim()).digest('hex');

  console.log('Setting student password_hash to default regNo hash:', defaultHash);

  const { data, error } = await supabase
    .from('users')
    .update({
      password_hash: defaultHash,
      student_id: studentId,
      email: email,
      username: email,
    })
    .eq('id', `usr_${studentId}`)
    .select();

  if (error) {
    console.error('Error updating Supabase:', error.message);
  } else {
    console.log('Successfully updated Supabase user:', data);
  }
}

fixMariaInSupabase();
