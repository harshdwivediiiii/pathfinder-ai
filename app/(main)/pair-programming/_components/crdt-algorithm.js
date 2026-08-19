/**
 * Simulates a Conflict-free Replicated Data Type (CRDT) for real-time text synchronization.
 * In a real application, this would use a library like Yjs and WebRTC.
 * This algorithm simulates the merging of causal operations from multiple peers without a central server.
 */

export function applyCRDTOperations(initialText, peerOperations) {
    if (!initialText && initialText !== "") {
        throw new Error("Initial text is required.");
    }
    
    // In a real CRDT, each character is a unique node with a globally unique ID (e.g., fractional indexing or logical clocks).
    // Here we simulate the eventual consistency by applying insertions and deletions based on their timestamps and logical positions.
    // To ensure convergence, we sort operations by timestamp. In case of ties, we use the peerId as a tie-breaker.
    
    const sortedOps = [...peerOperations].sort((a, b) => {
        if (a.timestamp === b.timestamp) {
            return a.peerId.localeCompare(b.peerId);
        }
        return a.timestamp - b.timestamp;
    });

    let currentText = initialText;
    const historyLog = [];

    for (const op of sortedOps) {
        if (op.type === "insert") {
            // Ensure index is within bounds
            const safeIndex = Math.min(Math.max(0, op.index), currentText.length);
            currentText = currentText.slice(0, safeIndex) + op.value + currentText.slice(safeIndex);
            historyLog.push(`[${op.timestamp}] Peer ${op.peerId} inserted "${op.value}" at index ${safeIndex}`);
        } else if (op.type === "delete") {
            const safeIndex = Math.min(Math.max(0, op.index), currentText.length);
            const safeLength = Math.min(op.length, currentText.length - safeIndex);
            if (safeLength > 0) {
                const deletedChars = currentText.slice(safeIndex, safeIndex + safeLength);
                currentText = currentText.slice(0, safeIndex) + currentText.slice(safeIndex + safeLength);
                historyLog.push(`[${op.timestamp}] Peer ${op.peerId} deleted "${deletedChars}" at index ${safeIndex}`);
            }
        }
    }

    return {
        finalText: currentText,
        operationsApplied: sortedOps.length,
        historyLog
    };
}
