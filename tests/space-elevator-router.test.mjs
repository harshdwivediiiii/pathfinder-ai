import { describe, it, expect, beforeEach } from 'vitest';
import { SpaceElevatorRouter } from '../lib/ai/space-elevator-router.js';

describe('SpaceElevatorRouter', () => {
  let router;
  
  beforeEach(() => {
    // Climber speed: 200 km/h
    router = new SpaceElevatorRouter(200); 
  });

  it('schedules an ascending and descending climber to meet exactly at a passing loop', () => {
    const earth = { id: 'Earth', y: 0, isPassingLoop: false };
    const passLoop = { id: 'PassingLoop', y: 2000, isPassingLoop: true };
    const geoStation = { id: 'GeoStation', y: 4000, isPassingLoop: false };

    const mockGraph = {
      paths: [
        { nodes: [earth, passLoop, geoStation] },
        { nodes: [geoStation, passLoop, earth] }
      ]
    };

    // Ascending climber leaves Earth at T=0
    const asc = router.scheduleClimber(mockGraph, 'Earth', 'GeoStation', 0, 'Ascender');
    expect(asc.status).toBe('scheduled');
    expect(asc.departureTimeHr).toBe(0);
    // Arrives at passing loop at T = 2000km / 200km/h = 10 hrs
    expect(asc.trajectory[1].arrivalTimeHr).toBe(10);

    // Descending climber wants to leave GeoStation at T=0.
    // If it leaves at T=0, it hits PassingLoop at T=10 hrs.
    // This means both climbers are at the PassingLoop at the EXACT same time.
    // Because it is `isPassingLoop: true`, the router should allow this!
    const desc = router.scheduleClimber(mockGraph, 'GeoStation', 'Earth', 0, 'Descender');
    expect(desc.status).toBe('scheduled');
    expect(desc.departureTimeHr).toBe(0);
  });

  it('delays departure if climbers would meet mid-tether (not at a passing loop)', () => {
    const earth = { id: 'Earth', y: 0, isPassingLoop: false };
    const passLoop = { id: 'PassingLoop', y: 2000, isPassingLoop: true };
    const geoStation = { id: 'GeoStation', y: 4000, isPassingLoop: false };

    const mockGraph = {
      paths: [
        { nodes: [earth, passLoop, geoStation] },
        { nodes: [geoStation, passLoop, earth] }
      ]
    };

    // Ascender leaves Earth at T=0. Hits PassingLoop at T=10, GeoStation at T=20.
    router.scheduleClimber(mockGraph, 'Earth', 'GeoStation', 0, 'Ascender');

    // Descender wants to leave GeoStation at T=5.
    // Hits PassingLoop at T=15.
    // Wait, if Descender leaves at T=5, it is on the upper tether segment (GeoStation->PassingLoop) 
    // from T=5 to T=15.
    // Ascender is on the upper tether segment (PassingLoop->GeoStation) from T=10 to T=20.
    // They overlap on the upper segment! Massive mid-tether collision!
    
    // The router MUST delay the Descender so it doesn't enter the upper segment until Ascender has cleared it.
    // Ascender clears the upper segment (arrives at GeoStation) at T=20.
    // Therefore, Descender must wait at GeoStation and depart at >= T=20.
    const desc = router.scheduleClimber(mockGraph, 'GeoStation', 'Earth', 5, 'Descender');
    
    expect(desc.status).toBe('scheduled');
    
    // Using a step size of 0.1, we expect 20.0
    // Because floating point math is annoying, use toBeCloseTo
    expect(desc.departureTimeHr).toBeCloseTo(20.0, 1);
  });
});
