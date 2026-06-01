import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://npouyrppjqbxifuvpqan.supabase.co'
const supabaseKey = 'sb_publishable_B4PRfLtUTeyAAOVaTotlUQ_Rkjvk9pv' // Public publishable key

export const supabase = createClient(supabaseUrl, supabaseKey)