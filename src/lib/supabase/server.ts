import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://lladxcxjmxtrsorvagql.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYWR4Y3hqbXh0cnNvcnZhZ3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NzM4MDAsImV4cCI6MjA5MTU0OTgwMH0.8psiXvSaMKp6NyvbpoZB1gKKEH7Mg9DSrWgMCnnC8nA',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies set by middleware
          }
        },
      },
    }
  )
}
