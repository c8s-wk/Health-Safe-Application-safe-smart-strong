import supabase from '../supabase.ts';
import { useUserStore } from '../stores/userStore';


export interface Profile {
    created_at: string;
    id: number;
    name: string;
    user_id: string;
    type: "NORMAL"|"MODERATOR"|"ADMIN"|"RESTRICTED";
}

export interface UpdateProfile {
    name?: string;
}

export async function getProfileByUserId(userId: string): Promise<Profile> {
    let data,error;
    ({ data, error } = await supabase
       .from('profile')
       .select()
       .eq('user_id', userId)
       .single());

    if (error) {
        try {
            await createProfile(userId, `User_${userId}`);
        } catch (e) {
            if (e instanceof Error) {
                throw new Error(e.message);
            }
            throw new Error('An unknown error occurred while creating the profile');
        }
    }

    ({ data, error } = await supabase   
        .from('profile')
        .select()
        .eq('user_id', userId)
        .single());
    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getProfile(): Promise<Profile> {
    const userStore = useUserStore();
    if (!userStore.user) throw new Error('User not logged in');
    return await getProfileByUserId(userStore.user.id);
}

async function createProfile(userId: string, name: string):Promise<Profile> {
    const { data, error } = await supabase
       .from('profile')
       .insert([
            { user_id: userId, name: name },
        ])
       .single();
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

async function updateProfileByUserId(userId: string, updates: UpdateProfile) {
    if (updates.name && (updates.name.length>255||updates.name.length<1)) {
        throw new Error('Illegal name');
    }
    const { data, error } = await supabase
       .from('profile')
       .update(updates)
       .eq('user_id', userId)
       .single();
    if (error) {
        throw new Error(error.message);
    }
}

export async function updateProfile(updates: UpdateProfile) {
    const userStore = useUserStore();
    if (!userStore.user) throw new Error('User not logged in');
    await updateProfileByUserId(userStore.user.id, updates);
}

async function deleteProfileByUserId(userId: string) {
    const { error } = await supabase
       .from('profile')
       .delete()
       .eq('user_id', userId);
    if (error) {
        throw new Error(error.message);
    }
}

export async function deleteProfile() {
    const userStore = useUserStore();
    if (!userStore.user) throw new Error('User not logged in');
    await deleteProfileByUserId(userStore.user.id);
}

export async function searchProfileByName(name: string): Promise<Profile[]> {
    const { data, error } = await supabase
       .from('profile')
       .select('*')
       .ilike('name', `%${name}%`)
       .order('name', { ascending: true });
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function changeUserTypeByUserId(userId: string, newType: string) {
    const selfProfile=await getProfile();
    const targetProfile=await getProfileByUserId(userId);
    const selfType=selfProfile.type;
    const targetType=targetProfile.type;
    // console.log(`selfType: ${selfType}, targetType: ${targetType}, newType: ${newType}`);
    if (
        (selfType==='ADMIN' && targetType!=='ADMIN' && newType!=='ADMIN')
        || (selfType==='MODERATOR' && targetType==='NORMAL' && newType==='RESTRICTED')
        || (selfType==='MODERATOR' && targetType==='RESTRICTED' && newType==='NORMAL')
    ) {
        const { data, error } = await supabase
            .from('profile')
            .update({ type: newType })
            .eq('user_id', userId)
            .single();
        if (error) {
            throw new Error(error.message);
        }
        return data;
    } else {
        throw new Error('User not authorized to change this profile type');
    }
}
