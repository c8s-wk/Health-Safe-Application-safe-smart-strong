import supabase from '../supabase.ts';
import { useUserStore } from '../stores/userStore';

export interface Post {
    created_at: string;
    id: number;
    content: string;
    longitude: number;
    latitude: number;
    user_id: string;
    category_id: number;
}

export interface CreatePost {
    content: string;
    category_id: number;
    longitude?: number;
    latitude?: number;
    
}

export interface UpdatePost {
    content: string;
    category_id: number;
    longitude?: number;
    latitude?: number;
    
}

export type Coordinate = { latitude: number, longitude: number }

export async function createPost(createPost: CreatePost) {
    const userStore=useUserStore();
    if (!userStore.user) throw new Error('User not logged in');
    const postWithUserId={
        ...createPost,
        user_id: userStore.user.id
    }
    const {data,error}=await supabase
        .from('post')
        .insert(postWithUserId)
        .single();
    if(error){
        throw new Error(error.message);
    }
}


export async function getPostById(id:number):Promise<Post> {
    try {
        console.log(`Fetching post with ID: ${id}`)
        const { data, error } = await supabase
            .from('post')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) {
            console.error(`Error fetching post with ID ${id}:`, error)
            throw new Error(error.message)
        }
        
        if (!data) {
            console.error(`No post found with ID ${id}`)
            throw new Error(`Post with ID ${id} not found`)
        }
        
        console.log(`Successfully retrieved post with ID ${id}:`, data)
        return data
    } catch (err) {
        console.error(`Exception in getPostById(${id}):`, err)
        throw err
    }
}

export async function getPosts(rangeStart:number, rangeEnd:number):Promise<Post[]> {
    try {
        const { data, error } = await supabase
            .from('post')
            .select('*')
            .range(rangeStart, rangeEnd)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error fetching posts:', error)
            throw new Error(error.message)
        }
        
        // Return empty array if no data (rather than null)
        return data || []
    } catch (err) {
        console.error('Exception in getPosts:', err)
        throw err
    }
}   

export async function getAllPosts():Promise<Post[]> {
    const { data, error } = await supabase
        .from('post')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function getPostsWithFilter(field:string, value:string|number, rangeStart:number, rangeEnd:number):Promise<Post[]> {
    const { data, error } = await supabase
        .from('post')
        .select('*')
        .eq(field, value)
        .order('created_at', { ascending: false })
        .range(rangeStart, rangeEnd);
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function updatePostById(id:number, updatePost: UpdatePost) {
    const { data, error } = await supabase
        .from('post')
        .update(updatePost)
        .eq('id', id);
    if (error) {
        throw new Error(error.message);
    }
}

export async function deletePostById(id:number) {
    const { data, error } = await supabase
        .from('post')
        .delete()
        .eq('id', id);
    if (error) {
        throw new Error(error.message);
    }
}

export async function searchPostsByContent(query:string, rangeStart:number, rangeEnd:number) {
    const { data, error } = await supabase
        .from('post')
        .select('*')
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .range(rangeStart, rangeEnd);
    if (error) {
        throw new Error(error.message);
    }
    return data;
}

export async function searchPostsByContentWithFilter(field:string, value:string|number, query:string, rangeStart:number, rangeEnd:number) {
    const { data, error } = await supabase
        .from('post')
        .select('*')
        .eq(field, value)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .range(rangeStart, rangeEnd);
    if (error) {
        throw new Error(error.message);
    }
    return data;
}


export function findHotPointsFromPosts(
    posts: Coordinate[],
    hotspotsCount: number = 5,
    maxIterations: number = 100
): Coordinate[] {
    if (posts.length === 0 || hotspotsCount <= 0) return [];
    
    // 实际热点数量不超过数据点数量
    const actualHotspotsCount = Math.min(hotspotsCount, posts.length);
    
    // 转换为坐标数组
    const coordinates: Coordinate[] = posts.map(post => ({
        latitude: post.latitude,
        longitude: post.longitude
    }));

    // 初始化随机中心点
    let centroids: Coordinate[] = [];
    for (let i = 0; i < actualHotspotsCount; i++) {
        centroids.push(coordinates[Math.floor(Math.random() * coordinates.length)]);
    }

    // K-Means算法
    for (let iter = 0; iter < maxIterations; iter++) {
        // 分配每个点到最近的中心点
        const clusters: Coordinate[][] = Array(actualHotspotsCount)
            .fill(null)
            .map(() => []);
        
        coordinates.forEach(point => {
            let minDist = Infinity;
            let clusterIndex = 0;
            
            centroids.forEach((centroid, index) => {
                const dist = haversineDistance(point, centroid);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIndex = index;
                }
            });
            
            clusters[clusterIndex].push(point);
        });

        // 计算新的中心点
        let converged = true;
        const newCentroids: Coordinate[] = [];
        
        clusters.forEach((cluster, index) => {
            if (cluster.length === 0) {
                newCentroids.push(centroids[index]); // 保持原中心点
                return;
            }
            
            const newCentroid = {
                latitude: cluster.reduce((sum, p) => sum + p.latitude, 0) / cluster.length,
                longitude: cluster.reduce((sum, p) => sum + p.longitude, 0) / cluster.length
            };
            
            // 检查是否收敛（移动距离大于10米则继续迭代）
            if (haversineDistance(newCentroid, centroids[index]) > 0.01) {
                converged = false;
            }
            
            newCentroids.push(newCentroid);
        });
        
        centroids = newCentroids;
        if (converged) break;
    }

    return centroids;
}


function haversineDistance(a: Coordinate, b: Coordinate): number {
    const R = 6371; // 地球半径（公里）
    const dLat = (b.latitude - a.latitude) * Math.PI / 180;
    const dLon = (b.longitude - a.longitude) * Math.PI / 180;
    
    const lat1 = a.latitude * Math.PI / 180;
    const lat2 = b.latitude * Math.PI / 180;
    
    const x = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}