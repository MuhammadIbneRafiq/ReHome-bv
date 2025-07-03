# How to Extend Token Expiration to 48 Hours in Supabase

## Method 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase Project Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project (`yhlenudckwewmejigxvl`)

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Go to "Settings" tab
   - Look for "JWT expiry limit"

3. **Update JWT Settings**
   - Find "JWT expiry limit" setting
   - Change from default (typically 3600 seconds = 1 hour) to `172800` seconds (48 hours)
   - Save the changes

## Method 2: Via Supabase CLI (Alternative)

If you have access to Supabase CLI and project configuration:

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref yhlenudckwewmejigxvl

# Update the auth configuration
# Create/edit supabase/config.toml and add:
[auth]
jwt_expiry = 172800  # 48 hours in seconds
```

## Method 3: Environment Variable Override (Backend)

In your backend code, you can also set custom JWT expiration when creating tokens:

```javascript
// In backend/server.js - update the JWT_EXPIRES_IN
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '48h';

// When creating JWT tokens
const token = jwt.sign(payload, JWT_SECRET, { 
  expiresIn: '48h' // 48 hours
});
```

## Verification

After making the changes, you can verify the token expiration by:

1. **Login to your app**
2. **Check browser console** - the useAuth hook will log token expiration time
3. **Decode the JWT token** at [jwt.io](https://jwt.io) and check the `exp` claim

## Important Notes

- **Security Consideration**: Longer token expiration means users stay logged in longer, but also means compromised tokens remain valid longer
- **User Experience**: 48-hour tokens reduce login friction for users
- **Refresh Tokens**: Consider implementing refresh token rotation for better security
- **Session Management**: The client-side code already handles token expiration warnings at 30 minutes, 1 hour, etc.

## Current Token Flow

1. User logs in → Receives JWT token with 48-hour expiration
2. Client stores token and monitors expiration
3. Warnings shown at 1 hour, 30 minutes, and 5 minutes before expiration
4. Auto-logout when token expires
5. User redirected to login with return URL

## Troubleshooting

If changes don't take effect:
1. Clear browser localStorage/cookies
2. Sign out and sign in again
3. Check Supabase dashboard for any validation errors
4. Verify environment variables are properly set 