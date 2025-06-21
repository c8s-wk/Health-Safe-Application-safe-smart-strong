import { useUserStore } from '../stores/userStore.ts';
import supabase from '../supabase.ts';


export interface Comment {
    id: number;
    created_at: string;
    user_id: string;
    content:string;
    target_id: number;
    target_type: "POST"|"COMMENT";
}

export interface CreateComment {
    content:string;
    target_id: number;
    target_type: "POST"|"COMMENT";
}

export interface UpdateComment {
    content: string;
}

export async function addComment(createComment: CreateComment) {
    
    const userStore=useUserStore();
    if (!userStore.user) throw new Error('User not logged in'); 
    const commentWithUserId={
        ...createComment,
        user_id: userStore.user.id
    }
    const { data, error } = await supabase
        .from('comment')
        .insert(commentWithUserId)
        .single();
    if (error) {
        throw new Error(error.message);
    }
    
}

export async function removeCommentById(id:number) {
    const userStore=useUserStore();
    if (!userStore.user) throw new Error('User not logged in');
    const { data, error } = await supabase
        .from('comment')
        .delete()
        .eq('id', id)
    if (error) {
        throw new Error(error.message);
    }
}

export async function getComments(target_id: number, target_type: "POST"|"COMMENT"):Promise<Comment[]> {
    const { data, error } = await supabase
        .from('comment')
        .select('*')
        .eq('target_id', target_id)
        .eq('target_type', target_type)
        .order('created_at', { ascending: false })
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function getCommentById(id:number):Promise<Comment> {
    const { data, error } = await supabase
        .from('comment')
        .select('*')
        .eq('id', id)
        .single();
    if (error) {
        throw new Error(error.message);
    }
    return data;
}
/**
 * Create a new comment for a post
 */
export async function createComment(createComment: CreateComment): Promise<Comment> {
    const userStore = useUserStore();
    if (!userStore.user) throw new Error('User not logged in');
    
    const commentWithUserId = {
        ...createComment,
        user_id: userStore.user.id
    };
    
    const { data, error } = await supabase
        .from('comment')
        .insert(commentWithUserId)
        .select()
        .single();
    
    if (error) {
        throw new Error(error.message);
    }
    
    return data;
}

/**
 * Get all comments for a specific post
 */
export async function getCommentsByPostId(postId: number): Promise<Comment[]> {
    const { data, error } = await supabase
        .from('comment')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
    
    if (error) {
        throw new Error(error.message);
    }
    
    return data || [];
}

/**
 * Update a comment by ID
 */
export async function updateCommentById(id: number, updateComment: UpdateComment): Promise<void> {
    const userStore = useUserStore();
    if (!userStore.user) throw new Error('User not logged in');
    
    // First check if the user is the author of the comment
    const { data: comment, error: fetchError } = await supabase
        .from('comment')
        .select('user_id')
        .eq('id', id)
        .single();
    
    if (fetchError) {
        throw new Error(fetchError.message);
    }
    
    if (comment.user_id !== userStore.user.id) {
        throw new Error('You are not authorized to update this comment');
    }
    
    const { error } = await supabase
        .from('comment')
        .update(updateComment)
        .eq('id', id);
    
    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Delete a comment by ID
 */
export async function deleteCommentById(id: number): Promise<void> {
    const userStore = useUserStore();
    if (!userStore.user) throw new Error('User not logged in');
    
    // First check if the user is the author of the comment
    const { data: comment, error: fetchError } = await supabase
        .from('comment')
        .select('user_id')
        .eq('id', id)
        .single();
    
    if (fetchError) {
        throw new Error(fetchError.message);
    }
    
    if (comment.user_id !== userStore.user.id) {
        throw new Error('You are not authorized to delete this comment');
    }
    
    const { error } = await supabase
        .from('comment')
        .delete()
        .eq('id', id);
    
    if (error) {
        throw new Error(error.message);
    }
}

