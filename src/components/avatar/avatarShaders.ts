import { neuralLineFragment } from '../canvas/neuralGeometry';

export const avatarPointVertex = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uAssembly;
  uniform float uIntensity;
  attribute float aSeed;
  varying vec3 vColor;
  varying float vFacing;
  varying float vSeed;
  varying float vY;
  void main() {
    float angle = aSeed * 62.83;
    vec3 cloud = normalize(position + vec3(sin(angle), cos(angle * .7), sin(angle * .4))) * (1.35 + aSeed * .35);
    vec3 assembled = mix(position, cloud, uAssembly);
    vec4 mv = modelViewMatrix * vec4(assembled, 1.0);
    vec3 viewNormal = normalize(normalMatrix * normal);
    vFacing = max(0.0, dot(viewNormal, normalize(-mv.xyz)));
    float light = max(0.0, dot(viewNormal, normalize(vec3(-.6, .8, 1.3))));
    vColor = color * (.48 + .70 * light); vSeed = aSeed; vY = position.y;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((2.1 + aSeed * 1.4) * uPixelRatio * sqrt(uIntensity) * (7.0 / -mv.z), 1.2, 6.0);
  }
`;
export const avatarPointFragment = `
  uniform float uTime;
  uniform float uReveal;
  uniform float uIntensity;
  varying vec3 vColor;
  varying float vFacing;
  varying float vSeed;
  varying float vY;
  void main() {
    float d = length(gl_PointCoord - .5) * 2.0;
    if (d > 1.0) discard;
    float dotCore = exp(-d * d * 5.0);
    float breath = .90 + .10 * sin(uTime * .65 + vY * 1.8);
    float signal = pow(max(0.0, sin(vSeed * 93.0 + uTime * .28)), 24.0);
    float opacity = (.035 + .78 * pow(vFacing, 1.3)) * breath;
    float arrival = smoothstep(vSeed * .16, .84 + vSeed * .16, uReveal);
    gl_FragColor = vec4(vColor * (1.0 + signal * .35) * uIntensity, dotCore * opacity * arrival);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
export const avatarShellVertex = `
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPosition;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = -mv.xyz; vPosition = position;
    gl_Position = projectionMatrix * mv;
  }
`;
export const avatarShellFragment = `
  uniform float uTime;
  uniform float uReveal;
  uniform float uSurfaceOpacity;
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPosition;
  void main() {
    vec3 n = normalize(vNormal);
    float facing = abs(dot(n, normalize(vView)));
    float edge = pow(1.0 - facing, 3.0);
    float light = max(0.0, dot(n, normalize(vec3(-.7, .9, 1.2))));
    float scan = pow(.5 + .5 * sin(vPosition.y * 150.0), 12.0);
    vec3 tint = mix(vec3(.025, .055, .12), vec3(.20, .58, .67), light);
    tint += edge * vec3(.15, .35, .45);
    gl_FragColor = vec4(tint, (.08 + light * .14 + edge * .16 + scan * .018) * uReveal * uSurfaceOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
// Pathways remain registered to the surface: illumination moves, the face does not.
export const avatarLineVertex = `
  attribute float aProgress;
  attribute float aPhase;
  varying float vProgress;
  varying float vPhase;
  varying float vDepth;
  void main() {
    vProgress = aProgress; vPhase = aPhase;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

// Reuse the existing electrical pulse shader, fading the entire pathway including pulses.
export const avatarLineFragment = neuralLineFragment
  .replace('uniform float uTime;', 'uniform float uTime;\n  uniform float uReveal;')
  .replace('(uOpacity + energy * .65) * fog', '(uOpacity + energy * .65) * fog * uReveal');
