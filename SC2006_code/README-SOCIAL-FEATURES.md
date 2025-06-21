# Social Features Implementation

This document explains how to set up and use the likes and comments functionality in the health community application.

## Database Setup

The application requires two additional tables in the Supabase database to support likes and comments functionality:

1. **post_like** - Stores post likes
2. **comment** - Stores post comments

To create these tables and set up the necessary policies, execute the SQL commands from the `database/tables.sql` file in your Supabase SQL editor.

## Features Implemented

### Likes

- Users can like and unlike posts
- Like count is displayed on both post cards and post detail views
- Like status is preserved between sessions
- Only authenticated users can like posts
- The UI updates reactively when users like/unlike posts

### Comments

- Users can add comments to posts
- Comments are displayed in chronological order
- Comment count is displayed on post cards
- Only authenticated users can add comments
- Each comment shows the user ID and timestamp

## Implementation Files

The implementation consists of several key files:

1. **Services**:
   - `services/apiLike.ts` - Service for handling post likes
   - `services/apiComment.ts` - Service for handling post comments

2. **Views**:
   - `views/PostDetailView.vue` - Updated to display and handle likes and comments
   - `views/PostsView.vue` - Updated to display like and comment counts

## Using the Features

### Likes

- Click the heart icon on a post to like/unlike it
- If not logged in, you'll be redirected to the login page
- Like counts are visible on both post lists and post detail views

### Comments

- On a post detail page, scroll down to the comments section
- If logged in, you can use the comment form to add a new comment
- If not logged in, a message will prompt you to sign in
- All post comments are listed below the comment form

## Technical Notes

1. **Database Structure**:
   - The `post_like` table has a unique constraint on `(user_id, post_id)` to ensure a user can only like a post once
   - Both tables have appropriate indexes for performance optimization
   - Both tables use Row Level Security (RLS) to enforce access control

2. **API Services**:
   - `toggleLike` provides an easy way to toggle the like status
   - Comment counts are preloaded when viewing posts to avoid additional API calls

3. **Error Handling**:
   - All API calls include proper error handling
   - Failed operations show appropriate user feedback

## Testing the Features

To test these features:

1. Create a user account or log in
2. Navigate to the posts page
3. Click on a post to view its details
4. Try liking the post and adding a comment
5. Log out and verify that you can still see likes and comments, but cannot interact with them
6. Log in with a different account and verify that likes are independent between users 