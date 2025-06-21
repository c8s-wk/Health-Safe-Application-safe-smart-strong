import { useUserStore } from '../stores/userStore.ts';
import supabase from '../supabase.ts';


export interface Reaction {
    id: number;
    created_at: string;
    user_id: string;
    type: "LIKE"|"DISLIKE";
    target_id: number;
    target_type: "POST"|"COMMENT";
}

export interface CreateReaction {
    type: "LIKE"|"DISLIKE";
    target_id: number;
    target_type: "POST"|"COMMENT";
}


export async function getMyReaction(target_id: number, target_type:"POST"|"COMMENT"):Promise<Reaction|null> {
    console.log(`Getting reaction for ${target_type} ${target_id}`);
    const userStore=useUserStore();
    if (!userStore.user) {
        console.log('User not logged in when getting reaction');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('reaction')
            .select('*')
            .eq('target_id', target_id)
            .eq('target_type', target_type)
            .eq('user_id', userStore.user.id)
            .single();
            
        if (error) {
            if (error.code === 'PGRST116') {
                // No data found, not an error in this case
                console.log(`No reaction found for ${target_type} ${target_id}`);
                return null;
            }
            console.error('Error getting reaction:', error);
            return null;
        }
        
        console.log(`Found reaction for ${target_type} ${target_id}:`, data);
        return data;
    } catch (err) {
        console.error('Exception getting reaction:', err);
        return null;
    }
}

export async function addReaction(createReaction: CreateReaction): Promise<Reaction | null> {
    console.log(`Adding ${createReaction.type} reaction to ${createReaction.target_type} ${createReaction.target_id}`);
    
    const userStore=useUserStore();
    if (!userStore.user) {
        console.error('User not logged in when adding reaction');
        throw new Error('User not logged in');
    }
    
    const reactionWithUserId={
        ...createReaction,
        user_id: userStore.user.id
    }
    
    try {
        const { data, error } = await supabase
            .from('reaction')
            .insert(reactionWithUserId)
            .select('*')
            .single();
            
        if (error) {
            console.error('Error adding reaction:', error);
            throw new Error(error.message);
        }
        
        console.log('Reaction added successfully:', data);
        return data;
    } catch (err) {
        console.error('Exception adding reaction:', err);
        throw err;
    }
}



export async function removeReaction(target_id: number, target_type: "POST"|"COMMENT"): Promise<void> {
    console.log(`Removing reaction from ${target_type} ${target_id}`);
    
    const userStore=useUserStore();
    if (!userStore.user) {
        console.error('User not logged in when removing reaction');
        throw new Error('User not logged in');
    }
    
    try {
        const { error } = await supabase
            .from('reaction')
            .delete()
            .eq('user_id', userStore.user.id)
            .eq('target_id', target_id)
            .eq('target_type', target_type);
            
        if (error) {
            console.error('Error removing reaction:', error);
            throw new Error(error.message);
        }
        
        console.log('Reaction removed successfully');
    } catch (err) {
        console.error('Exception removing reaction:', err);
        throw err;
    }
}

export async function getReactionCount(type:"LIKE"|"DISLIKE", target_id: number, target_type: "POST"|"COMMENT"):Promise<number> {
    console.log(`Getting ${type} count for ${target_type} ${target_id}`);
    
    try {
        const { data, error } = await supabase
            .from('reaction')
            .select('*')
            .eq('target_id', target_id)
            .eq('target_type', target_type)
            .eq('type', type);
            
        if (error) {
            console.error('Error getting reaction count:', error);
            throw new Error(error.message);
        }
        
        const count = data ? data.length : 0;
        console.log(`Found ${count} ${type} reactions for ${target_type} ${target_id}`);
        return count;
    } catch (err) {
        console.error('Exception getting reaction count:', err);
        throw err;
    }
}



