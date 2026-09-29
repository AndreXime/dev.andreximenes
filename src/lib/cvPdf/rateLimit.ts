interface Bucket {
	timestamps: number[];
}

const ipBuckets = new Map<string, Bucket>();
const globalBucket: Bucket = { timestamps: [] };

const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_MAX_REQUESTS = 8;
const GLOBAL_WINDOW_MS = 5 * 60 * 1000;
const GLOBAL_MAX_REQUESTS = 10;
const MAX_IP_KEYS = 2_000;

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	retryAfterSeconds: number;
	scope: "ip" | "global";
}

function pruneBucket(bucket: Bucket, now: number, windowMs: number): void {
	bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
}

function peekBucket(bucket: Bucket, now: number, windowMs: number, maxRequests: number): RateLimitResult {
	pruneBucket(bucket, now, windowMs);

	if (bucket.timestamps.length >= maxRequests) {
		const oldest = bucket.timestamps[0] ?? now;
		const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
		return { allowed: false, remaining: 0, retryAfterSeconds, scope: "ip" };
	}

	return {
		allowed: true,
		remaining: Math.max(0, maxRequests - bucket.timestamps.length - 1),
		retryAfterSeconds: 0,
		scope: "ip",
	};
}

function consumeBucket(bucket: Bucket, now: number): void {
	bucket.timestamps.push(now);
}

function evictIpBucketsIfNeeded(now: number): void {
	if (ipBuckets.size < MAX_IP_KEYS) return;
	for (const [key, bucket] of ipBuckets) {
		pruneBucket(bucket, now, IP_WINDOW_MS);
		if (bucket.timestamps.length === 0) ipBuckets.delete(key);
		if (ipBuckets.size < MAX_IP_KEYS) return;
	}
	const oldest = ipBuckets.keys().next().value;
	if (oldest !== undefined) ipBuckets.delete(oldest);
}

function getIpBucket(key: string): Bucket {
	let bucket = ipBuckets.get(key);
	if (!bucket) {
		bucket = { timestamps: [] };
		ipBuckets.set(key, bucket);
	}
	return bucket;
}

/** Limite por IP: 8 a cada 15 minutos (best-effort em memória). */
export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
	evictIpBucketsIfNeeded(now);
	const bucket = getIpBucket(key);
	const peek = peekBucket(bucket, now, IP_WINDOW_MS, IP_MAX_REQUESTS);
	if (!peek.allowed) return { ...peek, scope: "ip" };
	consumeBucket(bucket, now);
	return { ...peek, scope: "ip" };
}

/**
 * Consome o slot global e o do IP só se os dois ainda tiverem cota.
 * Global: 10 PDFs a cada 5 minutos na instância.
 */
export function consumePdfGenerationSlots(ip: string, now = Date.now()): RateLimitResult {
	evictIpBucketsIfNeeded(now);

	const globalPeek = peekBucket(globalBucket, now, GLOBAL_WINDOW_MS, GLOBAL_MAX_REQUESTS);
	if (!globalPeek.allowed) {
		return { ...globalPeek, scope: "global" };
	}

	const ipBucket = getIpBucket(ip);
	const ipPeek = peekBucket(ipBucket, now, IP_WINDOW_MS, IP_MAX_REQUESTS);
	if (!ipPeek.allowed) {
		return { ...ipPeek, scope: "ip" };
	}

	consumeBucket(globalBucket, now);
	consumeBucket(ipBucket, now);

	return {
		allowed: true,
		remaining: Math.min(globalPeek.remaining, ipPeek.remaining),
		retryAfterSeconds: 0,
		scope: "global",
	};
}

export function clientIpFromRequest(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}
	const realIp = request.headers.get("x-real-ip")?.trim();
	if (realIp) return realIp;
	return "unknown";
}
