# Setting Up Cloudflare Workers for Image Optimization

This guide will walk you through setting up a Cloudflare Worker to optimize and cache images for the ReHome marketplace, which can dramatically improve loading times.

## Prerequisites

1. A Cloudflare account
2. Your website added to Cloudflare (with DNS properly configured)
3. Node.js and npm installed on your development machine

## Step 1: Install Wrangler CLI

Wrangler is Cloudflare's CLI tool for managing Workers.

```bash
npm install -g wrangler
```

## Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

## Step 3: Configure Your Worker

1. Navigate to the workers directory:

```bash
cd Rehome/workers
```

2. Edit the `wrangler.toml` file:
   - Replace `rehome.com` with your actual domain
   - Add your Cloudflare Zone ID (found in your Cloudflare dashboard)

## Step 4: Deploy the Worker

```bash
wrangler publish
```

This will deploy your worker to Cloudflare's global network.

## Step 5: Configure Routes in Cloudflare Dashboard

1. Go to your Cloudflare dashboard
2. Select your website
3. Go to Workers Routes
4. Add a route:
   - Route: `*yourdomain.com/image-proxy*`
   - Worker: `rehome-image-proxy`

## Step 6: Test the Worker

After deployment, test the worker by accessing:

```
https://your-domain.com/image-proxy?url=https://your-supabase-image-url.jpg&quality=85&width=800
```

Replace `your-domain.com` with your actual domain and `your-supabase-image-url.jpg` with an actual image URL from your Supabase storage.

## Step 7: Monitor Performance

1. In your Cloudflare dashboard, go to the Workers section
2. Select your `rehome-image-proxy` worker
3. Check the metrics tab to see:
   - Request volume
   - Cache hit rates
   - Error rates
   - Performance metrics

## Performance Expectations

Based on similar implementations, you can expect:
- ~80% reduction in image load times
- Improved Core Web Vitals scores (especially LCP and FID)
- Better user experience, especially on mobile devices

## How It Works

1. When a user visits your marketplace:
   - The `LazyImage` component detects Supabase image URLs
   - It routes these through your Cloudflare Worker

2. The Cloudflare Worker:
   - Checks if the image is in its cache
   - If cached, serves it immediately from the edge (very fast)
   - If not cached, fetches from Supabase, caches it, then serves it
   - Applies proper caching headers for browsers

3. On subsequent visits:
   - Images load almost instantly from Cloudflare's edge network
   - Your Supabase storage receives fewer requests
   - Users experience dramatically faster page loads

## Troubleshooting

### Images Not Loading

1. Check browser console for errors
2. Verify worker routes are correctly configured
3. Ensure Supabase storage is accessible from Cloudflare Workers

### High Error Rates

1. Check worker logs in Cloudflare dashboard
2. Verify your Supabase storage permissions
3. Check if image URLs are correctly encoded

### Need More Help?

For additional assistance, refer to:
- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI documentation](https://developers.cloudflare.com/workers/wrangler/) 