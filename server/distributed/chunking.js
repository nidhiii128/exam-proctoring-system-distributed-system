// Simple, consistent chunking helper to map a userId to one of N chunks
// Falls back to a string hash when the last-two-characters are not numeric

function toChunkId(userId, numChunks = 5) {
	try {
		const tail = String(userId || '')
			.trim()
			.slice(-2);
		const numeric = Number.parseInt(tail, 10);
		if (Number.isFinite(numeric)) {
			return Math.abs(numeric) % numChunks;
		}
		// Fallback: simple deterministic hash
		let hash = 0;
		for (let i = 0; i < String(userId || '').length; i++) {
			hash = ((hash << 5) - hash) + String(userId)[i].charCodeAt(0);
			hash |= 0; // Convert to 32-bit int
		}
		return Math.abs(hash) % numChunks;
	} catch (e) {
		return 0;
	}
}

module.exports = { toChunkId };


