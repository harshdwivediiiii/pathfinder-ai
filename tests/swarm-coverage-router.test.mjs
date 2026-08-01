import { describe, it, expect } from 'vitest';
import { SwarmCoverageRouter } from '../lib/ai/swarm-coverage-router.js';

describe('SwarmCoverageRouter', () => {
  it('evenly distributes 10 polygons across a swarm of 5 robots', () => {
    const router = new SwarmCoverageRouter();

    const polygons = Array.from({ length: 10 }, (_, i) => ({ id: `poly_${i}` }));
    const robots = Array.from({ length: 5 }, (_, i) => ({ id: `robot_${i}` }));

    router.initializeSwarm(polygons, robots);

    const assignments = router.getAssignments();
    
    // Each robot should have exactly 2 polygons
    expect(assignments['robot_0'].length).toBe(2);
    expect(assignments['robot_4'].length).toBe(2);
  });

  it('redistributes unfinished polygons when a robot fails mid-task', () => {
    const router = new SwarmCoverageRouter();

    const polygons = Array.from({ length: 10 }, (_, i) => ({ id: `poly_${i}` }));
    const robots = Array.from({ length: 5 }, (_, i) => ({ id: `robot_${i}` }));

    router.initializeSwarm(polygons, robots);

    // Let's say robot_0 successfully clears one of its polygons
    router.markPolygonCleared('robot_0', 'poly_0');
    
    // Robot 0 should now only have 1 polygon left ('poly_5')
    expect(router.getAssignments()['robot_0'].length).toBe(1);

    // Suddenly, Robot 2 explodes (hits a mine)
    // Robot 2 was originally assigned poly_2 and poly_7.
    // We recalculate the swarm with the surviving 4 robots
    const survivingRobots = robots.filter(r => r.id !== 'robot_2');
    
    router.recalculateSwarm('robot_2', survivingRobots);

    const newAssignments = router.getAssignments();
    
    // Robot 2 is completely removed from the tracking system
    expect(newAssignments['robot_2']).toBeUndefined();

    // The remaining 2 un-swept polygons from Robot 2 should have been distributed 
    // among the 4 surviving robots. So two robots should have gained an extra polygon.
    let totalAssigned = 0;
    Object.values(newAssignments).forEach(polyArray => {
      totalAssigned += polyArray.length;
    });

    // We started with 10. Robot 0 cleared 1. 9 total polygons remain un-swept.
    // They must all be assigned to the surviving robots. No gaps allowed.
    expect(totalAssigned).toBe(9);
  });
});
