export class HapticFeedbackEngine {
  constructor(deviceController) {
    this.deviceController = deviceController; // Interface for OS haptic APIs (e.g., CoreHaptics)
  }

  translateManeuverToHaptics(maneuverType, distanceToManeuver) {
    // Determine the base pattern based on maneuver
    const pattern = this.getPatternForManeuver(maneuverType);
    
    if (!pattern) return null;

    // Modulate intensity or frequency based on distance
    const modulatedPattern = this.modulatePattern(pattern, distanceToManeuver);

    return modulatedPattern;
  }

  getPatternForManeuver(maneuverType) {
    // Define specific vibration signatures
    switch (maneuverType) {
      case 'turn_right':
        // Three short pulses
        return [
            { duration: 100, intensity: 0.8 },
            { duration: 50, intensity: 0 },
            { duration: 100, intensity: 0.8 },
            { duration: 50, intensity: 0 },
            { duration: 100, intensity: 0.8 }
        ];
      case 'turn_left':
        // One long, strong pulse
        return [
            { duration: 400, intensity: 1.0 }
        ];
      case 'straight':
        // Gentle pulse confirming correct direction
        return [
            { duration: 100, intensity: 0.3 }
        ];
      case 'stop':
      case 'hazard':
        // Rapid, jarring alert
        return Array(5).fill([
            { duration: 50, intensity: 1.0 },
            { duration: 50, intensity: 0 }
        ]).flat();
      default:
        return null;
    }
  }

  modulatePattern(pattern, distance) {
    // e.g., if distance < 10 meters, increase intensity
    const intensityMultiplier = distance < 10 ? 1.0 : (distance < 50 ? 0.7 : 0.4);
    
    return pattern.map(step => ({
        duration: step.duration,
        intensity: Math.min(1.0, step.intensity * intensityMultiplier)
    }));
  }

  executePattern(pattern) {
    // Send the pattern to the underlying device hardware
    if (this.deviceController && typeof this.deviceController.playPattern === 'function') {
        this.deviceController.playPattern(pattern);
    }
  }
}
