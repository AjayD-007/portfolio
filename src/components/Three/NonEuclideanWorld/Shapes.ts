import * as THREE from "three";

export const crownShape = new THREE.Shape();
crownShape.moveTo(0, 0); 
crownShape.lineTo(0.06, 0); 
crownShape.lineTo(0.06, -0.02); 
crownShape.quadraticCurveTo(0.02, -0.06, 0.01, -0.15); 
crownShape.lineTo(0.01, -0.2); 
crownShape.lineTo(0, -0.2); 
crownShape.lineTo(0, 0); 

export const baseboardShape = new THREE.Shape();
baseboardShape.moveTo(0, 0); 
baseboardShape.lineTo(0.03, 0); 
baseboardShape.lineTo(0.03, 0.12); 
baseboardShape.quadraticCurveTo(0.03, 0.15, 0, 0.15); 
baseboardShape.lineTo(0, 0); 

export const rightCrownShape = new THREE.Shape();
rightCrownShape.moveTo(0, 0); 
rightCrownShape.lineTo(-0.06, 0); 
rightCrownShape.lineTo(-0.06, -0.02); 
rightCrownShape.quadraticCurveTo(-0.02, -0.06, -0.01, -0.15); 
rightCrownShape.lineTo(-0.01, -0.2); 
rightCrownShape.lineTo(0, -0.2); 
rightCrownShape.lineTo(0, 0); 

export const rightBaseboardShape = new THREE.Shape();
rightBaseboardShape.moveTo(0, 0); 
rightBaseboardShape.lineTo(-0.03, 0); 
rightBaseboardShape.lineTo(-0.03, 0.12); 
rightBaseboardShape.quadraticCurveTo(-0.03, 0.15, 0, 0.15); 
rightBaseboardShape.lineTo(0, 0); 
