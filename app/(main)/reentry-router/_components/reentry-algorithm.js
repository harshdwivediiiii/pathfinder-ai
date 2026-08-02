/**
 * Astrodynamics Re-entry Physics Simulator
 */

const CONSTANTS = {
  GRAVITY: 9.81, // m/s^2 at surface
  EARTH_RADIUS: 6371000, // meters
  ATMOSPHERE_HEIGHT: 120000, // meters (Karman line + buffer)
  SCALE_HEIGHT: 8500, // meters (controls atmospheric density falloff)
  SURFACE_DENSITY: 1.225, // kg/m^3
  MAX_SIMULATION_STEPS: 2000,
  TIME_STEP: 2.0 // seconds per physics tick
};

/**
 * Calculates atmospheric density at a given altitude using an isothermal model.
 */
function getAtmosphericDensity(altitude) {
  if (altitude > CONSTANTS.ATMOSPHERE_HEIGHT) return 0;
  return CONSTANTS.SURFACE_DENSITY * Math.exp(-altitude / CONSTANTS.SCALE_HEIGHT);
}

/**
 * Simulates a spacecraft re-entry trajectory.
 * 
 * @param {number} entryAngleDeg - Flight path angle at atmospheric interface (negative means pointing down)
 * @param {number} initialVelocity - Entry velocity in m/s (e.g. LEO is ~7800 m/s)
 * @param {number} mass - Spacecraft mass in kg
 * @param {number} dragArea - Frontal cross-sectional area * drag coefficient (m^2)
 * @returns {Object} Simulation results including trajectory path, max Gs, max Temp, and status
 */
export function simulateReentryTrajectory(
  entryAngleDeg = -2.5,
  initialVelocity = 7800,
  mass = 5000,
  dragArea = 15
) {
  const trajectory = [];
  
  // Convert angle to radians
  let flightPathAngle = (entryAngleDeg * Math.PI) / 180;
  
  // Initial State at Karman Line
  let altitude = CONSTANTS.ATMOSPHERE_HEIGHT;
  let velocity = initialVelocity;
  let distance = 0; // Downrange distance
  
  let maxG = 0;
  let maxTemp = 0;
  let status = "Simulating...";
  let outcome = "Unknown";
  
  let step = 0;
  
  while (step < CONSTANTS.MAX_SIMULATION_STEPS) {
    // Record current state
    trajectory.push({
      x: distance / 1000, // km
      y: altitude / 1000, // km
      velocity,
      gForce: 0,
      temperature: 0
    });
    
    // Check end conditions
    if (altitude <= 0) {
      outcome = "Landed";
      break;
    }
    if (altitude > CONSTANTS.ATMOSPHERE_HEIGHT + 10000 && step > 10) {
      outcome = "Skipped Out";
      break;
    }
    if (velocity < 100 && altitude > 0) {
      // Freefall under parachutes (terminal velocity approximation)
      altitude -= 10 * CONSTANTS.TIME_STEP;
      distance += velocity * Math.cos(flightPathAngle) * CONSTANTS.TIME_STEP;
      step++;
      continue;
    }
    
    // Physics Step
    const density = getAtmosphericDensity(altitude);
    
    // 1. Aerodynamic Drag (D = 0.5 * rho * v^2 * Cd * A)
    const dragForce = 0.5 * density * velocity * velocity * dragArea;
    const dragDeceleration = dragForce / mass; // m/s^2
    
    // Calculate G-Force
    const gForce = dragDeceleration / CONSTANTS.GRAVITY;
    if (gForce > maxG) maxG = gForce;
    trajectory[trajectory.length - 1].gForce = gForce;
    
    // 2. Thermal Heating Approximation
    // Stagnation point convective heating rate is roughly proportional to sqrt(density) * v^3
    // We scale this to a realistic peak temperature in Celsius for a blunt body
    const heatingRate = Math.sqrt(density) * Math.pow(velocity, 3);
    const temperature = heatingRate * 0.0000003; // Calibration constant
    if (temperature > maxTemp) maxTemp = temperature;
    trajectory[trajectory.length - 1].temperature = temperature;
    
    // 3. Gravity and Centrifugal forces affecting Flight Path Angle
    const r = CONSTANTS.EARTH_RADIUS + altitude;
    const gravityForce = CONSTANTS.GRAVITY * Math.pow(CONSTANTS.EARTH_RADIUS / r, 2);
    // Centrifugal acceleration (v^2 / r) reduces effective gravity
    const centrifugalForce = (velocity * velocity) / r;
    
    // Rate of change of velocity
    const dv = -dragDeceleration - gravityForce * Math.sin(flightPathAngle);
    
    // Rate of change of flight path angle
    // (g - v^2/r) * cos(gamma) / v
    let dGamma = 0;
    if (velocity > 0) {
      dGamma = ((centrifugalForce - gravityForce) * Math.cos(flightPathAngle)) / velocity;
    }
    
    // Integration (Euler method is sufficient for this simple visualization)
    velocity += dv * CONSTANTS.TIME_STEP;
    flightPathAngle += dGamma * CONSTANTS.TIME_STEP;
    
    // Position Update
    altitude += velocity * Math.sin(flightPathAngle) * CONSTANTS.TIME_STEP;
    distance += velocity * Math.cos(flightPathAngle) * CONSTANTS.TIME_STEP;
    
    step++;
  }
  
  // Evaluate outcome based on constraints
  if (outcome === "Landed") {
    if (maxG > 12) outcome = "Fatal G-Force";
    else if (maxTemp > 2500) outcome = "Burned Up";
    else outcome = "Safe Landing";
  }
  
  return {
    trajectory,
    maxG,
    maxTemp,
    outcome
  };
}
