export const CORRIDOR = {
  geometry: {
    // Length of a single continuous segment. 
    L: 12, 
    // Physical aspect ratio of the corridor
    W: 3.5, // Width 
    H: 4.5, // Height
    
    // How many segments are actively looping on the treadmill
    numSegments: 3, 
  },
  
  camera: {
    /**
     * THE PERSPECTIVE CONTROLLER (VANISHING POINT)
     * 
     * - `fov: 70` = Wide angle (GoPro). Deep, aggressive vanishing point distortion.
     * - `fov: 14` = Telephoto. Flat, 2D look with parallel lines (crushed depth).
     * - `fov: 40-45` = Natural human eye (50mm lens). The perfect cinematic middle ground!
     */
    fov: 42, 
    // Camera restored to dead-center of the hallway
    position: [0, 1.4, 5] as [number, number, number], 
    lookAt: [0, 1.3, -100] as [number, number, number],
  },
  
  colors: {
    floor: "#7a1a2a",      // Rich medium ruby red (brighter than black, deep enough for shadows)
    ceiling: "#e8e5d1",    // Warm off-white ceiling
    sideWalls: "#c2b8a3",  // Moodier, darker beige wallpaper
    backWall: "#5e5242",   // Distinct shadowy taupe back wall (stands out slightly more)
    doorFrame: "#ffffff",  // Stark white frames
    door: "#331c0b",       // Very dark polished wood
    ambientLight: "#ffffff",
    ceilingLight: "#fff0dd",// Fluorescent/warm ceiling light emission
  },

  lights: {
    ambientIntensity: 0.6, // Darker ambience allows the ceiling lights to cast dramatic falloff
    ceilingIntensity: 5, 
    ceilingDistance: 25,
  }
};
