import { describe, it, expect } from 'vitest';
import { WildlifeRouter } from '../lib/ai/wildlife-router.js';

describe('WildlifeRouter', () => {
  it('avoids a direct path through urban sprawl in favor of a longer forested detour', () => {
    const router = new WildlifeRouter();

    const startNode = { id: 'NationalParkNorth', x: 0, y: 0 };
    const endNode = { id: 'NationalParkSouth', x: 100, y: 0 }; 

    // Path 1: Direct route through a city (100km)
    const urbanEdge = { lengthMeters: 100, landUse: 'URBAN', naturalCover: 'BARREN', trafficVolume: 1000 };
    
    // Path 2: Huge detour around the city through a dense forest (300km)
    const forestEdge = { lengthMeters: 300, landUse: 'NATURAL', naturalCover: 'FOREST', trafficVolume: 0 };

    const mockGraph = {
      paths: [
        { name: 'Direct Urban', nodes: [startNode, endNode], edges: [urbanEdge] },
        { name: 'Forest Detour', nodes: [startNode, { id: 'ForestNode' }, endNode], edges: [forestEdge, { lengthMeters: 0, landUse: 'NATURAL', naturalCover: 'FOREST', trafficVolume: 0 }] }
      ]
    };

    const result = router.routeMigrationCorridor(mockGraph, 'NationalParkNorth', 'NationalParkSouth');

    expect(result.status).toBe('success');
    
    // Cost calculation:
    // Urban: 100 (dist) * 10 (urban) * 2.0 (barren) + 2000 (traffic) = 2000 + 2000 = 4000.
    // Forest: 300 (dist) * 0.5 (forest) + 0 (traffic) = 150.
    // Algorithm must strongly prefer the 300km forest detour (150 < 4000).
    expect(result.path.includes('ForestNode')).toBe(true);
    expect(result.cost).toBeLessThan(4000);
  });

  it('identifies and flags a lethal highway crossing that requires a wildlife bridge', () => {
    const router = new WildlifeRouter();

    const startNode = { id: 'HabitatA', x: 0, y: 0 };
    const endNode = { id: 'HabitatB', x: 100, y: 0 }; 

    // The animals MUST cross a highway to get to Habitat B. 
    // They have two choices:
    // Path 1: Cross the 8-lane mega highway (traffic 5000)
    const megaHighwayEdge = { lengthMeters: 50, landUse: 'NATURAL', naturalCover: 'BARREN', trafficVolume: 5000 };
    
    // Path 2: Walk 50km out of the way to cross a quiet 2-lane rural road (traffic 600)
    const ruralHighwayEdge = { lengthMeters: 50, landUse: 'NATURAL', naturalCover: 'FOREST', trafficVolume: 600 };
    const walkingEdge = { lengthMeters: 50, landUse: 'NATURAL', naturalCover: 'FOREST', trafficVolume: 0 };

    const mockGraph = {
      paths: [
        { 
          name: 'Mega Highway', 
          nodes: [startNode, endNode], 
          edges: [megaHighwayEdge] 
        },
        { 
          name: 'Rural Crossing', 
          nodes: [startNode, { id: 'RuralCrossingNode' }, endNode], 
          edges: [walkingEdge, ruralHighwayEdge] 
        }
      ]
    };

    const result = router.routeMigrationCorridor(mockGraph, 'HabitatA', 'HabitatB');

    expect(result.status).toBe('success');
    
    // It should pick the rural crossing because 5000 traffic is penalized massively.
    expect(result.path.includes('RuralCrossingNode')).toBe(true);

    // Furthermore, it should flag that the rural highway crossing (>500 traffic) REQUIRES a bridge
    expect(result.interventions.length).toBeGreaterThan(0);
    expect(result.interventions[0].trafficVolume).toBe(600);
    expect(result.interventions[0].location).toContain('RuralCrossingNode');
  });
});
