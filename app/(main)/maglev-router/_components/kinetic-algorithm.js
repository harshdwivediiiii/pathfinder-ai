/**
 * Generates a 1D elevation profile for the Maglev track.
 */
export function generateTrackProfile(segments = 100) {
  const track = [];
  let elevation = 50; // Starting elevation (meters)

  for (let i = 0; i < segments; i++) {
    // Procedural hills and valleys using sine waves
    const hill1 = Math.sin((i / segments) * Math.PI * 4) * 20;
    const hill2 = Math.cos((i / segments) * Math.PI * 2) * 10;
    
    elevation = 50 + hill1 + hill2;
    
    track.push({
      distance: i * 10, // 10 meters per segment
      elevation: Math.max(0, elevation)
    });
  }
  return track;
}

/**
 * Calculates the Kinetic Routing Profile.
 * 
 * Physics Model:
 * - PE = m * g * h
 * - KE = 0.5 * m * v^2
 * - Work (Propulsion/Braking) = Delta Total Energy
 */
export function calculateKineticProfile(track, trainMassKg, targetSpeedMs, regenEfficiency) {
  const g = 9.81; // Gravity m/s^2
  
  const profile = [];
  let currentVelocity = 0;
  
  let totalGridPowerConsumed = 0; // Joules
  let totalRegenRecovered = 0; // Joules

  for (let i = 0; i < track.length; i++) {
    const currentPoint = track[i];
    const prevPoint = i === 0 ? track[0] : track[i - 1];
    
    // Calculate required energy state for the target speed at this elevation
    const targetKE = 0.5 * trainMassKg * Math.pow(targetSpeedMs, 2);
    const targetPE = trainMassKg * g * currentPoint.elevation;
    const totalTargetEnergy = targetKE + targetPE;

    // Calculate current energy state
    const currentKE = 0.5 * trainMassKg * Math.pow(currentVelocity, 2);
    const currentPE = trainMassKg * g * prevPoint.elevation;
    const currentTotalEnergy = currentKE + currentPE;

    // Energy required to bridge the gap
    const energyDelta = totalTargetEnergy - currentTotalEnergy;

    let powerDraw = 0;
    let regenPower = 0;

    if (energyDelta > 0) {
      // We need power from the grid to accelerate or climb
      powerDraw = energyDelta;
      totalGridPowerConsumed += powerDraw;
      currentVelocity = targetSpeedMs; 
    } else if (energyDelta < 0) {
      // We have excess energy (going downhill or braking)
      // Cap speed, recover energy via regenerative braking
      const recoverableEnergy = Math.abs(energyDelta);
      regenPower = recoverableEnergy * regenEfficiency;
      totalRegenRecovered += regenPower;
      currentVelocity = targetSpeedMs; 
    } else {
      // Cruising flat at target speed
      currentVelocity = targetSpeedMs;
    }

    // Convert Joules to Megajoules (MJ) for UI display
    profile.push({
      distance: currentPoint.distance,
      elevation: currentPoint.elevation,
      velocity: currentVelocity,
      powerDrawMJ: powerDraw / 1000000, 
      regenPowerMJ: regenPower / 1000000 
    });
  }

  return {
    profile,
    metrics: {
      totalConsumedMJ: (totalGridPowerConsumed / 1000000).toFixed(2),
      totalRecoveredMJ: (totalRegenRecovered / 1000000).toFixed(2),
      netEnergyMJ: ((totalGridPowerConsumed - totalRegenRecovered) / 1000000).toFixed(2)
    }
  };
}
