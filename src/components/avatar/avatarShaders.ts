import { neuralLineFragment } from '../canvas/neuralGeometry';
import { avatarMorphGLSL } from './morphChannels';

// Styling in normalized surface coordinates, never a deformation of facial anatomy.
// Disabled in the isolated study; a future neutral GLB can use the same renderer.
const emergenceField = `
  uniform float uEmergence;
  uniform vec2 uFaceExtent;
  float featureWeight(vec3 p) {
    vec2 uv = p.xy / max(uFaceExtent, vec2(.001));
    float nose = exp(-dot((uv - vec2(0.0, .06)) / vec2(.17, .38), (uv - vec2(0.0, .06)) / vec2(.17, .38)));
    vec2 eyes = (vec2(abs(uv.x), uv.y) - vec2(.48, .38)) / vec2(.25, .115);
    vec2 brows = (vec2(abs(uv.x), uv.y) - vec2(.46, .51)) / vec2(.29, .10);
    vec2 mouth = (uv - vec2(0.0, -.44)) / vec2(.45, .10);
    return clamp(max(nose, max(exp(-dot(eyes, eyes)), max(exp(-dot(brows, brows)), exp(-dot(mouth, mouth))))), 0.0, 1.0);
  }
  float reconstructionWeight(vec3 p) {
    vec2 uv = p.xy / max(uFaceExtent, vec2(.001));
    // Keep the facial plane continuous; fragmentation belongs to the silhouette.
    float interior = 1.0 - smoothstep(.82, 1.14, length(uv * vec2(1.0, .87)));
    float patches = sin(uv.x * 13.0 + sin(uv.y * 7.0)) * sin(uv.y * 11.0 - p.z * 3.0);
    float fringe = smoothstep(.72, 1.1, length(uv * vec2(1.0, .87)));
    return max(featureWeight(p), interior * (1.0 - fringe * (.15 + .25 * smoothstep(-.55, .65, patches))));
  }
`;

