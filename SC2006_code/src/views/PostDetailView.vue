<script setup lang="ts">
import { ref, computed, onMounted, onActivated, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostById, type Post } from '../services/apiPost'
import { getCategoryById } from '../services/apiCategory'
import { useUserStore } from '../stores/userStore'
import { getReactionCount, getMyReaction, addReaction, removeReaction } from '../services/apiReaction'
import { createReport, hasReported } from '../services/apiReport'
import { createComment, getComments, getCommentsByPostId } from '../services/apiComment'
import supabase from '../supabase'
import { Loader } from '@googlemaps/js-api-loader'
import MapPost from '../components/MapPost.vue'
import { deletePostById } from '../services/apiPost'


import { getProfileByUserId, Profile } from '../services/apiProfile'

// 在已有响应式变量中添加
const userProfiles = ref<Record<string, Profile>>({})
const profileLoading = ref(false)

// 新增方法：批量获取用户资料
const loadUserProfiles = async (userIds: string[]) => {
  try {
    profileLoading.value = true
    const uniqueIds = Array.from(new Set(userIds))
    
    // 并行请求优化
    const profiles = await Promise.allSettled(
      uniqueIds.map(id => getProfileByUserId(id))
    )

    profiles.forEach(result => {
      if (result.status === 'fulfilled') {
        userProfiles.value[result.value.user_id] = result.value
      }
    })
  } catch (error) {
    console.error('Error loading user profiles:', error)
  } finally {
    profileLoading.value = false
  }
}





const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const post = ref<Post | null>(null)
const categoryName = ref<string>('')
const isLoading = ref(true)
const error = ref<string | null>(null)
const mapContainer = ref<HTMLElement | null>(null)
const map = ref<google.maps.Map | null>(null)


const userRole = ref<string | null>(null)

const fetchUserRole = async () => {
  if (userStore.user?.id) {
    const profile = await getProfileByUserId(userStore.user.id)
    userRole.value = profile?.type ?? null
  }
}
onMounted(() => {
  fetchUserRole()
})

const isPrivileged = computed(() => ['MODERATOR', 'ADMIN'].includes(userRole.value || ''))

const handleDeletePost = async () => {
  if (!post.value) return;

  try {
    const authorProfile = await getProfileByUserId(post.value.user_id)
    const authorType = (authorProfile?.type || '').toUpperCase()
    const currentUserRole = (userRole.value || '').toUpperCase()

    if (
      currentUserRole === 'MODERATOR' &&
      ['ADMIN', 'MODERATOR'].includes(authorType)
    ) {
      alert('Moderators cannot delete posts by Admins or other Moderators.')
      return;
    }

    const confirmDelete = confirm('Are you sure you want to delete this post?')
    if (!confirmDelete) return;

    await deletePostById(post.value.id)
    alert('Post deleted successfully.')
    router.push('/posts')
  } catch (err) {
    console.error('Failed to delete post:', err)
    alert('Failed to delete post. Please try again later.')
  }
}



// Extract post title from the first line of content
const postTitle = computed(() => {
  if (!post.value?.content) return 'Post Detail'
  // Get the first line or first 50 characters, whichever is shorter
  const firstLine = post.value.content.split('\n')[0]
  return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
})

// Debug - log route parameters
console.log('PostDetailView mounted, route params:', route.params)

// Like functionality
const likeCount = ref(0)
const userHasLiked = ref(false)
const isLikeLoading = ref(false)

// Dislike functionality
const dislikeCount = ref(0)
const userHasDisliked = ref(false)
const isDislikeLoading = ref(false)

// Comment functionality
const comments = ref<{ 
  id: number; 
  content: string; 
  created_at: string; 
  user_id: string; 
  post_id: number; 
  target_id: number;
  target_type: "POST" | "COMMENT";
  likesCount: number; 
  dislikesCount: number; 
  userReaction: string | null;
  replies?: { 
    id: number; 
    content: string; 
    created_at: string; 
    user_id: string; 
    target_id: number;
    target_type: "POST" | "COMMENT";
    likesCount: number;
    dislikesCount: number;
    userReaction: string | null;
    parent_id?: number;
    parent_user_id?: string;
  }[];
}[]>([])

const newComment = ref('')
const replyingToComment = ref<number | null>(null)
const replyingToReply = ref<number | null>(null)
const replyContent = ref('')
const isCommentLoading = ref(false)
const isReplyLoading = ref(false)
const showCommentForm = computed(() => !!userStore.user)

// Add a new reactive property to track authentication state
const isAuthenticated = computed(() => !!userStore.user)

// Post actions
const userHasReported = ref(false)
const showReportModal = ref(false)
const reportReason = ref('')
const reportDetails = ref('')
const isReportSubmitting = ref(false)
const reportError = ref<string | null>(null)
const reportSuccess = ref(false)

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format relative time (e.g., "2 hours ago")
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  
  // Convert to seconds, minutes, hours, days
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSec < 60) {
    return 'just now'
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
  } else {
    return formatDate(dateString)
  }
}

