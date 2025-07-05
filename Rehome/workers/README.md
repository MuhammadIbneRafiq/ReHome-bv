# ReHome Image Optimization with Cloudflare Workers

This directory contains a Cloudflare Worker that optimizes and caches images from your Supabase storage, significantly improving load times for your marketplace images.

## Benefits

- **Edge Caching**: Images are cached at Cloudflare's global edge locations, reducing latency
- **Reduced Origin Load**: Fewer requests hit your Supabase storage
- **Improved Performance**: Users experience faster page loads (~80% faster in some cases)
- **Bandwidth Savings**: Reduced data transfer from your origin servers

## Setup Instructions

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Configure wrangler.toml

Edit the `wrangler.toml` file in this directory:

1. Replace `rehome.com` with your actual domain
2. Add your Cloudflare Zone ID (found in your Cloudflare dashboard)

### 4. Deploy the Worker

```bash
cd workers
wrangler publish
```

### 5. Test the Worker

After deployment, you can test the worker with:

```
https://your-domain.com/image-proxy?url=https://your-supabase-image-url.jpg&quality=85&width=800
```

## Usage

The worker is already integrated with the `LazyImage` component. It will automatically:

1. Detect Supabase image URLs
2. Route them through the Cloudflare Worker
3. Apply caching and optimization

## Parameters

The worker accepts the following URL parameters:

- `url` (required): The original Supabase image URL (URL-encoded)
- `quality` (optional): JPEG quality from 1-100 (default: 85)
- `width` (optional): Desired image width in pixels

## Monitoring

You can monitor the worker's performance in your Cloudflare dashboard under the Workers section.

## Troubleshooting

- If images fail to load, check your browser console for errors
- Verify that the worker routes are correctly configured in Cloudflare
- Ensure your Supabase storage is accessible from Cloudflare Workers

## Performance Impact

Based on similar implementations, you can expect:
- ~80% reduction in image load times
- Improved Core Web Vitals scores
- Better user experience, especially on mobile devices 