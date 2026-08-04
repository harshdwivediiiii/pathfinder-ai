import { describe, it, expect } from 'vitest';
import { generateDeliveryMap, optimizeLastMileDelivery } from '../app/(main)/delivery-router/_components/delivery-algorithm.js';

describe('Last-Mile Delivery Zone Optimization AI', () => {
  it('finds the optimal parking spot minimizing total walk distance', () => {
    
    // We can just use the generator for a small map and mock the locations
    const map = generateDeliveryMap(10, 10, 42);
    
    // Let's force two parking spots
    const spotA = { x: 0, y: 0 }; // Far from dropoffs
    const spotB = { x: 5, y: 5 }; // Close to dropoffs
    
    // Force them into the map (generator makes edges walkable)
    map.mapData[spotA.y][spotA.x].isWalkable = true;
    map.mapData[spotB.y][spotB.x].isWalkable = true;
    
    const dropoffs = [
        { x: 4, y: 5 },
        { x: 5, y: 4 },
        { x: 6, y: 5 }
    ];
    
    // Make dropoffs walkable
    dropoffs.forEach(d => map.mapData[d.y][d.x].isWalkable = true);

    const result = optimizeLastMileDelivery(map.mapData, [spotA, spotB], dropoffs);
    
    // The algorithm should pick spotB because it is much closer to all 3 dropoffs.
    expect(result.optimalParking).toBeDefined();
    expect(result.optimalParking.x).toBe(spotB.x);
    expect(result.optimalParking.y).toBe(spotB.y);
  });
});
