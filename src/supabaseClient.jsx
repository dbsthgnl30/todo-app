 import { createClient } from '@supabase/supabase-js'
   
   const supabaseUrl = 'https://fbqvgqloowoznwwdabwb.supabase.co'
   const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZicXZncWxvb3dvem53d2RhYndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDA4MjksImV4cCI6MjEwNTU3NjgyOX0.0aob5od55R3hi3JeTcp6BmLWg_-A21XXqIMdLt0QGm0'
   export const supabase = createClient(supabaseUrl, supabaseKey)