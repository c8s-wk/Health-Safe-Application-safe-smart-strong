import { ref } from 'vue'

export interface Post {
  id: number
  userId: number
  username: string
  title: string
  content: string
  imageUrl?: string
  category: string
  tags: string[]
  likes: number
  likedBy: number[]
  comments: Comment[]
  createdAt: string
  reported: boolean
  reportReason?: string
}

export interface Comment {
  id: number
  userId: number
  username: string
  content: string
  createdAt: string
  likes: number
  likedBy: number[]
}

// Store posts in localStorage to persist between sessions
const STORAGE_KEY = 'health_portal_posts'

// In-memory posts storage with reactive ref
const posts = ref<Post[]>([])

// Load posts from localStorage
const loadSavedPosts = (): void => {
  try {
    const savedPosts = localStorage.getItem(STORAGE_KEY)
    if (savedPosts) {
      posts.value = JSON.parse(savedPosts)
    }
  } catch (error) {
    console.error('Error loading posts from localStorage:', error)
    // Initialize with empty array if loading fails
    posts.value = []
  }
}

// Save posts to localStorage
const savePosts = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts.value))
  } catch (error) {
    console.error('Error saving posts to localStorage:', error)
  }
}

// Initialize posts if empty
const initializeSamplePosts = (): void => {
  if (posts.value.length === 0) {
    const samplePosts: Post[] = [
      {
        id: 1,
        userId: 1,
        username: 'health_expert',
        title: 'Tips for Staying Healthy During Flu Season',
        content: 'As flu season approaches, it\'s important to take precautions to protect yourself and your loved ones. Here are some tips:\n\n1. Get your annual flu shot\n2. Wash your hands frequently\n3. Avoid close contact with sick people\n4. Stay home if you\'re feeling ill\n5. Keep your immune system strong with a healthy diet\n\nStay safe everyone!',
        category: 'Wellness',
        tags: ['flu', 'prevention', 'health'],
        likes: 15,
        likedBy: [2, 3, 4],
        comments: [
          {
            id: 1,
            userId: 2,
            username: 'wellness_guru',
            content: 'Great tips! I would also recommend taking vitamin C supplements.',
            createdAt: '2023-09-15T10:30:00Z',
            likes: 3,
            likedBy: [1, 3]
          }
        ],
        createdAt: '2023-09-15T08:00:00Z',
        reported: false
      },
      {
        id: 2,
        userId: 3,
        username: 'doctor_jen',
        title: 'Understanding Air Quality Indexes',
        content: 'With increasing concerns about air pollution, it\'s essential to understand what air quality indexes mean for your health.\n\nHere\'s a simple breakdown:\n\n- Good (0-50): Air quality is satisfactory\n- Moderate (51-100): Some pollutants may affect sensitive individuals\n- Unhealthy for Sensitive Groups (101-150): Members of sensitive groups may experience health effects\n- Unhealthy (151-200): Everyone may begin to experience health effects\n- Very Unhealthy (201-300): Health warnings of emergency conditions\n- Hazardous (301+): Health alert - everyone may experience serious health effects\n\nAlways check your local air quality before outdoor activities!',
        imageUrl: 'https://placehold.co/600x400/png?text=Air+Quality+Chart',
        category: 'Environment',
        tags: ['air quality', 'health', 'pollution'],
        likes: 27,
        likedBy: [1, 2, 4, 5],
        comments: [
          {
            id: 2,
            userId: 1,
            username: 'health_expert',
            content: 'Thank you for this clear explanation. It\'s so important to monitor air quality these days.',
            createdAt: '2023-09-16T14:25:00Z',
            likes: 5,
            likedBy: [3, 5]
          },
          {
            id: 3,
            userId: 4,
            username: 'eco_warrior',
            content: 'I use the AirNow app to check air quality daily. Highly recommend it!',
            createdAt: '2023-09-16T16:45:00Z',
            likes: 2,
            likedBy: [3]
          }
        ],
        createdAt: '2023-09-16T11:15:00Z',
        reported: false
      },
      {
        id: 3,
        userId: 2,
        username: 'wellness_guru',
        title: 'Benefits of Regular Exercise',
        content: 'Exercise isn\'t just about weight management - it offers countless health benefits!\n\nRegular physical activity can:\n\n- Improve cardiovascular health\n- Strengthen muscles and bones\n- Boost mental health and mood\n- Increase energy levels\n- Enhance sleep quality\n- Reduce risk of chronic diseases\n\nAim for at least 150 minutes of moderate activity each week. Your body will thank you!',
        category: 'Fitness',
        tags: ['exercise', 'health', 'fitness'],
        likes: 42,
        likedBy: [1, 3, 5],
        comments: [],
        createdAt: '2023-09-17T09:20:00Z',
        reported: false
      }
    ]
    
    posts.value = samplePosts
    savePosts()
  }
}

