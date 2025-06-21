import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '../stores/userStore.ts';
import { beforeEach, test, expect, describe } from 'vitest';
import { Reaction, CreateReaction, getMyReaction, addReaction, removeReaction, getReactionCount } from '../services/apiReaction.ts';
import { Post, CreatePost, UpdatePost, createPost, getPostById, getPosts } from '../services/apiPost.ts';

describe.sequential('apiReaction', async () => {

const postId:number=129;

beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore=useUserStore();
    await userStore.initUser();
    await userStore.loginUser("normal5@gmail.com","123456");
    if (!userStore.user) throw new Error('User not logged in');

});


test('delete my reaction', async () => {

    const reaction:Reaction|null=await getMyReaction(postId,"POST");
    if (reaction!==null) {
        expect(async()=>{await removeReaction(reaction.target_id,reaction.target_type)}).not.toThrow();
    }
})


test('LIKE a post', async () => {
    const createReaction:CreateReaction={
        type: "LIKE",
        target_id: postId,
        target_type: "POST"
    }
    expect(async()=>{await addReaction(createReaction)}).not.toThrow();
})

test('get my reaction LIKE', async () => {
    const reaction:Reaction|null=await getMyReaction(postId,"POST");
    expect(reaction).not.toBe(null);
    expect(reaction?.type).toBe("LIKE");
})

test('remove my reaction', async () => {
    const reaction:Reaction|null=await getMyReaction(postId,"POST");
    if (reaction) {
        expect(async()=>{await removeReaction(reaction.target_id,reaction.target_type)}).not.toThrow();
    }
})

test('DISLIKE a post', async () => {
    const reaction:CreateReaction={
        type: "DISLIKE",
        target_id: postId,
        target_type: "POST"
    }
    expect(async()=>{await addReaction(reaction)}).not.toThrow();
})

test('get my reaction DISLIKE', async () => {
    const reaction:Reaction|null=await getMyReaction(postId,"POST");
    expect(reaction).not.toBe(null);
    expect(reaction?.type).toBe("DISLIKE");
})

test('get reaction count', async () => {
    const likeCount=await getReactionCount("LIKE",postId,"POST");  
    expect(likeCount).toBeGreaterThanOrEqual(0);
    const dislikeCount=await getReactionCount("DISLIKE",postId,"POST");  
    expect(dislikeCount).toBeGreaterThan(0);
})

test('remove my reaction', async () => {
    const reaction:Reaction|null=await getMyReaction(postId,"POST");
    if (reaction) {
        expect(async()=>{await removeReaction(reaction.target_id,reaction.target_type)}).not.toThrow();
    }
})

});
