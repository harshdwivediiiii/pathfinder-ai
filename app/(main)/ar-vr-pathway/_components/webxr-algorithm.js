/**
 * Simulates a standard 2D flowchart data structure for a learning pathway
 */
export const mockPathwayGraph = [
    { id: 'n1', label: 'HTML/CSS Basics', type: 'core', depthLevel: 0, branchId: 0 },
    { id: 'n2', label: 'JavaScript Fundamentals', type: 'core', depthLevel: 1, branchId: 0 },
    { id: 'n3', label: 'React.js', type: 'specialization', depthLevel: 2, branchId: -1 },
    { id: 'n4', label: 'Vue.js', type: 'specialization', depthLevel: 2, branchId: 1 },
    { id: 'n5', label: 'Node.js', type: 'core', depthLevel: 3, branchId: 0 },
    { id: 'n6', label: 'PostgreSQL', type: 'core', depthLevel: 4, branchId: 0 },
    { id: 'n7', label: 'Docker & DevOps', type: 'advanced', depthLevel: 5, branchId: 0 }
];

/**
 * Transforms a standard 2D logical graph into a 3D spatial coordinate map 
 * suitable for rendering in a WebXR (Three.js/Babylon.js) environment.
 * 
 * Z-axis: Represents progression through time/depth.
 * X-axis: Represents lateral branching (specializations).
 * Y-axis: Represents difficulty or layer abstraction.
 */
export function calculateSpatialCoordinates(graph) {
    if (!graph || graph.length === 0) return [];
    
    const SPATIAL_GAP = 5; // Distance between nodes in the 3D space
    
    return graph.map(node => {
        // Z-axis (Forward depth into the screen)
        // We make it negative so it goes "into" the screen away from the camera
        let z = -(node.depthLevel * SPATIAL_GAP * 2);
        if (Object.is(z, -0)) z = 0;
        
        // X-axis (Lateral branching left or right)
        const x = node.branchId * (SPATIAL_GAP * 1.5);
        
        // Y-axis (Vertical height based on complexity)
        let y = 0;
        if (node.type === 'specialization') y = SPATIAL_GAP * 0.8;
        if (node.type === 'advanced') y = SPATIAL_GAP * 1.5;
        
        // Calculate a bounding box volume for the WebXR hit-testing
        const hitBoxVolume = node.type === 'core' ? 2.0 : 1.5;
        
        return {
            ...node,
            coordinates: { x, y, z },
            hitBoxVolume
        };
    });
}
