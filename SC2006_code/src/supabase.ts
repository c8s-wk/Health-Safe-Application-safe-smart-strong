// src/supabase.js
import { createClient } from '@supabase/supabase-js'
// const SUPABASE_URL = 'https://egqfitvrttttyjpnvhdw.supabase.co'
// const SUPABASE_KEY =
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncWZpdHZydHR0dHlqcG52aGR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwNzQ0MTYsImV4cCI6MjA1NDY1MDQxNn0.IsZeowwCG2kPYjf_deUBe4lzKhy-CYGTpndN5rU6LiA'
// 从环境变量中获取 Supabase 的 URL 和公钥
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

// 创建 Supabase 客户端实例
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
