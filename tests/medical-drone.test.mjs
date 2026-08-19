import { describe, it, expect } from 'vitest';
import { MedicalDroneRouter } from '../lib/ai/medical-drone-router.js';

describe('MedicalDroneRouter', () => {
  it('routes payload to the most critical hospital regardless of distance, if within time constraints', () => {
    const router = new MedicalDroneRouter();

    const startNode = { id: 'BloodBank', x: 0, y: 0 };
    
    // Hospital A: Close, but only needs O-Negative moderately
    const hospA = { 
      id: 'HospitalA', x: 10, y: 0, isHospital: true, 
      demands: [{ type: 'O-Negative', urgency: 'MODERATE', amount: 2 }] 
    };
    
    // Hospital B: Farther, but needs O-Negative critically
    const hospB = { 
      id: 'HospitalB', x: 50, y: 0, isHospital: true, 
      demands: [{ type: 'O-Negative', urgency: 'CRITICAL', amount: 5 }] 
    };

    const mockGraph = {
      paths: [
        { name: 'To Hosp A', nodes: [startNode, hospA] },
        { name: 'To Hosp B', nodes: [startNode, hospB] }
      ]
    };

    const payload = { type: 'O-Negative', maxTransitTimeMinutes: 60 };
    const droneConfig = { speedKmh: 120 }; // 120km/h = 2km/min

    // Distances:
    // HospA = 10km -> 5 mins
    // HospB = 50km -> 25 mins (Still under the 60 min limit)

    const result = router.routeDrone(mockGraph, 'BloodBank', payload, droneConfig);

    expect(result.status).toBe('success');
    expect(result.destination).toBe('HospitalB'); // Router chooses the critical one
  });

  it('routes to a less critical hospital if the critical one is too far and violates cold-chain limits', () => {
    const router = new MedicalDroneRouter();

    const startNode = { id: 'BloodBank', x: 0, y: 0 };
    
    // Hospital A: Close, needs blood moderately
    const hospA = { 
      id: 'HospitalA', x: 10, y: 0, isHospital: true, 
      demands: [{ type: 'O-Negative', urgency: 'MODERATE', amount: 2 }] 
    };
    
    // Hospital B: Very far, needs blood critically
    const hospB = { 
      id: 'HospitalB', x: 150, y: 0, isHospital: true, 
      demands: [{ type: 'O-Negative', urgency: 'CRITICAL', amount: 5 }] 
    };

    const mockGraph = {
      paths: [
        { name: 'To Hosp A', nodes: [startNode, hospA] },
        { name: 'To Hosp B', nodes: [startNode, hospB] }
      ]
    };

    // Strict cold-chain limit of 30 minutes!
    const payload = { type: 'O-Negative', maxTransitTimeMinutes: 30 };
    const droneConfig = { speedKmh: 120 }; // 2km/min

    // Distances:
    // HospA = 10km -> 5 mins (OK)
    // HospB = 150km -> 75 mins (EXCEEDS LIMIT)

    const result = router.routeDrone(mockGraph, 'BloodBank', payload, droneConfig);

    expect(result.status).toBe('success');
    expect(result.destination).toBe('HospitalA'); // Forced to choose A because B is too far
  });

  it('fails if no hospitals are within reachable cold-chain limits', () => {
    const router = new MedicalDroneRouter();

    const startNode = { id: 'BloodBank', x: 0, y: 0 };
    
    const hospB = { 
      id: 'HospitalB', x: 150, y: 0, isHospital: true, 
      demands: [{ type: 'O-Negative', urgency: 'CRITICAL', amount: 5 }] 
    };

    const mockGraph = {
      paths: [
        { name: 'To Hosp B', nodes: [startNode, hospB] }
      ]
    };

    // Strict cold-chain limit of 30 minutes!
    const payload = { type: 'O-Negative', maxTransitTimeMinutes: 30 };
    const droneConfig = { speedKmh: 120 }; // 2km/min

    const result = router.routeDrone(mockGraph, 'BloodBank', payload, droneConfig);

    expect(result.status).toBe('failed');
    expect(result.reason).toContain('No reachable hospitals');
  });
});
