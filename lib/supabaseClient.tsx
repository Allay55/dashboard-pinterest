import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lgltqhzmehrbvumzhjwp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnbHRxaHptZWhyYnZ1bXpoandwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1OTk5MTgsImV4cCI6MjA3OTE3NTkxOH0.zvB8eT-IdLieaLvdqsP1tlDUHhOawUMSlQp1PB2-_yQ";

export const supabase = createClient(supabaseUrl,supabaseKey)