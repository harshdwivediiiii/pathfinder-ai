import { describe, it, expect } from 'vitest';
import { BalloonRouter } from '../lib/ai/balloon-router.js';

describe('BalloonRouter', () => {
  it('commands a descent to catch a favorable wind back to the target', () => {
    // Target is origin (0,0), max drift 100
    const router = new BalloonRouter({ x: 0, y: 0 }, 100);

    // Balloon is currently at x: 80, drifting dangerously East
    const initialPos = { x: 80, y: 0 };

    const windForecast = {
      0: {
        50000: { dx: 30, dy: 0 }, // Blows East (further away to 110)
        40000: { dx: -30, dy: 0 } // Blows West (back towards 0)
      }
    };

    const result = router.routeHoldingPattern(50000, initialPos, windForecast, 1);

    expect(result.status).toBe('success');
    
    // It should choose to descend to 40,000 to catch the Westerly wind
    expect(result.schedule[0].action).toBe('DESCEND');
    expect(result.schedule[0].targetAltitude).toBe(40000);
    expect(result.schedule[0].projectedPosition.x).toBe(50); // 80 - 30 = 50
  });

  it('generates a multi-hour schedule minimizing drift', () => {
    const router = new BalloonRouter({ x: 0, y: 0 }, 100);
    const initialPos = { x: 0, y: 0 };

    const windForecast = {
      0: {
        50000: { dx: 10, dy: 10 },
        40000: { dx: 50, dy: 50 }
      },
      1: {
        50000: { dx: 10, dy: 10 }, // If it stays here, drift goes to (20, 20) -> dist ~28
        40000: { dx: -10, dy: -10 } // If it descends, drift goes to (0,0) -> dist 0
      }
    };

    const result = router.routeHoldingPattern(50000, initialPos, windForecast, 2);

    expect(result.status).toBe('success');
    expect(result.schedule.length).toBe(2);
    
    // Hour 0: Stay at 50k (dist ~14 vs dist ~70 at 40k)
    expect(result.schedule[0].action).toBe('MAINTAIN');
    expect(result.schedule[0].targetAltitude).toBe(50000);
    
    // Hour 1: Descend to 40k to ride the counter-current back to origin
    expect(result.schedule[1].action).toBe('DESCEND');
    expect(result.schedule[1].targetAltitude).toBe(40000);
  });

  it('flags a drift_warning if no wind current can prevent breaching the threshold', () => {
    const router = new BalloonRouter({ x: 0, y: 0 }, 50); // Strict 50 max drift
    const initialPos = { x: 40, y: 0 };

    // A massive storm system is blowing everything East at all altitudes
    const windForecast = {
      0: {
        50000: { dx: 20, dy: 0 },
        40000: { dx: 30, dy: 0 },
        30000: { dx: 40, dy: 0 }
      }
    };

    const result = router.routeHoldingPattern(50000, initialPos, windForecast, 1);

    // The best option is 50,000ft (dx: 20), which puts balloon at x: 60.
    // 60 > 50 threshold.
    expect(result.status).toBe('drift_warning');
    expect(result.maxDrift).toBe(60);
    expect(result.schedule[0].action).toBe('MAINTAIN');
    expect(result.schedule[0].targetAltitude).toBe(50000);
  });
});
