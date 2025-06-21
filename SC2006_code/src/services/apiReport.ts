// apiReport.ts
import { useUserStore } from '../stores/userStore.ts';// Assuming you have a user store for authentication
import supabase from '../supabase.ts';// Assuming you have your Supabase client initialized here

export interface Report {
  id: number;
  created_at: string; 
  user_id: string; 
  post_id: number;
  reason: string; 
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "REJECTED";
  details?: string;
}

export interface CreateReport {
  post_id: number;
  reason: string;
  details?: string;
}

const tableName = 'report'; // Name of your Supabase table for reports

/**
 * Creates a new report for a post or comment
 * @param createReport Report details
 * @returns The created report
 */ 
export async function createReport(createReport: CreateReport): Promise<Report> {
  console.log(`Creating report for post ${createReport.post_id}`);
  
  const userStore = useUserStore();
  if (!userStore.user) {
    console.error('User not logged in when creating report');
    throw new Error('User must be logged in to report posts');
  }
  
  // First check if this user has already reported this post
  try {
    console.log(`Checking if user ${userStore.user.id} has already reported post ${createReport.post_id}`);
    
    // Direct query with RPC to bypass RLS
    const { data: functionData, error: functionError } = await supabase.rpc('check_user_report', {
      p_user_id: userStore.user.id,
      p_post_id: createReport.post_id
    });
    
    if (functionError) {
      console.error('Error checking existing report with RPC:', functionError);
    } else if (functionData && functionData > 0) {
      console.log('User has already reported this post (verified by RPC)');
      throw new Error('You have already reported this post');
    }
  } catch (checkError) {
    // If the error is about already having reported, rethrow it
    if (checkError instanceof Error && 
        checkError.message.includes('already reported')) {
      throw checkError;
    }
    // Otherwise continue to attempt report creation
    console.warn('Error during pre-check:', checkError);
  }
  
  // Prepare the report data
  const reportWithUserId = {
    ...createReport,
    user_id: userStore.user.id,
    status: "PENDING"
  };
  
  // First try regular insertion
  try {
    const { data, error } = await supabase
      .from(tableName)
      .insert(reportWithUserId)
      .select()
      .single();
      
    if (error) {
      console.error('Error with standard insert:', error);
      // Continue to fallback approach
    } else if (data) {
      console.log('Report created successfully (standard approach):', data);
      // Store a local record to handle RLS read restrictions
      storeReportedPost(createReport.post_id);
      return data;
    }
  } catch (err) {
    console.warn('Exception during standard insert attempt:', err);
    // Continue to fallback approach
  }
  
  // Fallback: Try RPC call to insert report
  try {
    console.log('Trying fallback RPC approach...');
    
    // Call a stored procedure to insert the report
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_report', {
      p_post_id: createReport.post_id,
      p_reason: createReport.reason,
      p_details: createReport.details || '',
      p_user_id: userStore.user.id
    });
    
    if (rpcError) {
      console.error('Error with RPC insert:', rpcError);
      throw new Error('Failed to submit report: ' + rpcError.message);
    }
    
    // If RPC returns a success flag or report ID
    if (rpcData) {
      console.log('Report created successfully via RPC:', rpcData);
      
      // Store a local record to handle RLS read restrictions
      storeReportedPost(createReport.post_id);
      
      // Return a constructed report object
      return {
        id: typeof rpcData === 'number' ? rpcData : -1,
        created_at: new Date().toISOString(),
        user_id: userStore.user.id,
        post_id: createReport.post_id,
        reason: createReport.reason,
        status: "PENDING",
        details: createReport.details
      };
    }
  } catch (rpcErr) {
    console.error('Exception during RPC attempt:', rpcErr);
  }
  
  // Final fallback: Try direct insert without returning data
  try {
    console.log('Trying final fallback with direct insert...');
    
    const { error: insertError } = await supabase
      .from(tableName)
      .insert(reportWithUserId);
    
    if (insertError) {
      console.error('Error with direct insert:', insertError);
      throw new Error('Failed to submit report: ' + insertError.message);
    }
    
    // If we get here, the insert likely succeeded
    console.log('Report likely created successfully via direct insert');
    
    // Store a local record to handle RLS read restrictions
    storeReportedPost(createReport.post_id);
    
    // Return a constructed report object
    return {
      id: -1, // Placeholder ID
      created_at: new Date().toISOString(),
      user_id: userStore.user.id,
      post_id: createReport.post_id,
      reason: createReport.reason,
      status: "PENDING",
      details: createReport.details
    };
  } catch (insertErr) {
    console.error('Final exception during report creation:', insertErr);
    throw new Error('Failed to submit report. Please try again later.');
  }
}

// Local storage key for reported posts
const REPORTED_POSTS_KEY = 'health_portal_reported_posts';

/**
 * Store the post ID in local storage to remember it was reported
 * This is a workaround for RLS restrictions on reading data
 */
function storeReportedPost(postId: number): void {
  try {
    // Use simpler approach with direct localStorage access
    let reportedPosts: number[] = [];
    
    // Get existing data
    const existingData = localStorage.getItem(REPORTED_POSTS_KEY);
    if (existingData) {
      try {
        reportedPosts = JSON.parse(existingData);
        if (!Array.isArray(reportedPosts)) {
          reportedPosts = [];
        }
      } catch (parseErr) {
        console.error('Error parsing stored reports:', parseErr);
        reportedPosts = [];
      }
    }
    
    // Add new post ID if not already in the list
    if (!reportedPosts.includes(postId)) {
      reportedPosts.push(postId);
      localStorage.setItem(REPORTED_POSTS_KEY, JSON.stringify(reportedPosts));
      console.log(`Stored post ID ${postId} in local reported posts cache, now have ${reportedPosts.length} reported posts`);
    }
    
    // For debugging - show all reported posts
    console.log('Current reported posts in local storage:', reportedPosts);
  } catch (err) {
    console.error('Error storing reported post in local storage:', err);
  }
}

