export class BalloonRouter {
  /**
   * @param {Object} targetRegion { x, y } center of the desired holding pattern
   * @param {number} maxDriftThreshold Maximum allowed distance from the target region center
   */
  constructor(targetRegion = { x: 0, y: 0 }, maxDriftThreshold = 100) {
    this.targetRegion = targetRegion;
    this.maxDriftThreshold = maxDriftThreshold;
  }

  // Standard 2D distance formula
  calculateDistance(posA, posB) {
    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Simulates the balloon drifting in a specific wind current for 1 hour
  simulateDrift(currentPos, windVector) {
    return {
      x: currentPos.x + windVector.dx,
      y: currentPos.y + windVector.dy
    };
  }

  /**
   * Computes an optimal altitude schedule to keep the balloon over the target region.
   * Uses a greedy lookahead algorithm for simplicity.
   * 
   * @param {number} startAltitude e.g. 50000
   * @param {Object} initialPos { x, y }
   * @param {Object} windForecast { [timeHour]: { [altitude]: { dx, dy } } }
   * @param {number} totalDurationHours 
   */
  routeHoldingPattern(startAltitude, initialPos, windForecast, totalDurationHours) {
    let currentPos = { ...initialPos };
    let currentAltitude = startAltitude;
    
    let schedule = [];
    let maxDriftEncountered = 0;

    for (let hour = 0; hour < totalDurationHours; hour++) {
      const currentForecast = windForecast[hour];
      if (!currentForecast) {
        return { status: 'error', reason: `No wind forecast available for hour ${hour}` };
      }

      const availableAltitudes = Object.keys(currentForecast).map(Number);
      
      let bestAltitude = currentAltitude;
      let minProjectedDrift = Infinity;
      let bestNextPos = currentPos;

      // Evaluate each possible altitude layer we could shift to
      for (const alt of availableAltitudes) {
        // Can only ascend/descend relatively slowly, maybe 1 level per hour, but let's assume we can reach any available layer in an hour for simplicity.
        const windVector = currentForecast[alt];
        const projectedPos = this.simulateDrift(currentPos, windVector);
        const projectedDrift = this.calculateDistance(projectedPos, this.targetRegion);

        if (projectedDrift < minProjectedDrift) {
          minProjectedDrift = projectedDrift;
          bestAltitude = alt;
          bestNextPos = projectedPos;
        }
      }

      // Record the decision
      const action = bestAltitude > currentAltitude ? 'ASCEND' : (bestAltitude < currentAltitude ? 'DESCEND' : 'MAINTAIN');
      
      schedule.push({
        hour,
        action,
        targetAltitude: bestAltitude,
        projectedPosition: bestNextPos,
        projectedDrift: minProjectedDrift
      });

      // Update state for next hour
      currentPos = bestNextPos;
      currentAltitude = bestAltitude;

      if (minProjectedDrift > maxDriftEncountered) {
        maxDriftEncountered = minProjectedDrift;
      }
    }

    if (maxDriftEncountered > this.maxDriftThreshold) {
      return { 
        status: 'drift_warning', 
        maxDrift: maxDriftEncountered, 
        schedule 
      };
    }

    return { 
      status: 'success', 
      maxDrift: maxDriftEncountered, 
      schedule 
    };
  }
}
