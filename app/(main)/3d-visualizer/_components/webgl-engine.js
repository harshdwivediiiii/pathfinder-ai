/**
 * Simulates a WebGL physics engine for visualizing code execution.
 * Tracks the Call Stack and Memory Heap as discrete 3D objects over time.
 */

export class WebGLVisualizerEngine {
    constructor() {
        this.frames = [];
        this.currentFrameIndex = 0;
    }

    parseCode(code) {
        if (!code || typeof code !== 'string') {
            throw new Error("Invalid code provided for visualization.");
        }

        // Mock parsing logic to generate 3D animation frames
        this.frames = [];
        let time = 0;
        
        // Frame 0: Initial State
        this.frames.push({
            time,
            action: 'INITIALIZE',
            callStack: [],
            heap: [],
            message: "Global Execution Context created."
        });

        // Frame 1: Push main function
        time += 1;
        this.frames.push({
            time,
            action: 'PUSH_STACK',
            callStack: [{ id: 'stack_1', name: 'main()', yPosition: 10, color: 'blue' }],
            heap: [],
            message: "main() pushed onto the Call Stack."
        });

        // Frame 2: Allocate memory
        time += 1;
        this.frames.push({
            time,
            action: 'ALLOCATE_HEAP',
            callStack: [{ id: 'stack_1', name: 'main()', yPosition: 10, color: 'blue' }],
            heap: [{ id: 'heap_1', type: 'Object', size: 50, xPosition: 100, isReferenced: true, color: 'green' }],
            message: "Memory allocated in the Heap for new Object."
        });

        // Frame 3: Call nested function
        time += 1;
        this.frames.push({
            time,
            action: 'PUSH_STACK',
            callStack: [
                { id: 'stack_1', name: 'main()', yPosition: 10, color: 'blue' },
                { id: 'stack_2', name: 'calculate()', yPosition: 30, color: 'purple' }
            ],
            heap: [{ id: 'heap_1', type: 'Object', size: 50, xPosition: 100, isReferenced: true, color: 'green' }],
            message: "calculate() pushed onto the Call Stack."
        });

        // Frame 4: Pop nested function
        time += 1;
        this.frames.push({
            time,
            action: 'POP_STACK',
            callStack: [{ id: 'stack_1', name: 'main()', yPosition: 10, color: 'blue' }],
            heap: [{ id: 'heap_1', type: 'Object', size: 50, xPosition: 100, isReferenced: false, color: 'red' }],
            message: "calculate() completes and pops off. Object reference lost."
        });

        // Frame 5: Garbage Collection
        time += 1;
        this.frames.push({
            time,
            action: 'GARBAGE_COLLECTION',
            callStack: [{ id: 'stack_1', name: 'main()', yPosition: 10, color: 'blue' }],
            heap: [],
            message: "Garbage Collector sweeps unreferenced memory block."
        });

        return this.frames.length;
    }

    getFrame(index) {
        if (index < 0 || index >= this.frames.length) {
            return null;
        }
        return this.frames[index];
    }

    getAllFrames() {
        return this.frames;
    }
}