/**
 * Check if a post is reported based on local storage
 */
function isPostReportedInLocalStorage(postId: number): boolean {
  try {
    const existingData = localStorage.getItem(REPORTED_POSTS_KEY);
    if (existingData) {
      const reportedPosts = JSON.parse(existingData);
      if (Array.isArray(reportedPosts) && reportedPosts.includes(postId)) {
        console.log(`Found post ID ${postId} in local storage reported posts`);
        return true;
      }
    }
    return false;
  } catch (err) {
    console.warn('Error checking local storage for reported posts:', err);
    return false;
  }
}

/**
 * Check if the current user has reported a specific post
 * Uses both database check and local storage as fallback
 * @param postId ID of the post to check
 * @returns True if the user has already reported this post
 */
export async function hasReported(postId: number): Promise<boolean> {
  // FIRST check local storage - this is most reliable for frontend
  const isReportedLocally = isPostReportedInLocalStorage(postId);
  if (isReportedLocally) {
    console.log(`Post ${postId} found in local reported posts cache - skipping database check`);
    return true;
  }
  
  // Then try database check if available
  const userStore = useUserStore();
  if (!userStore.user) {
    console.log('User not logged in when checking report status - using only local storage');
    return isReportedLocally;
  }
  
  try {
    console.log(`Checking if user ${userStore.user.id} has reported post ${postId} (database)`);
    
    // Try to use an RPC call to bypass RLS if available
    try {
      const { data: functionData, error: functionError } = await supabase.rpc('check_user_report', {
        p_user_id: userStore.user.id,
        p_post_id: postId
      });
      
      if (!functionError && functionData !== null) {
        const hasReported = functionData > 0;
        console.log(`RPC report check result: ${hasReported ? 'User has reported' : 'User has not reported'}`);
        
        // If found in database but not in local storage, update local storage
        if (hasReported) {
          storeReportedPost(postId);
        }
        
        return hasReported;
      }
    } catch (rpcErr) {
      console.warn('RPC check failed, falling back to direct query:', rpcErr);
    }
    
    // Standard query as fallback
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userStore.user.id);
      
    if (error) {
      // If this is a RLS error, we'll rely on local storage
      if (error.message.includes('row-level security')) {
        console.warn('RLS error when checking report status - defaulting to local storage');
        return isReportedLocally;
      }
      
      console.error('Error checking report status:', error);
      return isReportedLocally;
    }
    
    const hasReported = data && data.length > 0;
    console.log(`Database report check result: ${hasReported ? 'User has reported' : 'User has not reported'}`);
    
    // If found in database but not in local storage, update local storage
    if (hasReported) {
      storeReportedPost(postId);
    }
    
    return hasReported;
  } catch (err) {
    console.error('Exception checking report status:', err);
    return isReportedLocally; // In case of error, use local storage result
  }
}

/**
 * Get reports for a specific post
 * @param postId ID of the post
 * @returns Array of reports for this post
 */
export async function getReportsForPost(postId: number): Promise<Report[]> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error getting reports for post:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (err) {
    console.error(`Exception getting reports for post ${postId}:`, err);
    throw err;
  }
}

/**
 * Get reports created by the current user
 * @returns Array of reports created by the current user
 */
export async function getMyReports(): Promise<Report[]> {
  const userStore = useUserStore();
  if (!userStore.user) {
    console.error('User not logged in when getting reports');
    throw new Error('User not logged in');
  }
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userStore.user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error getting user reports:', error);
      throw new Error(error.message);
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception getting user reports:', err);
    throw err;
  }
}

/**
 * Update report status (for moderators/admins)
 * @param reportId Report ID to update
 * @param status New status
 * @returns Updated report
 */
export async function updateReportStatus(reportId: number, status: "PENDING" | "REVIEWED" | "RESOLVED" | "REJECTED"): Promise<Report> {
  const userStore = useUserStore();
  if (!userStore.user) {
    console.error('User not logged in when updating report');
    throw new Error('User not logged in');
  }
  
  try {
    // TODO: Add role check here to ensure user is admin/moderator
    
    const { data, error } = await supabase
      .from(tableName)
      .update({ status })
      .eq('id', reportId)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating report status:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (err) {
    console.error(`Exception updating report ${reportId}:`, err);
    throw err;
  }
}

// Function to delete a report by its ID (Admin/Moderator only - enforced by Supabase RLS)
export const deleteReport = async (reportId: number) => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', reportId);

  if (error) {
    throw new Error(error.message);
  }
};

// Function to select all reports (Admin/Moderator only - enforced by Supabase RLS)
export const fetchAllReports = async (): Promise<Report[]> => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all reports:', error);
    return [];
  }

  return data || [];
};

// Function to select a single report by its ID (Admin/Moderator can view details - enforced by Supabase RLS)
export const fetchReportById = async (reportId: number): Promise<Report|null> => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error(`Error fetching report with ID ${reportId}:`, error);
    return null;
  }
  return data;
};

// Optional: Function to select reports by post ID (if needed - permissions handled by Supabase RLS)
export const fetchReportsByPostId = async (postId: number): Promise<Report[]> => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching reports for post ID ${postId}:`, error);
    return [];
  }

  return data || [];
};

// Optional: Function to select reports by user ID (if needed - permissions handled by Supabase RLS)
export const fetchReportsByUserId = async (userId: string): Promise<Report[]> => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching reports for user ID ${userId}:`, error);
    return [];
  }

  return data || [];
};