/**
 * Simple pseudo-random number generator for predictable maps
 */
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const LANDMARKS = [
  "blue gas station",
  "brick post office",
  "large oak tree",
  "McDonalds drive-thru",
  "yellow fire hydrant",
  "pedestrian overpass",
  "statue of the founder",
  "neon diner sign",
  "abandoned warehouse"
];

/**
 * Generates an urban grid with semantic landmarks.
 */
export function generateSemanticMap(width, height, seed = 42) {
  const mapData = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const isIntersection = (x % 5 === 0) && (y % 5 === 0);
      let landmark = null;
      
      if (isIntersection) {
         const lmRoll = seededRandom(seed + x + y * width);
         if (lmRoll > 0.6) {
             const lmIndex = Math.floor(seededRandom(seed * 2 + x) * LANDMARKS.length);
             landmark = LANDMARKS[lmIndex];
         }
      }
      
      row.push({ 
        isIntersection,
        landmark
      });
    }
    mapData.push(row);
  }

  return mapData;
}

/**
 * Generates turn-by-turn instructions given a path and map.
 */
export function generateNavInstructions(path, mapData, useContextualLLM) {
  if (!path || path.length < 2) return [];
  
  const instructions = [];
  let currentDir = { dx: Math.sign(path[1].x - path[0].x), dy: Math.sign(path[1].y - path[0].y) };
  let distanceCounter = 0;
  
  for (let i = 1; i < path.length - 1; i++) {
    const curr = path[i];
    const next = path[i+1];
    
    distanceCounter += 50; // Assume each block is 50 meters
    
    const nextDir = { dx: Math.sign(next.x - curr.x), dy: Math.sign(next.y - curr.y) };
    
    // Check if we are turning
    if (nextDir.dx !== currentDir.dx || nextDir.dy !== currentDir.dy) {
        
        let turnType = "turn";
        // Calculate relative turn
        // dot product / cross product trick not strictly needed, just simple check
        if (currentDir.dy === -1) turnType = nextDir.dx === 1 ? "right" : "left"; // going up
        else if (currentDir.dy === 1) turnType = nextDir.dx === 1 ? "left" : "right"; // going down
        else if (currentDir.dx === 1) turnType = nextDir.dy === 1 ? "right" : "left"; // going right
        else if (currentDir.dx === -1) turnType = nextDir.dy === 1 ? "left" : "right"; // going left
        
        const node = mapData[curr.y][curr.x];
        
        let instructionStr = "";
        if (useContextualLLM) {
            if (node.landmark) {
                instructionStr = `Turn ${turnType} right after the ${node.landmark}.`;
            } else {
                instructionStr = `Take a ${turnType} at the next intersection.`;
            }
        } else {
            instructionStr = `In ${distanceCounter} meters, turn ${turnType}.`;
        }
        
        instructions.push({
            x: curr.x,
            y: curr.y,
            text: instructionStr,
            landmark: node.landmark,
            type: turnType
        });
        
        currentDir = nextDir;
        distanceCounter = 0; // reset for next leg
    }
  }
  
  instructions.push({
      x: path[path.length-1].x,
      y: path[path.length-1].y,
      text: useContextualLLM ? "You've reached your destination on the right." : "Arrived at destination.",
      type: "arrive"
  });
  
  return instructions;
}
