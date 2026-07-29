export class DifferentialPrivacyLayer {
  constructor(epsilon, sensitivity) {
    this.epsilon = epsilon; // Privacy budget
    this.sensitivity = sensitivity; // Maximum impact a single user can have
  }

  generateLaplaceNoise() {
    const scale = this.sensitivity / this.epsilon;
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  anonymizeTelemetry(telemetryData) {
    return telemetryData.map(dataPoint => {
      return {
        ...dataPoint,
        speed: dataPoint.speed + this.generateLaplaceNoise(),
        locationLat: dataPoint.locationLat + (this.generateLaplaceNoise() * 0.0001), // Small noise to GPS
        locationLng: dataPoint.locationLng + (this.generateLaplaceNoise() * 0.0001)
      };
    });
  }

  aggregateTrafficData(anonymizedData) {
    let totalSpeed = 0;
    anonymizedData.forEach(d => totalSpeed += d.speed);
    return anonymizedData.length > 0 ? totalSpeed / anonymizedData.length : 0;
  }
}
