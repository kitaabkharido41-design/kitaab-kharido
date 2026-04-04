---
Task ID: 1
Agent: Main Agent
Task: Fix admin dashboard not loading - bypass RLS dependency for admin auth

Work Log:
- Diagnosed root cause: Admin check was querying `profiles` table through Supabase anon key (subject to RLS), creating a chicken-and-egg problem where `is_admin` couldn't be read or set
- Rewrote `/api/admin/check/route.ts` to use pure email-based admin verification - no database query needed, just checks if logged-in user's email is in the hardcoded admin list
- Rewrote `/admin/admin-client.tsx` to simplified 2-step flow: check auth → check email → show dashboard or redirect
- Rewrote `/admin/login/page.tsx` to check admin email directly after login instead of querying profiles table
- Updated `AdminDashboard` component to accept optional `userName` prop and display it in sidebar

Stage Summary:
- Admin auth is now 100% email-based: if `kitaabkharido41@gmail.com` is logged in, admin access is granted immediately
- No dependency on `profiles.is_admin` field or any RLS policies
- Removed the `/api/admin/grant` call from the login flow (endpoint still exists but is unused)
- Lint passes clean, no errors
