// Add a channel here when the source GLB gains another useful blendshape.
// The loader, sampler and shader declarations share this mapping.
export const MORPH_CHANNELS = [
  { name: 'jawOpen', position: 'aJawDelta', normal: 'aJawNormalDelta' },
  { name: 'eyeBlinkLeft', position: 'aBlinkLeftDelta', normal: 'aBlinkLeftNormalDelta' },
  { name: 'eyeBlinkRight', position: 'aBlinkRightDelta', normal: 'aBlinkRightNormalDelta' },
] as const;

export interface AvatarMorphPose { current: Record<string, number> }

export const avatarMorphGLSL = `
  #ifdef AVATAR_MORPHS
  uniform float uMorphWeights[${MORPH_CHANNELS.length}];
  ${MORPH_CHANNELS.map(c => `attribute vec3 ${c.position}; attribute vec3 ${c.normal};`).join('\n')}
  vec3 avatarMorphPosition(vec3 p) {
    return p ${MORPH_CHANNELS.map((c, i) => `+ ${c.position} * uMorphWeights[${i}]`).join(' ')};
  }
  vec3 avatarMorphNormal(vec3 n) {
    return normalize(n ${MORPH_CHANNELS.map((c, i) => `+ ${c.normal} * uMorphWeights[${i}]`).join(' ')});
  }
  #else
  vec3 avatarMorphPosition(vec3 p) { return p; }
  vec3 avatarMorphNormal(vec3 n) { return n; }
  #endif
`;
