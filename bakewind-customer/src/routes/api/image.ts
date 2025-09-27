import { APIEvent } from "@solidjs/start/server";
import sharp from "sharp";
import { HybridCache } from "~/lib/hybridCache";

// Use hybrid memory + filesystem cache (free alternative to Redis)
const cache = HybridCache.getInstance();

export async function GET({ request }: APIEvent) {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    
    // Extract parameters
    const imageUrl = params.url;
    const width = params.w ? parseInt(params.w) : undefined;
    const height = params.h ? parseInt(params.h) : undefined;
    const format = params.format as keyof sharp.FormatEnum || 'webp';
    const quality = params.q ? parseInt(params.q) : 80;
    
    // Validate required parameters
    if (!imageUrl) {
      return new Response('Missing image URL', { status: 400 });
    }
    
    // Generate cache key
    const cacheKey = `${imageUrl}-${width}-${height}-${format}-${quality}`;
    
    // Check cache first
    const cachedImage = await cache.get(cacheKey);
    if (cachedImage !== null) {
      // Convert Buffer to Uint8Array for web compatibility
      const uint8Array = new Uint8Array(cachedImage);
      return new Response(uint8Array, {
        headers: {
          'Content-Type': `image/${format}`,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': `"${cacheKey}"`,
          'Vary': 'Accept',
          'X-Cache': 'HIT'
        }
      });
    }
    
    // Fetch the original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return new Response('Failed to fetch image', { status: 500 });
    }
    
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    // Process the image with Sharp
    let sharpInstance = sharp(imageBuffer);
    
    // Get metadata for aspect ratio
    const metadata = await sharpInstance.metadata();
    
    // Resize if dimensions provided
    if (width || height) {
      sharpInstance = sharpInstance.resize({
        width,
        height,
        fit: 'cover',
        position: 'center'
      });
    }
    
    // Convert to requested format
    switch (format) {
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality, effort: 4 });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({ quality, effort: 4 });
        break;
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality, compressionLevel: 9 });
        break;
      default:
        // Default to webp if format is not recognized
        sharpInstance = sharpInstance.webp({ quality, effort: 4 });
    }
    
    // Process the image
    const processedImage = await sharpInstance.toBuffer();
    
    // Save to cache
    await cache.set(cacheKey, processedImage);
    
    // Return processed image
    // Convert Buffer to Uint8Array for web compatibility
    const uint8Array = new Uint8Array(processedImage);
    return new Response(uint8Array, {
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': `"${cacheKey}"`,
        'Vary': 'Accept',
        'X-Cache': 'MISS',
        'X-Original-Size': metadata.size?.toString() || '0',
        'X-Processed-Size': processedImage.length.toString()
      }
    });
    
  } catch (error) {
    console.error('Image processing error:', error);
    return new Response('Image processing failed', { status: 500 });
  }
}