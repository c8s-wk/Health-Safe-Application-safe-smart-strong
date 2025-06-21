import supabase from '../supabase'

// Sample categories
const sampleCategories = [
  { id: 1, name: 'Health', description: 'General health topics and advice' },
  { id: 2, name: 'Environment', description: 'Environmental health concerns' },
  { id: 3, name: 'Fitness', description: 'Exercise and physical fitness' },
  { id: 4, name: 'Nutrition', description: 'Diet and nutritional information' },
  { id: 5, name: 'Mental Health', description: 'Mental health awareness and support' },
  { id: 6, name: 'Medical News', description: 'Latest updates in medical research' }
]

/**
 * Seeds the database with sample categories
 * @returns The number of categories added
 */
export async function seedSampleCategories(): Promise<number> {
  try {
    // First check if categories already exist
    const { data: existingCategories, error: checkError } = await supabase
      .from('category')
      .select('id')
    
    if (checkError) {
      console.error('Error checking existing categories:', checkError)
      throw new Error(`Failed to check existing categories: ${checkError.message}`)
    }
    
    // Filter out categories that already exist
    const existingIds = (existingCategories || []).map(cat => cat.id)
    const categoriesToInsert = sampleCategories.filter(cat => !existingIds.includes(cat.id))
    
    if (categoriesToInsert.length === 0) {
      console.log('All categories already exist, nothing to seed')
      return 0
    }
    
    // Insert categories into the database
    const { data, error } = await supabase
      .from('category')
      .insert(categoriesToInsert)
      .select()
    
    if (error) {
      console.error('Error seeding categories:', error)
      throw new Error(`Failed to seed categories: ${error.message}`)
    }
    
    console.log('Categories seeded successfully:', data?.length || 0)
    return data?.length || 0
  } catch (err) {
    console.error('Exception seeding categories:', err)
    throw err
  }
}

/**
 * Gets all categories, ensuring sample categories exist
 * This is a convenience method that seeds categories if none exist and then returns all categories
 * @returns Array of categories
 */
export async function ensureAndGetCategories() {
  try {
    // First check if categories exist
    const { data: existingCategories, error: checkError } = await supabase
      .from('category')
      .select('*')
    
    if (checkError) {
      console.error('Error checking categories:', checkError)
      throw checkError
    }
    
    // If no categories exist, seed them
    if (!existingCategories || existingCategories.length === 0) {
      await seedSampleCategories()
      
      // Get the categories again after seeding
      const { data, error } = await supabase
        .from('category')
        .select('*')
      
      if (error) throw error
      return data || []
    }
    
    return existingCategories
  } catch (err) {
    console.error('Error in ensureAndGetCategories:', err)
    throw err
  }
} 