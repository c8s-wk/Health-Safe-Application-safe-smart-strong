import supabase from '../supabase'
import { seedSampleCategories } from './categorySeeder'

// Sample post data
const samplePosts = [
  {
    content: 'As flu season approaches, it\'s important to take precautions to protect yourself and your loved ones. Here are some tips:\n\n1. Get your annual flu shot\n2. Wash your hands frequently\n3. Avoid close contact with sick people\n4. Stay home if you\'re feeling ill\n5. Keep your immune system strong with a healthy diet\n\nStay safe everyone!',
    category_id: 1, // Health
    latitude: 1.3521,
    longitude: 103.8198,
    user_id: '00000000-0000-0000-0000-000000000000' // This will be replaced with the actual user id
  },
  {
    content: 'With increasing concerns about air pollution, it\'s essential to understand what air quality indexes mean for your health.\n\nHere\'s a simple breakdown:\n\n- Good (0-50): Air quality is satisfactory\n- Moderate (51-100): Some pollutants may affect sensitive individuals\n- Unhealthy for Sensitive Groups (101-150): Members of sensitive groups may experience health effects\n- Unhealthy (151-200): Everyone may begin to experience health effects\n- Very Unhealthy (201-300): Health warnings of emergency conditions\n- Hazardous (301+): Health alert - everyone may experience serious health effects\n\nAlways check your local air quality before outdoor activities!',
    category_id: 2, // Environment
    latitude: 1.3099,
    longitude: 103.7775,
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    content: 'Exercise isn\'t just about weight management - it offers countless health benefits!\n\nRegular physical activity can:\n\n- Improve cardiovascular health\n- Strengthen muscles and bones\n- Boost mental health and mood\n- Increase energy levels\n- Enhance sleep quality\n- Reduce risk of chronic diseases\n\nAim for at least 150 minutes of moderate activity each week. Your body will thank you!',
    category_id: 3, // Fitness
    latitude: 1.3644,
    longitude: 103.9915,
    user_id: '00000000-0000-0000-0000-000000000000'
  }
]

/**
 * Seeds the database with sample posts
 * @param userId Optional user ID to assign to the posts
 * @returns The number of posts added
 */
export async function seedSamplePosts(userId?: string): Promise<number> {
  try {
    // Ensure categories exist first
    await seedSampleCategories()
    
    // Get the current user if no userId was provided
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
      }
    }
    
    // Prepare posts with the user ID (if we have one)
    const postsToInsert = samplePosts.map(post => ({
      ...post,
      user_id: userId || post.user_id
    }))
    
    // Insert posts into the database
    const { data, error } = await supabase
      .from('post')
      .insert(postsToInsert)
      .select()
    
    if (error) {
      console.error('Error seeding posts:', error)
      throw new Error(`Failed to seed posts: ${error.message}`)
    }
    
    console.log('Posts seeded successfully:', data?.length || 0)
    return data?.length || 0
  } catch (err) {
    console.error('Exception seeding posts:', err)
    throw err
  }
}

/**
 * Checks if the posts table has data
 * @returns True if there are posts in the database
 */
export async function hasExistingPosts(): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('post')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Error checking for existing posts:', error)
      return false
    }
    
    return (count || 0) > 0
  } catch (err) {
    console.error('Exception checking for existing posts:', err)
    return false
  }
} 