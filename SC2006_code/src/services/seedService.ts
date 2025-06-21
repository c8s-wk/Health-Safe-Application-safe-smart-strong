import { createClient } from '@supabase/supabase-js'

/**
 * Seeds alerts using a service role key to bypass RLS
 * This function creates a new Supabase client with the service role key
 * which has admin privileges and can bypass RLS policies
 */
export async function seedAlertsWithServiceRole() {
  try {
    // Get the service role key from environment variables
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      console.error('Service role key or Supabase URL not found in environment variables')
      return { success: false, error: 'Service role key or Supabase URL not found' }
    }
    
    // Create a new Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    
    // Check if user is authenticated
    const { data: { session } } = await supabaseAdmin.auth.getSession()
    if (!session) {
      console.error('You must be logged in to seed alerts')
      return { success: false, error: 'You must be logged in to seed alerts' }
    }
    
    // Create sample alerts with only essential fields
    const sampleAlerts = [
      {
        content: 'Residents near Riverbank Ave should not drink tap water until further notice.',
        created_at: new Date().toISOString(),
        user_id: session.user.id
      },
      {
        content: 'Due to heavy rain, avoid Orchard Road until 6 PM.',
        created_at: new Date().toISOString(),
        user_id: session.user.id
      }
    ]
    
    // Insert the alerts using the admin client
    const { data, error } = await supabaseAdmin
      .from('alert')
      .insert(sampleAlerts)
      .select()
    
    if (error) {
      console.error('Error inserting sample alerts with service role:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('Successfully seeded alerts with service role:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error seeding alerts with service role:', (error as Error).message)
    return { success: false, error: (error as Error).message }
  }
} 