// Format comment text to highlight mentions
const formatCommentText = (text: string): string => {
  // Regex to match @User mentions
  const mentionRegex = /@User([a-zA-Z0-9]{8})\.{3}/g;
  
  // Replace mentions with styled spans (we'll use Vue's v-html so this is safe)
  const formattedText = text.replace(mentionRegex, '<span class="mention">@User$1...</span>');
  
  return formattedText;
}

// Add a flag to track if post has been loaded already
const isPostLoaded = ref(false)
// Add a postId ref to store the current post ID
const currentPostId = ref<number | null>(null)

// Load the post by ID
const loadPost = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const postId = parseInt(route.params.id as string)
    
    if (isNaN(postId)) {
      error.value = 'Invalid post ID'
      return
    }
    
    // Store the current post ID for reuse
    currentPostId.value = postId
    
    // Check if we're loading the same post (return visits)
    const isSamePost = post.value?.id === postId
    
    // If post is already loaded, just refresh comments and reactions
    if (isPostLoaded.value && isSamePost) {
      console.log('Post already loaded, refreshing comments and reactions only')
      
      // Refresh comments and reactions without reloading the entire post
      await Promise.all([
        loadComments(postId),
        loadReactions(postId),
        checkReportStatus(postId)
      ])
      
      return
    }
    
    // Full load for first visit or different post
    const postData = await getPostById(postId)
    post.value = postData
    
    // If post has a category id, fetch the category name
    if (post.value?.category_id) {
      try {
        const category = await getCategoryById(post.value.category_id)
        categoryName.value = category.name
      } catch (err) {
        console.error('Error fetching category:', err)
        categoryName.value = 'Unknown Category'
      }
    }
    
    // Load reactions
    await loadReactions(postId)
    
    // Load comments
    await loadComments(postId)
    
    // Mark post as loaded
    isPostLoaded.value = true
  } catch (err) {
    console.error('Error loading post:', err)
    error.value = 'Failed to load post. ' + (err instanceof Error ? err.message : String(err))
  } finally {
    isLoading.value = false
  }
}

// Load reactions for the post
const loadReactions = async (postId: number) => {
  try {
    const [likeCountData, dislikeCountData, myReaction] = await Promise.all([
      getReactionCount("LIKE", postId, "POST"),
      getReactionCount("DISLIKE", postId, "POST"),
      getMyReaction(postId, "POST")
    ])
    
    likeCount.value = likeCountData
    dislikeCount.value = dislikeCountData
    
    if (myReaction) {
      userHasLiked.value = myReaction.type === "LIKE"
      userHasDisliked.value = myReaction.type === "DISLIKE"
    } else {
      userHasLiked.value = false
      userHasDisliked.value = false
    }
  } catch (err) {
    console.error('Error loading reactions:', err)
  }
}

// Handle like button click
const handleLikeClick = async () => {
  if (!isAuthenticated.value) {
    // Show login prompt
    const confirmLogin = window.confirm('You need to be logged in to like posts. Would you like to log in now?')
    if (confirmLogin) {
      router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
    }
    return
  }

  if (userRole.value === 'RESTRICTED') {
    alert('You are restricted from this action.')
    return
  }
  
  if (!post.value) return
  
  try {
    isLikeLoading.value = true
    const myReaction = await getMyReaction(post.value.id, "POST")
    
    if (myReaction && myReaction.type === "LIKE") {
      // Remove like
      await removeReaction(post.value.id, "POST")
      userHasLiked.value = false
      likeCount.value -= 1
    } else {
      // Add like (or change from dislike to like)
      if (myReaction && myReaction.type === "DISLIKE") {
        // If user had previously disliked, reduce dislike count
        dislikeCount.value -= 1
      }
      
      await removeReaction(post.value.id, "POST") // Remove any existing reaction
      await addReaction({
        type: "LIKE",
        target_id: post.value.id,
        target_type: "POST"
      })
      userHasLiked.value = true
      userHasDisliked.value = false
      likeCount.value += 1
    }
  } catch (err) {
    console.error('Error toggling like:', err)
  } finally {
    isLikeLoading.value = false
  }
}

// Handle dislike button click
const handleDislikeClick = async () => {
  if (!isAuthenticated.value) {
    // Show login prompt
    const confirmLogin = window.confirm('You need to be logged in to dislike posts. Would you like to log in now?')
    if (confirmLogin) {
      router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
    }
    return
  }
  if (userRole.value === 'RESTRICTED') {
    alert('You are restricted from this action.')
    return
  }
  if (!post.value) return
  
  try {
    isDislikeLoading.value = true
    const myReaction = await getMyReaction(post.value.id, "POST")
    
    if (myReaction && myReaction.type === "DISLIKE") {
      // Remove dislike
      await removeReaction(post.value.id, "POST")
      userHasDisliked.value = false
      dislikeCount.value -= 1
    } else {
      // Add dislike (or change from like to dislike)
      if (myReaction && myReaction.type === "LIKE") {
        // If user had previously liked, reduce like count
        likeCount.value -= 1
      }
      
      await removeReaction(post.value.id, "POST") // Remove any existing reaction
      await addReaction({
        type: "DISLIKE",
        target_id: post.value.id,
        target_type: "POST"
      })
      userHasDisliked.value = true
      userHasLiked.value = false
      dislikeCount.value += 1
    }
  } catch (err) {
    console.error('Error toggling dislike:', err)
  } finally {
    isDislikeLoading.value = false
  }
}

