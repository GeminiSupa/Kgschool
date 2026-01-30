# User Account Security - Admin-Only Creation

## Overview
User account creation is **restricted to administrators only** for security reasons. This prevents unauthorized access to the kindergarten management system.

## ✅ Current Implementation

### 1. Public Signup Disabled
- **Location**: `/pages/signup.vue`
- **Status**: Replaced with informational page
- **Message**: Users are informed that only administrators can create accounts
- **Action**: Redirects to login page

### 2. Admin User Creation
- **Location**: `/pages/admin/users/new.vue`
- **Access**: Admin role required (protected by middleware)
- **API Endpoint**: `/api/admin/users/create.post.ts`
- **Security**: Uses Supabase service role key (bypasses RLS)
- **Features**:
  - Create users with email and password
  - Assign roles (admin, teacher, parent, kitchen, support)
  - Automatic profile creation
  - Email validation
  - Password requirements

### 3. Security Measures

#### Middleware Protection
- Admin pages require `role: 'admin'` in `definePageMeta`
- Role middleware verifies user role before access
- Unauthorized users are redirected to `/unauthorized`

#### API Security
- Uses Supabase service role key (server-side only)
- Validates all required fields
- Checks for duplicate emails
- Role validation
- Proper error handling

#### Database Security
- RLS (Row-Level Security) policies protect data
- Users can only access their own data
- Admins have elevated permissions via service role

## 🔒 Security Best Practices

1. **No Public Signup**: Prevents random users from accessing the system
2. **Admin-Only Creation**: Only trusted administrators can create accounts
3. **Role-Based Access**: Each user has a specific role with limited permissions
4. **Service Role Key**: User creation uses secure server-side API
5. **Email Validation**: Prevents duplicate accounts
6. **Password Requirements**: Enforced at creation time

## 📋 User Creation Workflow

1. **Admin logs in** → `/admin/users`
2. **Admin clicks "Create User"** → `/admin/users/new`
3. **Admin fills form**:
   - Full Name
   - Email
   - Password
   - Role (teacher, parent, kitchen, support)
   - Phone (optional)
4. **System creates account**:
   - Creates auth user in Supabase
   - Creates profile with role
   - Sends credentials to admin (or user)
5. **User receives credentials** and can log in

## 🚫 What Users Cannot Do

- ❌ Create their own accounts via signup page
- ❌ Access admin user creation page
- ❌ Modify their own role
- ❌ Access data outside their permissions

## ✅ What Admins Can Do

- ✅ Create user accounts
- ✅ Assign roles
- ✅ View all users
- ✅ Edit user information
- ✅ Manage user access

## 📝 Notes

- The signup page (`/signup`) now shows an informational message
- All user creation must go through admin interface
- This ensures only authorized personnel can access the system
- Protects sensitive kindergarten data from unauthorized access
