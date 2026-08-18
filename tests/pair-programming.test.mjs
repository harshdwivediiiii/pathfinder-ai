import { describe, it, expect } from 'vitest';
import { applyCRDTOperations } from '../app/(main)/pair-programming/_components/crdt-algorithm.js';

describe('Real-Time Pair Programming via WebRTC and CRDTs', () => {
    it('should successfully apply concurrent operations resolving conflicts causally', () => {
        const initialText = "hello world";
        const operations = [
            { peerId: "B", timestamp: 2, type: "insert", index: 5, value: " there" },
            { peerId: "A", timestamp: 1, type: "insert", index: 11, value: "!" },
            { peerId: "C", timestamp: 1, type: "delete", index: 0, length: 6 } // deletes "hello "
        ];

        const result = applyCRDTOperations(initialText, operations);

        // Timeline:
        // Initial: "hello world"
        // t=1 (Peer A): insert "!" at index 11 -> "hello world!"
        // t=1 (Peer C): delete 6 chars at index 0 -> "world!"
        // t=2 (Peer B): insert " there" at index 5 -> "world there!"
        // (Wait, C deletes index 0, length 6. Initial length is 11. 
        // Then B inserts at index 5. "world!" has length 6. Index 5 is before "!". So "world there!")

        // Wait, the order depends on peerId if timestamps match.
        // A before C.
        // Op 1 (A): insert "!" at 11 -> "hello world!"
        // Op 2 (C): delete 6 at 0 -> "world!"
        // Op 3 (B): insert " there" at 5 -> "world there!"

        expect(result.finalText).toBe("world there!");
        expect(result.operationsApplied).toBe(3);
        expect(result.historyLog).toHaveLength(3);
    });

    it('should handle out-of-bounds indices safely', () => {
        const initialText = "code";
        const operations = [
            { peerId: "A", timestamp: 1, type: "insert", index: 100, value: " logic" },
            { peerId: "B", timestamp: 2, type: "delete", index: -5, length: 100 }
        ];

        const result = applyCRDTOperations(initialText, operations);

        // Op 1: index 100 is clamped to 4. "code" -> "code logic"
        // Op 2: index -5 clamped to 0, length 100 deletes everything -> ""
        expect(result.finalText).toBe("");
    });
});
