import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '../stores/userStore';
import { beforeEach, test, expect, describe } from 'vitest';
import { Post,Coordinate, CreatePost,UpdatePost, getAllPosts, createPost, getPostById, getPosts, getPostsWithFilter, updatePostById, deletePostById, searchPostsByContent, findHotPointsFromPosts } from '../services/apiPost';

let postId:number;
let userId:string;
const newPost:CreatePost={
    content: "Test post",
    category_id: 3,
    longitude: 103.871955871582,
    latitude: 1.35084987098825,
    
}
const updatedPost:UpdatePost={
    content: "Test post updated",
    category_id: 3,
    longitude: 103.871955871582,
    latitude: 1.35084987098825,
}


describe.sequential('apiPost', async () => {

beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore=useUserStore();
    await userStore.initUser();
    await userStore.loginUser("normal3@gmail.com","123456");
    if (!userStore.user) throw new Error('User not logged in');
    userId=userStore.user.id;
});

test('create post', async () => {
    expect(async ()=>{await createPost(newPost);}).not.toThrow();
});

test('get my latest post', async () => {
    const myPosts:Post[]=await getPostsWithFilter("user_id", userId, 0, 9);
    expect(myPosts.length).toBeGreaterThan(0);
    expect(myPosts.length).toBeLessThanOrEqual(10);
    expect(myPosts[0].user_id).toBe(userId);
    expect(myPosts[0].content).toBe(newPost.content);
    expect(myPosts[0].longitude).toBe(newPost.longitude);
    expect(myPosts[0].latitude).toBe(newPost.latitude);
    expect(myPosts[0].category_id).toBe(newPost.category_id); 
    postId=myPosts[0].id;
});

test('get post by id', async () => {
    const post:Post=await getPostById(postId);
    expect(post.id).toBe(postId);
    expect(post.user_id).toBe(userId);
    expect(post.content).toBe(newPost.content);
    expect(post.longitude).toBe(newPost.longitude);
    expect(post.latitude).toBe(newPost.latitude);
    expect(post.category_id).toBe(newPost.category_id); 
});

test('update post by id', async () => {
    await updatePostById(postId, updatedPost);
    const post:Post=await getPostById(postId);
    expect(post.id).toBe(postId);
    expect(post.user_id).toBe(userId);
    expect(post.content).toBe(updatedPost.content);
    expect(post.longitude).toBe(updatedPost.longitude);
    expect(post.latitude).toBe(updatedPost.latitude);
    expect(post.category_id).toBe(updatedPost.category_id); 
});

test('search posts by content', async () => {
    const posts:Post[]=await searchPostsByContent("updated",0,9);
    expect(posts.length).toBeGreaterThan(0);
})

test('delete post by id', async () => {
    await deletePostById(postId);
    expect(async ()=>{
        await getPostById(postId);
    }
    ).rejects.toThrow();
});

test('find hot points',async () => {
    const posts:Post[]=await getAllPosts();
    const coordinates:Coordinate[]=await findHotPointsFromPosts(posts);
    expect(coordinates.length).toBeGreaterThan(0);
    console.log(coordinates);

});

});