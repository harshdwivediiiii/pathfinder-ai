export class SmartGridRouter {
  // Simulates thermal resistance of a transmission line
  calculateThermalResistance(edge, ambientTemp, requestedLoad) {
    const baseResistance = edge.baseResistance || 1;
    const maxCapacity = edge.maxCapacity || 100; // MW
    const currentLoad = edge.currentLoad || 0; // MW

    // If adding the requested load exceeds absolute physical limits, line will melt. Impassable.
    if (currentLoad + requestedLoad > maxCapacity) {
      return Infinity; 
    }

    // Calculate load percentage (0.0 to 1.0)
    const loadPercentage = (currentLoad + requestedLoad) / maxCapacity;

    // Simulate ambient temperature effects (standard baseline 20C)
    // High heat significantly increases physical resistance and thermal sagging
    // We multiply the heat penalty by the load percentage, as fully loaded lines heat up significantly more
    const safeLoadPercentage = Math.min(loadPercentage, 0.999);
    const tempPenaltyMultiplier = Math.max(0, (ambientTemp - 20) * 0.05);
    const tempFactor = 1 + (tempPenaltyMultiplier * safeLoadPercentage);

    // Exponential penalty as the line approaches maximum capacity
    // A line at 95% capacity has massively higher "routing cost" than a line at 20% capacity.
    // Cost = Base * TempFactor / (1 - LoadPercentage^2)
    // Avoid divide by zero if load == maxCapacity by clamping slightly below 1
    
    let thermalCost = (baseResistance * tempFactor) / (1 - Math.pow(safeLoadPercentage, 2));

    return thermalCost;
  }

  routePower(graph, sourceId, targetId, requestedLoad, ambientTemp = 20) {
    let bestPath = [];
    let lowestCost = Infinity;

    // Simulate exploring all possible routes through the grid
    graph.paths.forEach(path => {
      let currentPathCost = 0;
      let isPathValid = true;

      for (let i = 0; i < path.edges.length; i++) {
        const edge = path.edges[i];
        
        const thermalCost = this.calculateThermalResistance(edge, ambientTemp, requestedLoad);

        if (thermalCost === Infinity) {
          isPathValid = false;
          break; // This specific path will cause a line to melt, abort this path
        }

        currentPathCost += thermalCost;
      }

      if (isPathValid && currentPathCost < lowestCost) {
        lowestCost = currentPathCost;
        bestPath = path.nodes.map(n => n.id);
      }
    });

    if (bestPath.length === 0) {
      return { 
        status: 'grid_overload_prevented', 
        reason: 'Routing this load would cause cascading thermal failure across all available paths.', 
        cost: Infinity, 
        path: [] 
      };
    }

    return { 
      status: 'success', 
      cost: lowestCost, 
      path: bestPath 
    };
  }
}
