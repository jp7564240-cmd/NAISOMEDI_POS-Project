const nextConfig = { output: process.env.NEXT_STATIC_EXPORT === '1' ? 'export' : undefined, images: { unoptimized: true } };
export default nextConfig;
