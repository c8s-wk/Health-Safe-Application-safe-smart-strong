import { createPinia, setActivePinia } from 'pinia';
import { useUserStore } from '../stores/userStore.ts';
import { beforeEach, test, expect, describe } from 'vitest';
import {Comment, CreateComment, addComment, removeCommentById, getComments, getCommentById} from '../services/apiComment.ts'

describe.sequential('apiComments', async () => {

const postId:number=129;
const createCommentOnPost:CreateComment={
    content: "Test comment",
    target_id: postId,
    target_type: "POST"
}
const createCommentOnComment:CreateComment={
    content: "Test comment on comment",
    target_id: -1,
    target_type: "COMMENT"
}

let commentId:number;
let commentCount:number;

let commentOnCommentId:number;
let commentOnCommemtCount:number;


beforeEach(async () => {
    const pinia = createPinia();
    setActivePinia(pinia);
    const userStore=useUserStore();
    await userStore.initUser();
    await userStore.loginUser("normal4@gmail.com","123456");
    if (!userStore.user) throw new Error('User not logged in');

});

test('get comments', async () => {
    let comments:Comment[]=await getComments(postId,"POST");
    expect(comments.length).toBeGreaterThanOrEqual(0);
});

test('add comment', async () => {
    let comments:Comment[]=await getComments(postId,"POST");
    commentCount=comments.length;
    await addComment(createCommentOnPost);
    comments=await getComments(postId,"POST");
    expect(comments.length).toBe(commentCount+1);
    commentId=comments[0].id;
});


test('comment a comment', async () => {
    createCommentOnComment.target_id=commentId;
    let commentsOnComments:Comment[]=await getComments(commentId,"COMMENT");
    commentOnCommemtCount=commentsOnComments.length;
    await addComment(createCommentOnComment);
    commentsOnComments=await getComments(commentId,"COMMENT"); 
    expect(commentsOnComments.length).toBe(commentOnCommemtCount+1);
    commentOnCommentId=commentsOnComments[0].id;
});

test('remove comment on comment', async () => {
    expect(async()=>{await removeCommentById(commentOnCommentId)}).not.toThrow();
    expect(async()=>{
        await getCommentById(commentId);
    }).not.toThrow();
});

test('remove comment', async () => {
    expect(async()=>{await removeCommentById(commentId)}).not.toThrow();
    expect(async()=>{
        await getComments(postId,"POST");
    }).not.toThrow();
});

});

