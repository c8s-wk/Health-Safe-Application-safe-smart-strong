import supabase from '../supabase.ts';

export interface Category {
    created_at: string;
    id: number;
    name: string;
}

export async function createCategory(name: string) {
    const { data, error } = await supabase
       .from('category')
       .insert([
            { name: name },
        ])
       .single();
    if (error) {
        throw new Error(error.message);
    }
}

export async function getCategories():Promise<Category[]> {
    const { data, error } = await supabase
       .from('category')
       .select('*')
       .order('name', { ascending: true });
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function getCategoryById(id: number): Promise<Category> {
    try {
        console.log(`Fetching category with ID: ${id}`);
        const { data, error } = await supabase
            .from('category')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) {
            console.error(`Error fetching category with ID ${id}:`, error);
            throw new Error(error.message);
        }
        
        if (!data) {
            console.error(`No category found with ID ${id}`);
            throw new Error(`Category with ID ${id} not found`);
        }
        
        return data;
    } catch (err) {
        console.error(`Exception in getCategoryById(${id}):`, err);
        throw err;
    }
}

export async function searchCategories(name: string):Promise<Category[]> {
    const { data, error } = await supabase
       .from('category')
       .select('*')
       .ilike('name', `%${name}%`)
       .order('name', { ascending: true });
    if (error) {
        throw new Error(error.message);
    }
    return data;
}