// Handle comment like/dislike with improved authentication checking
const handleCommentReaction = async (commentId: number, reactionType: "LIKE" | "DISLIKE") => {
  if (!isAuthenticated.value) {
    // Show login prompt
    const confirmLogin = window.confirm('You need to be logged in to rate comments. Would you like to log in now?')
    if (confirmLogin) {
      router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
    }
    return
  }
  if (userRole.value === 'RESTRICTED') {
    alert('You are restricted from this action.')
    return
  }
  
  try {
    console.log(`Handling ${reactionType} reaction for comment ${commentId}`)
    const myReaction = await getMyReaction(commentId, "COMMENT")
    
    if (myReaction && myReaction.type === reactionType) {
      // Remove reaction if clicking the same button
      await removeReaction(commentId, "COMMENT")
      console.log(`Removed ${reactionType} from comment ${commentId}`)
    } else {
      // Remove any existing reaction first
      if (myReaction) {
        await removeReaction(commentId, "COMMENT")
        console.log(`Removed previous reaction from comment ${commentId}`)
      }
      
      // Add new reaction
      await addReaction({
        type: reactionType,
        target_id: commentId,
        target_type: "COMMENT"
      })
      console.log(`Added ${reactionType} to comment ${commentId}`)
    }
    
    // Reload comments to update reaction counts
    if (post.value) {
      await loadComments(post.value.id)
    }
  } catch (err) {
    console.error(`Error handling comment ${reactionType}:`, err)
  }
}

// Enhanced loadComments function to use apiComment service and load replies
const loadComments = async (postId: number) => {
  try {
    // Get comments for this post using the apiComment service
    // IMPORTANT: The post_id field doesn't exist in the database schema
    // We need to use target_id and target_type instead
    let commentsData = await getComments(postId, "POST")
    
    console.log(`Loaded ${commentsData?.length || 0} main comments for post ${postId}`)
    
    // Function to recursively fetch replies and their reactions
    const fetchRepliesRecursively = async (targetId: number, parentId: number | null = null, parentUserId: string | null = null, depth: number = 0): Promise<any[]> => {
      if (depth > 10) {
        console.warn('Max reply depth reached (10 levels), stopping recursion');
        return [];
      }
      
      const replies = await getComments(targetId, "COMMENT");
      console.log(`Loaded ${replies?.length || 0} replies for ${parentId ? 'reply' : 'comment'} ${targetId} at depth ${depth}`);
      
      if (!replies || replies.length === 0) {
        return [];
      }
      
      // Process all replies at this level with reactions data
      const processedReplies = await Promise.all(replies.map(async (reply) => {
        const [likesCount, dislikesCount, myReaction] = await Promise.all([
          getReactionCount("LIKE", reply.id, "COMMENT"),
          getReactionCount("DISLIKE", reply.id, "COMMENT"),
          userStore.user ? getMyReaction(reply.id, "COMMENT") : null
        ]);
        
        // Recursively get replies to this reply
        const childReplies = await fetchRepliesRecursively(reply.id, reply.id, reply.user_id, depth + 1);
        
        return {
          ...reply,
          likesCount,
          dislikesCount,
          userReaction: myReaction ? myReaction.type : null,
          parent_id: parentId,
          parent_user_id: parentUserId,
          depth: depth,
          replies: childReplies
        };
      }));
      
      return processedReplies;
    };
    
    // Process top-level comments
    const enhancedComments = await Promise.all((commentsData || []).map(async (comment) => {
      const [likesCount, dislikesCount, myReaction] = await Promise.all([
        getReactionCount("LIKE", comment.id, "COMMENT"),
        getReactionCount("DISLIKE", comment.id, "COMMENT"),
        userStore.user ? getMyReaction(comment.id, "COMMENT") : null
      ]);
      
      // Get all replies for this comment (recursively)
      const replies = await fetchRepliesRecursively(comment.id);
      
      // Flatten all nested replies for display in the UI
      const flattenReplies = (replyList: any[]): any[] => {
        let flat: any[] = [];
        replyList.forEach(reply => {
          flat.push(reply);
          if (reply.replies && reply.replies.length > 0) {
            flat = flat.concat(flattenReplies(reply.replies));
            // Remove nested replies from the original object to avoid duplication
            delete reply.replies;
          }
        });
        return flat;
      };
      
      const allReplies = flattenReplies([...replies]);
      
      // Sort replies by created_at
      allReplies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      return {
        ...comment,
        likesCount,
        dislikesCount,
        userReaction: myReaction ? myReaction.type : null,
        replies: allReplies,
        post_id: postId,
      };
    }));

    const collectUserIds = (comments: any[]): string[] => {
      const ids = new Set<string>()
      const traverse = (items: any[]) => {
        items.forEach(item => {
          ids.add(item.user_id)
          if (item.replies?.length) traverse(item.replies)
        })
      }
      traverse(enhancedComments)
      return Array.from(ids)
    }

    const userIds = collectUserIds(enhancedComments)
    await loadUserProfiles(userIds)
    
    comments.value = enhancedComments;
  } catch (err) {
    console.error('Error loading comments:', err)
  }
}

