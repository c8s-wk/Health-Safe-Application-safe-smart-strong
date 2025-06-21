// Import the Supabase instance
import supabase from '../supabase.ts'
import { AuthResponse, AuthTokenResponsePassword, User, UserAttributes, UserResponse } from '@supabase/supabase-js';

export interface LoginResponse {
  user: any
  session: any
}

export async function register(email: string, password: string):Promise<User|null> {
  const { data, error }:AuthResponse = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data.user
}

export async function login(email: string, password: string):Promise<LoginResponse> {
  const { data, error }:AuthTokenResponsePassword = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    throw new Error(error.message)
  }
  return data
}

/**
 * Retrieve the current user's information.
 * @returns The user object if available, otherwise null.
 */
export async function retrieveUser():Promise<User|null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}


export async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) {
    throw new Error(error.message)
  }
}


export async function updateAuth(updates: UserAttributes):Promise<User> {
  const { data, error }:UserResponse = await supabase.auth.updateUser(updates)
  if (error) {
    throw new Error(error.message)
  }
  return data.user
}