export const avatarPointVertex = `
  ${avatarMorphGLSL}
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uAssembly;
  uniform float uIntensity;
  attribute float aSeed;
  attribute float aAnchor;
  varying vec3 vColor;
  varying float vFacing;
  varying float vSeed;
  varying float vY;
  varying float vReconstruction;
  varying float vAnchor;
  ${emergenceField}
  void main() {
    vec3 facialPosition = avatarMorphPosition(position);
    float feature = featureWeight(position);
    vAnchor = aAnchor;
    vReconstruction = mix(1.0, reconstructionWeight(position), uEmergence);
    float angle = aSeed * 62.83;
    vec3 cloud = normalize(position + vec3(sin(angle), cos(angle * .7), sin(angle * .4))) * (1.35 + aSeed * .35);
    // The nose/eyes/lips settle first; the perimeter follows in broken clusters.
    float delay = (1.0 - feature) * .30 + aSeed * .12;
    float localAssembly = 1.0 - smoothstep(delay, .62 + delay, 1.0 - uAssembly);
    cloud *= mix(1.0, .55, uEmergence);
    vec3 assembled = mix(facialPosition, cloud, mix(uAssembly, localAssembly, uEmergence));
    float fringe = uEmergence * (1.0 - smoothstep(.12, .5, vReconstruction)) * (1.0 - uAssembly);
    assembled += vec3(sin(angle + uTime * .18), cos(angle * .7 + uTime * .12), sin(angle)) * fringe * .045;
    vec4 mv = modelViewMatrix * vec4(assembled, 1.0);
    vec3 viewNormal = normalize(normalMatrix * avatarMorphNormal(normal));
    vFacing = max(0.0, dot(viewNormal, normalize(-mv.xyz)));
    float light = max(0.0, dot(viewNormal, normalize(vec3(-.6, .8, 1.3))));
    vec3 tint = mix(color, mix(vec3(.08, .32, .70), vec3(.22, .86, .95), feature), uEmergence * .35);
    vColor = tint * mix(.48 + .70 * light, .65 + .65 * light, uEmergence); vSeed = aSeed; vY = position.y;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(mix(2.1 + aSeed * 1.4, 1.25 + aSeed * .5 + aAnchor * .45, uEmergence) * uPixelRatio * sqrt(uIntensity) * (7.0 / -mv.z), mix(1.2, 1.0, uEmergence), 6.0);
  }
`;
export const avatarPointFragment = `
  uniform float uTime;
  uniform float uReveal;
  uniform float uIntensity;
  uniform float uEmergence;
  varying vec3 vColor;
  varying float vFacing;
  varying float vSeed;
  varying float vY;
  varying float vReconstruction;
  varying float vAnchor;
  void main() {
    float d = length(gl_PointCoord - .5) * 2.0;
    if (d > 1.0) discard;
    float dotCore = exp(-d * d * 5.0);
    float breath = .90 + .10 * sin(uTime * .65 + vY * 1.8);
    float signal = pow(max(0.0, sin(vSeed * 93.0 + uTime * .28)), 24.0);
    float opacity = mix(.035 + .78 * pow(vFacing, 1.3), (.08 + .85 * pow(vFacing, .85)) * mix(.18, 1.0, vAnchor), uEmergence) * breath;
    float arrival = smoothstep(vSeed * .16, .84 + vSeed * .16, uReveal);
    float coverage = mix(1.0, smoothstep(vSeed - .06, vSeed + .06, .35 + vReconstruction * .72), uEmergence);
    float structure = mix(1.0, .35 + vReconstruction * .65, uEmergence);
    gl_FragColor = vec4(vColor * (1.0 + signal * .35) * uIntensity, dotCore * opacity * arrival * coverage * structure);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
export const avatarShellVertex = `
  ${avatarMorphGLSL}
  varying vec3 vNormal;
  varying vec3 vView;
  varying vec3 vPosition;
  void main() {
    vec3 facialPosition = avatarMorphPosition(position);
    vec4 mv = modelViewMatrix * vec4(facialPosition, 1.0);
    vNormal = normalize(normalMatrix * avatarMorphNormal(normal));
    vView = -mv.xyz; vPosition = facialPosition;
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
  ${emergenceField}
  void main() {
    vec3 n = normalize(vNormal);
    float facing = abs(dot(n, normalize(vView)));
    float edge = pow(1.0 - facing, 3.0);
    float light = max(0.0, dot(n, normalize(vec3(-.7, .9, 1.2))));
    float scan = pow(.5 + .5 * sin(vPosition.y * 150.0), 12.0);
    vec3 tint = mix(vec3(.025, .055, .12), vec3(.20, .58, .67), light);
    tint += edge * vec3(.15, .35, .45);
    tint = mix(tint, mix(vec3(.008, .025, .04), vec3(.025, .16, .20), light) + edge * vec3(.02, .09, .12), uEmergence);
    float structure = mix(1.0, pow(reconstructionWeight(vPosition), 2.0), uEmergence);
    gl_FragColor = vec4(tint, (.08 + light * .14 + edge * .16 + scan * .018) * uReveal * uSurfaceOpacity * structure);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
// Pathways remain registered to the surface: illumination moves, the face does not.
export const avatarLineVertex = `
  ${avatarMorphGLSL}
  attribute float aProgress;
  attribute float aPhase;
  varying float vProgress;
  varying float vPhase;
  varying float vDepth;
  varying float vStructure;
  ${emergenceField}
  void main() {
    vStructure = mix(1.0, reconstructionWeight(position), uEmergence);
    vProgress = aProgress; vPhase = aPhase;
    vec4 mv = modelViewMatrix * vec4(avatarMorphPosition(position), 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

// Reuse the existing electrical pulse shader, fading the entire pathway including pulses.
export const avatarLineFragment = neuralLineFragment
  .replace('uniform float uTime;', 'uniform float uTime;\n  uniform float uReveal;\n  varying float vStructure;')
  .replace('(uOpacity + energy * .65) * fog', '(uOpacity + energy * .65) * fog * uReveal * vStructure * vStructure');