// Set up replying to a specific comment
const startReply = (commentId: number) => {
  if (!isAuthenticated.value) {
    // Show login prompt
    const confirmLogin = window.confirm('You need to be logged in to reply to comments. Would you like to log in now?')
    if (confirmLogin) {
      router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
    }
    return
  }
  if (userRole.value === 'RESTRICTED') {
    alert('You are restricted from this action.')
    return
  }
  
  replyingToComment.value = commentId
  replyingToReply.value = null
  replyContent.value = ''
}

// Set up replying to a reply
const startReplyToReply = (replyId: number) => {
  if (!isAuthenticated.value) {
    // Show login prompt
    const confirmLogin = window.confirm('You need to be logged in to reply to comments. Would you like to log in now?')
    if (confirmLogin) {
      router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
    }
    return
  }
  if (userRole.value === 'RESTRICTED') {
    alert('You are restricted from this action.')
    return
  }
  
  replyingToComment.value = null
  replyingToReply.value = replyId
  replyContent.value = ''
}

// Cancel reply form
const cancelReply = () => {
  replyingToComment.value = null
  replyingToReply.value = null
  replyContent.value = ''
}

// Submit a new comment using apiComment service
const submitComment = async () => {
  if (!isAuthenticated.value) {
    // Show login prompt
    const confirmLogin = window.confirm('You need to be logged in to comment. Would you like to log in now?')
    if (confirmLogin) {
      router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
    }
    return
  }
  if (userRole.value === 'RESTRICTED') {
    alert('You are restricted from this action.')
    return
  }
  
  if (!post.value || !newComment.value.trim()) return
  
  try {
    isCommentLoading.value = true
    
    if (!userStore.user || !userStore.user.id) {
      throw new Error('User ID is missing. Please login again.')
    }
    
    // Create comment using the apiComment service with proper target_id and target_type
    const commentResponse = await createComment({
      content: newComment.value.trim(),
      target_id: post.value.id,
      target_type: "POST"
    })
    
    // Add the new comment to the top of the comments list with required fields
    const enhancedComment = {
      ...commentResponse,
      likesCount: 0,
      dislikesCount: 0,
      userReaction: null,
      post_id: post.value.id,
      replies: []
    }
    
    comments.value = [enhancedComment, ...comments.value]
    newComment.value = ''
    
    // Ensure user profile is loaded for the new comment
    if (userStore.user?.id && !userProfiles.value[userStore.user.id]) {
      const profile = await getProfileByUserId(userStore.user.id)
      userProfiles.value[userStore.user.id] = profile
    }
    
    // Force a refresh of all comments to ensure everything is up to date
    await loadComments(post.value.id)
  } catch (err) {
    console.error('Error posting comment:', err)
    alert(`Failed to post comment: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    isCommentLoading.value = false
  }
}

// Submit a reply to a comment or to another reply
const submitReply = async (targetId: number) => {
  if (!isAuthenticated.value) {
    // Show login prompt
    const confirmLogin = window.confirm('You need to be logged in to reply to comments. Would you like to log in now?')
    if (confirmLogin) {
      router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
    }
    return
  }
  if (userRole.value === 'RESTRICTED') {
    alert('You are restricted from this action.')
    return
  }
  
  if (!replyContent.value.trim()) return
  
  try {
    isReplyLoading.value = true
    
    if (!userStore.user || !userStore.user.id) {
      throw new Error('User ID is missing. Please login again.')
    }
    
    // Get the user ID of the target comment/reply for mention
    let targetUserId = '';
    
    console.log(`Finding target user ID for reply. Target ID: ${targetId}, replying to comment: ${replyingToComment.value !== null}, replying to reply: ${replyingToReply.value !== null}`);
    
    // Helper function to find a reply by ID in nested structure
    const findReplyById = (replyId: number): any => {
      for (const comment of comments.value) {
        if (comment.id === replyId) {
          console.log(`Found target as a main comment: ${comment.user_id}`);
          return comment;
        }
        
        if (comment.replies) {
          for (const reply of comment.replies) {
            if (reply.id === replyId) {
              console.log(`Found target as a reply: ${reply.user_id}`);
              return reply;
            }
          }
        }
      }
      console.log(`Could not find target with ID ${replyId}`);
      return null;
    };
    
    // Find the target based on the ID
    const target = findReplyById(targetId);
    if (target) {
      targetUserId = target.user_id;
      console.log(`Target user ID: ${targetUserId}`);
    }
    
    // Add @mention to the beginning of the reply
    // const replyContentWithMention = targetUserId 
    //   ? `@User_${targetUserId.substring(0, 8)}... ${replyContent.value.trim()}`
    //   : replyContent.value.trim();
    
    console.log(`Submitting reply to target_id: ${targetId}, type: COMMENT`);
    
    // Create reply using the apiComment service
    const replyResponse = await createComment({
      content: replyContent.value.trim(),
      target_id: targetId,
      target_type: "COMMENT"
    });
    
    console.log('Reply created successfully:', replyResponse);
    
    // Reset the reply form
    replyingToComment.value = null;
    replyingToReply.value = null;
    replyContent.value = '';
    
    // Reload all comments to update the replies
    if (post.value) {
      await loadComments(post.value.id);
    }

    if (userStore.user?.id && !userProfiles.value[userStore.user.id]) {
      const profile = await getProfileByUserId(userStore.user.id)
      userProfiles.value[userStore.user.id] = profile
    }
    
    // Show success message
    // alert('Your reply has been posted successfully!');
  } catch (err) {
    console.error('Error creating reply:', err);
    
    // More specific error message that shows the actual error
    let errorMessage = 'Unknown error';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (typeof err === 'string') {
      errorMessage = err;
    }
    
    alert('Failed to post reply: ' + errorMessage);
  } finally {
    isReplyLoading.value = false;
  }
}

// Check if the current user is the author of the post
const isAuthor = computed(() => {
  if (!post.value || !userStore.user) return false
  return post.value.user_id === userStore.user.id
})

// Go back to posts list
const goBack = () => {
  router.push('/posts')
}

// Check if user has reported this post
const checkReportStatus = async (postId: number) => {
  console.log(`Checking report status for post ${postId}`)
  
  try {
    const hasUserReported = await hasReported(postId)
    console.log(`Report status for post ${postId}: ${hasUserReported ? 'Reported' : 'Not reported'}`)
    userHasReported.value = hasUserReported
  } catch (err) {
    console.error('Error checking report status:', err)
    // Don't update userHasReported to avoid UI flickering
  }
}

// Open report modal
const openReportModal = () => {
  if (!isAuthenticated.value) {
    const confirmLogin = window.confirm('You need to be logged in to report this post. Would you like to log in now?')
    if (confirmLogin) {
      router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
    }
    return
  }
  
  reportReason.value = ''
  reportDetails.value = ''
  reportError.value = null
  reportSuccess.value = false
  showReportModal.value = true
}

// Close report modal
const closeReportModal = () => {
  showReportModal.value = false
}

// Submit report
const submitReport = async () => {
  if (!post.value) return
  
  if (!reportReason.value) {
    reportError.value = 'Please select a reason for reporting.'
    return
  }

  if (userRole.value === 'RESTRICTED') {
    alert('You are restricted from this action.')
    return
  }
  
  try {
    isReportSubmitting.value = true
    reportError.value = null
    
    console.log(`Submitting report for post ${post.value.id} with reason: ${reportReason.value}`)
    
    const result = await createReport({
      post_id: post.value.id,
      reason: reportReason.value,
      details: reportDetails.value || undefined
    })
    
    console.log('Report submitted successfully:', result)
    reportSuccess.value = true
    userHasReported.value = true
    
    // Auto-close modal after success
    setTimeout(() => {
      closeReportModal()
      // Force verification of report status
      if (post.value) {
        console.log('Verifying report status after submission')
        checkReportStatus(post.value.id)
      }
    }, 2000)
  } catch (err) {
    console.error('Error submitting report:', err)
    reportError.value = err instanceof Error ? err.message : 'Failed to submit report'
  } finally {
    isReportSubmitting.value = false
  }
}

// const initMap = async () => {
//   if (!post.value?.latitude || !post.value?.longitude) return
  
//   mapLoading.value = true
//   mapError.value = null

//   try {
//     if (!apiKey) {
//       throw new Error('Google Maps API key not configured')
//     }

//     mapLoader.value = new Loader({
//       apiKey,
//       version: "weekly",
//       libraries: ["places"]
//     })

//     await mapLoader.value.load()

//     if (mapContainer.value) {
//       map.value = new google.maps.Map(mapContainer.value, {
//         center: { 
//           lat: post.value.latitude, 
//           lng: post.value.longitude 
//         },
//         zoom: 15,
//         mapTypeControl: true,
//         streetViewControl: false,
//         fullscreenControl: false
//       })

//       // 添加标记
//       new google.maps.Marker({
//         position: { 
//           lat: post.value.latitude, 
//           lng: post.value.longitude 
//         },
//         map: map.value,
//         title: "Post Location"
//       })
//     }
//   } catch (error) {
//     console.error('Error loading Google Maps:', error)
//     mapError.value = 'Failed to load map. ' + (error instanceof Error ? error.message : 'Please try again later.')
//   } finally {
//     mapLoading.value = false
//   }
// }

// // 清理地图资源
// const cleanupMap = () => {
//   if (map.value) {
//     google.maps.event.clearInstanceListeners(map.value)
//     map.value = null
//   }
//   if (mapLoader.value) {
//     mapLoader.value = null
//   }
// }

// Define component name for keep-alive
defineOptions({
  name: 'PostDetailView'
})

onMounted(async () => {
  console.log('PostDetailView mounted')
  await loadPost()
  
  // Add check for report status
  if (post.value) {
    checkReportStatus(post.value.id)
  }

  // if (post.value?.latitude && post.value?.longitude) {
  //   initMap()
  // }
})

// onBeforeUnmount(() => {
//   cleanupMap()
// })

// Add onActivated hook to refresh data when navigating back to this view
onActivated(async () => {
  console.log('PostDetailView activated')
  
  // Check if the route params have changed
  const postId = parseInt(route.params.id as string)
  if (!isNaN(postId) && currentPostId.value !== postId) {
    console.log('Post ID changed, reloading post')
    isPostLoaded.value = false // Force a full reload for a different post
    await loadPost()
    return
  }
  
  // If the post exists, refresh comments and reactions
  if (post.value) {
    console.log('Refreshing comments and reactions')
    // Reload comments and reactions in parallel for better performance
    await Promise.all([
      loadComments(post.value.id),
      loadReactions(post.value.id),
      checkReportStatus(post.value.id)
    ])
  } else {
    // Fallback in case post somehow doesn't exist
    console.log('Post not loaded, loading post')
    await loadPost()
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-health-primary"></div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-xl text-red-500 mb-4">{{ error }}</p>
      <button @click="goBack" class="btn bg-health-primary text-white px-4 py-2 rounded-md">
        Back to Posts
      </button>

    </div>
    <!-- Post content -->
    <div v-else-if="post" class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Post header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <button @click="goBack" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div v-if="isAuthor" class="text-sm text-gray-500">
            <span class="px-2 py-1 bg-gray-100 rounded-full">Your Post</span>
          </div>
        </div>
        
        <!-- Add post title -->
        <h1 class="text-2xl font-bold text-gray-900 mb-4">{{ postTitle }}</h1>
        
        <div class="flex items-center text-sm text-gray-500 mb-4">
          <span class="font-medium mr-2">Posted on</span>
          <span>{{ formatDate(post.created_at) }}</span>
        </div>
        
        <div class="flex flex-wrap gap-2 mb-4">
          <span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
            {{ categoryName || 'Uncategorized' }}
          </span>
          <span v-if="post.longitude && post.latitude" class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            📍 Location: {{ post.latitude.toFixed(4) }}, {{ post.longitude.toFixed(4) }}
          </span>
        </div>
      </div>
      
      <!-- Post content -->
      <div class="p-6 border-b border-gray-200">
        <div class="prose max-w-none">
          <p class="whitespace-pre-line">{{ post.content }}</p>
        </div>
      </div>
      
      <!-- Post actions (likes/dislikes) -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center gap-4">
          <button 
            class="flex items-center gap-1 px-3 py-2 rounded-lg transition-colors"
            :class="[
              userHasLiked 
                ? 'bg-pink-100 text-pink-600 border border-pink-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent hover:border-gray-300'
            ]"
            @click="handleLikeClick"
            :disabled="isLikeLoading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="{ 'fill-pink-600': userHasLiked, 'fill-none': !userHasLiked, 'animate-pulse': isLikeLoading }" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span class="font-medium">{{ likeCount }} {{ likeCount === 1 ? 'Like' : 'Likes' }}</span>
          </button>
          
          <button 
            class="flex items-center gap-1 px-3 py-2 rounded-lg transition-colors"
            :class="[
              userHasDisliked 
                ? 'bg-blue-100 text-blue-600 border border-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent hover:border-gray-300'
            ]"
            @click="handleDislikeClick"
            :disabled="isDislikeLoading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="{ 'fill-blue-600': userHasDisliked, 'fill-none': !userHasDisliked, 'animate-pulse': isDislikeLoading }" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            <span class="font-medium">{{ dislikeCount }} {{ dislikeCount === 1 ? 'Dislike' : 'Dislikes' }}</span>
          </button>
          <div class="flex items-center gap-1 px-3 py-2 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span class="font-medium">{{ comments.length }} {{ comments.length === 1 ? 'Comment' : 'Comments' }}</span>
          </div>
        </div>
      </div>
      
      <MapPost :post="post" />

      
      <!-- Comments section -->
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">Comments</h3>
          
          <!-- Refresh comments button -->
          <button 
            @click="loadComments(post.id)" 
            title="Refresh comments"
            class="text-sm bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        <!-- New comment form -->
        <div v-if="showCommentForm" class="mb-6">
          <form @submit.prevent="submitComment">
            <div class="flex flex-col gap-2">
              <textarea
                v-model="newComment"
                placeholder="Add a comment..."
                rows="3"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
                required
              ></textarea>
              <div class="flex justify-end">
                <button
                  type="submit"
                  class="bg-health-primary text-white px-4 py-2 rounded-md hover:bg-health-primary/90 transition-colors"
                  :disabled="isCommentLoading"
                >
                  <span v-if="isCommentLoading">Posting...</span>
                  <span v-else>Post Comment</span>
                </button>
              </div>
            </div>
          </form>
        </div>
        
        <div v-else class="mb-6 p-4 bg-blue-50 rounded-md text-blue-700">
          <p>Please <RouterLink to="/login" class="font-medium underline">sign in</RouterLink> to comment on this post.</p>
        </div>
        
        <!-- Comments list -->
        <div v-if="comments.length > 0" class="space-y-6">
          <div 
            v-for="comment in comments" 
            :key="comment.id" 
            class="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0"
          >
            <div class="flex justify-between items-start mb-2">
              <div class="font-medium text-gray-900">
                <template v-if="userProfiles[comment.user_id]">
                  {{ userProfiles[comment.user_id].name }}
                </template>
                <template v-else>
                  <span class="text-gray-400 animate-pulse">Loading...</span>
                </template>
              </div>
              <div class="text-xs text-gray-500" :title="formatDate(comment.created_at)">
                {{ formatRelativeTime(comment.created_at) }}
              </div>
            </div>
            
            <p class="text-gray-700 whitespace-pre-line mb-3" v-html="formatCommentText(comment.content)"></p>
            
            <!-- Comment actions -->
            <div class="flex items-center gap-3 mt-2">
              <button 
                class="flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors"
                :class="[
                  comment.userReaction === 'LIKE' 
                    ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent'
                ]"
                @click="handleCommentReaction(comment.id, 'LIKE')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'fill-blue-600': comment.userReaction === 'LIKE', 'fill-none': comment.userReaction !== 'LIKE' }" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>{{ comment.likesCount || 0 }}</span>
              </button>
              
              <button 
                class="flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors"
                :class="[
                  comment.userReaction === 'DISLIKE' 
                    ? 'bg-red-50 text-red-600 border border-red-100' 
                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent'
                ]"
                @click="handleCommentReaction(comment.id, 'DISLIKE')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{ 'fill-red-600': comment.userReaction === 'DISLIKE', 'fill-none': comment.userReaction !== 'DISLIKE' }" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
                <span>{{ comment.dislikesCount || 0 }}</span>
              </button>
              
              <button
                v-if="replyingToComment !== comment.id && isAuthenticated"
                @click="startReply(comment.id)"
                class="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md text-sm transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Reply
              </button>
            </div>
            
            <!-- Comment Reply Form -->
            <div v-if="replyingToComment === comment.id" class="mt-4 ml-6 border-l-2 border-gray-200 pl-4">
              <form @submit.prevent="submitReply(comment.id)">
                <div class="flex flex-col gap-2">
                  <textarea
                    v-model="replyContent"
                    placeholder="Write your reply..."
                    rows="2"
                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20 text-sm"
                    required
                  ></textarea>
                  <div class="flex justify-end space-x-2">
                    <button
                      type="button"
                      @click="cancelReply"
                      class="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      class="bg-health-primary text-white px-3 py-1 rounded-md hover:bg-health-primary/90 transition-colors text-sm"
                      :disabled="isReplyLoading"
                    >
                      <span v-if="isReplyLoading">Posting...</span>
                      <span v-else>Post Reply</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
            
            <!-- Comment Replies -->
            <div v-if="comment.replies && comment.replies.length > 0" class="mt-4 ml-6 space-y-4">
              <div 
                v-for="reply in comment.replies" 
                :key="reply.id" 
                class="border-l-2 border-gray-200 pl-4 py-2"
              >
                <div class="flex justify-between items-start mb-1">
                  <div class="font-medium text-gray-900 text-sm">
                    <template v-if="userProfiles[reply.user_id]">
                    {{ userProfiles[reply.user_id].name }}
                    <span v-if="reply.parent_user_id" class="text-xs text-gray-500">
                      replying to {{ userProfiles[reply.parent_user_id]?.name || 'User' }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="text-gray-400 animate-pulse">Loading...</span>
                  </template>
                  </div>
                  <div class="text-xs text-gray-500" :title="formatDate(reply.created_at)">
                    {{ formatRelativeTime(reply.created_at) }}
                  </div>
                </div>
                
                <p class="text-gray-700 whitespace-pre-line mb-2 text-sm" v-html="formatCommentText(reply.content)"></p>
                
                <!-- Reply actions -->
                <div class="flex items-center gap-3">
                  <button 
                    class="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
                    :class="[
                      reply.userReaction === 'LIKE' 
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent'
                    ]"
                    @click="handleCommentReaction(reply.id, 'LIKE')"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" :class="{ 'fill-blue-600': reply.userReaction === 'LIKE', 'fill-none': reply.userReaction !== 'LIKE' }" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span>{{ reply.likesCount || 0 }}</span>
                  </button>
                  
                  <button 
                    class="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
                    :class="[
                      reply.userReaction === 'DISLIKE' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent'
                    ]"
                    @click="handleCommentReaction(reply.id, 'DISLIKE')"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" :class="{ 'fill-red-600': reply.userReaction === 'DISLIKE', 'fill-none': reply.userReaction !== 'DISLIKE' }" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                    <span>{{ reply.dislikesCount || 0 }}</span>
                  </button>
                  
                  <!-- Add reply to reply button -->
                  <button
                    v-if="replyingToReply !== reply.id && isAuthenticated"
                    @click="startReplyToReply(reply.id)"
                    class="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md text-xs transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Reply
                  </button>
                </div>
                
                <!-- Reply to Reply Form -->
                <div v-if="replyingToReply === reply.id" class="mt-3 border-l-2 border-gray-100 pl-3">
                  <form @submit.prevent="submitReply(reply.id)">
                    <div class="flex flex-col gap-2">
                      <textarea
                        v-model="replyContent"
                        placeholder="Write your reply..."
                        rows="2"
                        class="w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20 text-xs"
                        required
                      ></textarea>
                      <div class="flex justify-end space-x-2">
                        <button
                          type="button"
                          @click="cancelReply"
                          class="px-2 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          class="bg-health-primary text-white px-2 py-1 rounded-md hover:bg-health-primary/90 transition-colors text-xs"
                          :disabled="isReplyLoading"
                        >
                          <span v-if="isReplyLoading">Posting...</span>
                          <span v-else>Post Reply</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-6 text-gray-500">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      </div>
      
      <!-- Post actions -->
      <div class="p-6 flex justify-between bg-gray-50">
        <button
          @click="goBack"
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
        >
          Back to Posts
        </button>
              
        <!-- 删除按钮仅在有权限时显示 -->

        <div v-if="isPrivileged">
          <button
            @click="handleDeletePost"
            class="btn bg-health-primary text-white px-4 py-2 rounded-md"
          >
            Delete Post
          </button>
        </div>
      </div>
    </div>
    
    <!-- Report Modal -->
    <div v-if="showReportModal" class="modal-overlay">
      <div class="modal-content report-modal">
        <h2>Report Post</h2>
        
        <div v-if="reportSuccess" class="success-message">
          Report submitted successfully!
        </div>
        
        <template v-else>
          <p>Please select a reason for reporting this post:</p>
          
          <div class="report-form">
            <div class="form-group">
              <select v-model="reportReason" class="form-control">
                <option value="">-- Select a reason --</option>
                <option value="SPAM">Spam</option>
                <option value="OFFENSIVE">Offensive content</option>
                <option value="HARASSMENT">Harassment</option>
                <option value="MISLEADING">False or misleading information</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Additional details (optional):</label>
              <textarea 
                v-model="reportDetails" 
                class="form-control" 
                rows="3" 
                placeholder="Please provide any additional information that might help us understand the issue."
              ></textarea>
            </div>
            
            <div v-if="reportError" class="error-message">
              {{ reportError }}
            </div>
            
            <div class="form-actions">
              <button 
                @click="submitReport" 
                class="btn-primary" 
                :disabled="isReportSubmitting"
              >
                {{ isReportSubmitting ? 'Submitting...' : 'Submit Report' }}
              </button>
              <button @click="closeReportModal" class="btn-secondary">Cancel</button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-md transition-colors;
}

/* Enhanced animation for reactions */
button svg {
  transition: transform 0.2s ease, fill 0.2s ease;
}

button:hover:not(:disabled) svg {
  transform: scale(1.2);
}

/* Add pulse animation for the loading state */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
  padding: 0.5rem 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.reaction-buttons {
  display: flex;
  gap: 0.5rem;
}

.post-options {
  display: flex;
  align-items: center;
}

.report-button {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  color: #555;
}

.report-button:hover {
  background-color: #f5f5f5;
  color: #e74c3c;
}

.reported-badge {
  font-size: 0.9rem;
  color: #7f8c8d;
  padding: 0.3rem 0.7rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.report-modal h2 {
  margin-top: 0;
  color: #2c3e50;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-control {
  padding: 0.7rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.7rem 1.2rem;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #ecf0f1;
  color: #2c3e50;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.7rem 1.2rem;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background-color: #dfe6e9;
}

.success-message {
  padding: 1rem;
  background-color: #d4edda;
  color: #155724;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.error-message {
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.map-container {
  min-height: 384px; /* h-96 */
  background-color: #f3f4f6;
  border-radius: 0.5rem;
  overflow: hidden;
  position: relative;
}

/* Style for @mentions in comments */
.mention {
  color: #3498db;
  font-weight: 600;
  background-color: rgba(52, 152, 219, 0.1);
  padding: 0.15rem 0.3rem;
  border-radius: 0.25rem;
}
</style> 