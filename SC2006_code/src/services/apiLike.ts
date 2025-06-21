import { getMyReaction, getReactionCount, addReaction, removeReaction } from './apiReaction';

/**
 * Get the like count for a post
 * @param postId The post ID to get likes for
 * @returns The number of likes
 */
export async function getLikeCount(postId: number): Promise<number> {
  return getReactionCount("LIKE", postId, "POST");
}

/**
 * Check if the current user has liked a post
 * @param postId The post ID to check
 * @returns True if the user has liked the post, false otherwise
 */
export async function hasUserLikedPost(postId: number): Promise<boolean> {
  const reaction = await getMyReaction(postId, "POST");
  return !!reaction && reaction.type === "LIKE";
}

/**
 * Toggle the like status for a post
 * @param postId The post ID to toggle like for
 * @returns True if the post is now liked, false if unliked
 */
export async function toggleLike(postId: number): Promise<boolean> {
  const reaction = await getMyReaction(postId, "POST");
  
  if (reaction && reaction.type === "LIKE") {
    // Remove like
    await removeReaction(postId, "POST");
    return false;
  } else {
    // Add like
    await addReaction({
      type: "LIKE",
      target_id: postId,
      target_type: "POST"
    });
    return true;
  }
} 