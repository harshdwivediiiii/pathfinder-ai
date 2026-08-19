import { describe, it, expect } from 'vitest';
import { SpaceRouter } from '../lib/ai/space-router.js';

describe('SpaceRouter', () => {
  it('chooses a longer flyby route over a direct transfer if it saves Delta-V', () => {
    const router = new SpaceRouter();

    const earth = { id: 'Earth', orbitRadius: 1 };
    const jupiter = { id: 'Jupiter', orbitRadius: 5.2, mass: 317.8 }; // Massive gravity assist potential
    const pluto = { id: 'Pluto', orbitRadius: 39 };

    // Path 1: Direct Earth -> Pluto
    // Base Dv = (39 - 1) * 2.5 = 95 km/s
    const directPath = { 
      name: 'Direct Hohmann', 
      nodes: [earth, pluto], 
      edges: [{ transferTimeYears: 15 }] // Takes 15 years
    };

    // Path 2: Earth -> Jupiter (Flyby) -> Pluto
    // Base Dv to Jupiter = (5.2 - 1) * 2.5 = 10.5 km/s
    // Assist at Jupiter = huge discount
    // Base Dv Jupiter to Pluto = (39 - 5.2) * 2.5 = 84.5 km/s
    // Total Dv = 10.5 + 84.5 - JupiterAssist
    const flybyPath = { 
      name: 'Jupiter Assist', 
      nodes: [earth, jupiter, pluto], 
      edges: [
        { transferTimeYears: 2 }, // Earth to Jupiter
        { transferTimeYears: 8 }  // Jupiter to Pluto
      ]
    };

    const mockGraph = {
      paths: [directPath, flybyPath]
    };

    const missionWindow = { maxFlightTimeYears: 20 };
    const result = router.routeSpacecraft(mockGraph, 'Earth', 'Pluto', missionWindow);

    expect(result.status).toBe('success');
    expect(result.path.includes('Jupiter')).toBe(true); // Should absolutely choose the Jupiter assist
    
    // Total Dv for direct is 95. Flyby should be significantly less because of Jupiter's assist.
    expect(result.deltaV).toBeLessThan(95); 
  });

  it('rejects an optimal flyby route if it violates the maximum mission duration', () => {
    const router = new SpaceRouter();

    const earth = { id: 'Earth', orbitRadius: 1 };
    
    // Hypothetical slow-orbiting body for a massive but slow assist
    const slowGiant = { id: 'SlowGiant', orbitRadius: 2, mass: 500 }; 
    const mars = { id: 'Mars', orbitRadius: 1.5 };

    // Path 1: Direct Earth -> Mars (Fast, but costs fuel)
    const directPath = { 
      name: 'Direct', 
      nodes: [earth, mars], 
      edges: [{ transferTimeYears: 0.5 }]
    };

    // Path 2: Earth -> SlowGiant -> Mars (Almost free DeltaV, but takes 10 years)
    const flybyPath = { 
      name: 'Slow Assist', 
      nodes: [earth, slowGiant, mars], 
      edges: [
        { transferTimeYears: 5 }, 
        { transferTimeYears: 5 }
      ]
    };

    const mockGraph = {
      paths: [directPath, flybyPath]
    };

    // Strict time limit! Astronauts need to get there fast.
    const missionWindow = { maxFlightTimeYears: 2 }; 
    const result = router.routeSpacecraft(mockGraph, 'Earth', 'Mars', missionWindow);

    expect(result.status).toBe('success');
    // Must choose direct because flyby violates the 2-year window
    expect(result.path).toEqual(['Earth', 'Mars']);
  });
});