// Get all posts
export const getAllPosts = (): Post[] => {
  loadSavedPosts()
  initializeSamplePosts()
  return posts.value
}

// Get a specific post by ID
export const getPostById = (id: number): Post | undefined => {
  loadSavedPosts()
  initializeSamplePosts()
  return posts.value.find(post => post.id === id)
}

// Add a new post
export const createPost = (post: Omit<Post, 'id' | 'likes' | 'likedBy' | 'comments' | 'createdAt' | 'reported'>): Post => {
  loadSavedPosts()
  
  const newPost: Post = {
    ...post,
    id: Date.now(),
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: new Date().toISOString(),
    reported: false
  }
  
  posts.value.unshift(newPost)
  savePosts()
  return newPost
}

// Toggle like on a post
export const toggleLikePost = (postId: number, userId: number): Post | undefined => {
  loadSavedPosts()
  
  const postIndex = posts.value.findIndex(p => p.id === postId)
  if (postIndex === -1) return undefined
  
  const post = { ...posts.value[postIndex] } // Create a copy of the post object
  const userLikedIndex = post.likedBy.indexOf(userId)
  
  if (userLikedIndex === -1) {
    // User hasn't liked the post yet
    post.likes++
    post.likedBy = [...post.likedBy, userId] // Create a new array
  } else {
    // User already liked the post, so unlike it
    post.likes--
    post.likedBy = post.likedBy.filter(id => id !== userId) // Create a new array
  }
  
  // Update the post in the array
  posts.value = [
    ...posts.value.slice(0, postIndex),
    post,
    ...posts.value.slice(postIndex + 1)
  ]
  
  savePosts()
  return post
}

// Add a comment to a post
export const addComment = (
  postId: number, 
  comment: Omit<Comment, 'id' | 'likes' | 'likedBy' | 'createdAt'>
): Post | undefined => {
  loadSavedPosts()
  
  const postIndex = posts.value.findIndex(p => p.id === postId)
  if (postIndex === -1) return undefined
  
  const newComment: Comment = {
    ...comment,
    id: Date.now(),
    likes: 0,
    likedBy: [],
    createdAt: new Date().toISOString()
  }
  
  posts.value[postIndex].comments.push(newComment)
  savePosts()
  return posts.value[postIndex]
}

// Toggle like on a comment
export const toggleLikeComment = (
  postId: number, 
  commentId: number, 
  userId: number
): Post | undefined => {
  loadSavedPosts()
  
  const postIndex = posts.value.findIndex(p => p.id === postId)
  if (postIndex === -1) return undefined
  
  // Create a deep copy of the post
  const post = JSON.parse(JSON.stringify(posts.value[postIndex])) as Post
  
  const commentIndex = post.comments.findIndex(c => c.id === commentId)
  if (commentIndex === -1) return undefined
  
  const comment = post.comments[commentIndex]
  const userLikedIndex = comment.likedBy.indexOf(userId)
  
  if (userLikedIndex === -1) {
    // User hasn't liked the comment yet
    comment.likes++
    comment.likedBy.push(userId)
  } else {
    // User already liked the comment, so unlike it
    comment.likes--
    comment.likedBy = comment.likedBy.filter(id => id !== userId)
  }
  
  // Update the post in the array
  posts.value = [
    ...posts.value.slice(0, postIndex),
    post,
    ...posts.value.slice(postIndex + 1)
  ]
  
  savePosts()
  return post
}

// Report a post
export const reportPost = (postId: number, reason: string): Post | undefined => {
  loadSavedPosts()
  
  const postIndex = posts.value.findIndex(p => p.id === postId)
  if (postIndex === -1) return undefined
  
  posts.value[postIndex].reported = true
  posts.value[postIndex].reportReason = reason
  savePosts()
  return posts.value[postIndex]
}

// Reset to sample data (for demo/testing)
export const resetToSamplePosts = (): void => {
  localStorage.removeItem(STORAGE_KEY)
  posts.value = []
  initializeSamplePosts()
}

// Initialize posts when the service is first imported
loadSavedPosts()
initializeSamplePosts() 