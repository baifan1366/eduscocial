import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  const { postId } = await req.json();
  await redis.incr(`post:${postId}:views`);
  return Response.json({ success: true });
}
