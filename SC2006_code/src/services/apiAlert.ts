import supabase from '../supabase.ts';
import { useUserStore } from '../stores/userStore';
import { Profile, getProfile } from './apiProfile.ts';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Alert {
    created_at: string;
    id: number;
    user_id: number;
    content: string;
    category_id: number;
    longitude: number;
    latitude: number;
}

export interface CreateAlert {
    content: string;
    category_id: number;
    longitude?: number;
    latitude?: number;
}


export async function createAlert(createAlert: CreateAlert):Promise<Alert> {
    const userStore=useUserStore();
    if (!userStore.user) throw new Error('User not logged in');
    const profile:Profile=await getProfile();
    if (profile.type==="NORMAL") throw new Error('User not authorized to create alerts');
    const alertWithUserId={
        ...createAlert,
        user_id: userStore.user.id
    }
    const {data,error}=await supabase
        .from('alert')
        .insert(alertWithUserId)
        .single();
    if(error){
        throw new Error(error.message);
    }
    return data;
}

export async function getAlerts():Promise<Alert[]> {
    const { data, error } = await supabase
        .from('alert')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        throw new Error(error.message);
    }
    return data;
}  

export async function getLatestAlert():Promise<Alert|null> {
    const { data, error } = await supabase
        .from('alert')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export function subscribeToAlerts(callback: () => void): RealtimeChannel {
    const subscription:RealtimeChannel = supabase
        .channel('alert')
        .on('postgres_changes', 
            {
                event: 'INSERT',
                schema: 'public',
                table: 'alert',
            },
            () => callback()
        )
        .subscribe();
    return subscription;
}

export function unsubscribeFromAlerts(subscription: RealtimeChannel) {
    supabase.removeChannel(subscription);
}

