// /**
//  * Image Proxy and Optimization Worker for ReHome
//  * 
//  * This Cloudflare Worker:
//  * 1. Fetches images from Supabase storage
//  * 2. Applies caching with appropriate headers
//  * 3. Serves optimized images from Cloudflare's edge
//  */

// addEventListener('fetch', event => {
//   event.respondWith(handleRequest(event.request));
// });

// /**
//  * Cache configuration
//  */
// const CACHE_CONFIG = {
//   // Cache successful responses for 30 days
//   imageCache: {
//     browserTTL: 30 * 24 * 60 * 60,
//     edgeTTL: 30 * 24 * 60 * 60,
//     bypassCache: false,
//   },
//   // Cache errors for 5 minutes
//   errorCache: {
//     browserTTL: 5 * 60,
//     edgeTTL: 5 * 60,
//   }
// };

// /**
//  * Main request handler
//  */
// async function handleRequest(request) {
//   const url = new URL(request.url);
  
//   // Only process GET requests to /image-proxy
//   if (url.pathname !== '/image-proxy') {
//     return new Response('Not Found', { status: 404 });
//   }
  
//   // Get parameters from URL
//   const imageUrl = url.searchParams.get('url');
//   const quality = parseInt(url.searchParams.get('quality') || '85', 10);
//   const width = url.searchParams.get('width') ? parseInt(url.searchParams.get('width'), 10) : null;
  
//   // Validate required parameters
//   if (!imageUrl) {
//     return new Response('Missing URL parameter', { status: 400 });
//   }
  
//   try {
//     // Try to get the image from cache first
//     const cache = caches.default;
//     const cacheKey = new Request(request.url, request);
//     let response = await cache.match(cacheKey);
    
//     if (response) {
//       // Return the cached response
//       return response;
//     }
    
//     // If not in cache, fetch the original image
//     const imageResponse = await fetch(imageUrl);
    
//     // Handle errors from the origin
//     if (!imageResponse.ok) {
//       const errorResponse = new Response(`Error fetching image: ${imageResponse.statusText}`, {
//         status: imageResponse.status,
//         headers: {
//           'Content-Type': 'text/plain',
//           'Cache-Control': `public, max-age=${CACHE_CONFIG.errorCache.browserTTL}`,
//         }
//       });
      
//       // Cache error responses for a short time
//       await cache.put(cacheKey, errorResponse.clone());
//       return errorResponse;
//     }
    
//     // Get the image data
//     const imageData = await imageResponse.arrayBuffer();
    
//     // Create a new response with our cache headers
//     response = new Response(imageData, {
//       headers: {
//         'Content-Type': imageResponse.headers.get('Content-Type') || 'image/jpeg',
//         'Cache-Control': `public, max-age=${CACHE_CONFIG.imageCache.browserTTL}`,
//         'Access-Control-Allow-Origin': '*',
//         'CF-Cache-Status': 'MISS',
//         'X-Image-Proxy': 'ReHome-Cloudflare-Worker'
//       }
//     });
    
//     // Cache the response
//     await cache.put(cacheKey, response.clone());
    
//     return response;
//   } catch (error) {
//     // Handle any unexpected errors
//     return new Response(`Error processing image: ${error.message}`, {
//       status: 500,
//       headers: {
//         'Content-Type': 'text/plain',
//         'Cache-Control': `public, max-age=${CACHE_CONFIG.errorCache.browserTTL}`,
//       }
//     });
//   }
// } 