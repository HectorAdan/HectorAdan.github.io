import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SectorId } from '../../types/portfolio';
import { SECTORS } from '../../data/portfolioData';

interface NodeData {
  id: number;
  position: THREE.Vector3;
  size: number;
  sector?: SectorId;
  color: THREE.Color;
  connections: number[];
  pulseOffset: number;
  isCore?: boolean;
}

interface NeuralNetworkProps {
  activeSector: SectorId;
  onSelectSector: (sector: SectorId) => void;
  reducedMotion?: boolean;
}

export function NeuralNetwork({ activeSector, onSelectSector, reducedMotion = false }: NeuralNetworkProps) {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const { nodes, fineLinePositions, arterialLinePositions, pulseSpheres } = useMemo(() => {
    const nodeList: NodeData[] = [];
    let idCounter = 0;

    const sectorPositions: Record<SectorId, THREE.Vector3> = {
      home: new THREE.Vector3(0, 0, 0),
      about: new THREE.Vector3(...SECTORS.about.position),
      projects: new THREE.Vector3(...SECTORS.projects.position),
      experience: new THREE.Vector3(...SECTORS.experience.position),
      contact: new THREE.Vector3(...SECTORS.contact.position),
    };

    // 1. Central Core Nodes around the Avatar
    for (let i = 0; i < 26; i++) {
      const radius = 1.35 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.85;
      const pos = new THREE.Vector3(
        radius * Math.cos(phi) * Math.cos(theta),
        radius * Math.sin(phi),
        radius * Math.cos(phi) * Math.sin(theta)
      );

      nodeList.push({
        id: idCounter++,
        position: pos,
        size: 0.05 + Math.random() * 0.07,
        sector: 'home',
        color: new THREE.Color('#00f0ff'),
        connections: [],
        pulseOffset: Math.random() * Math.PI * 2,
        isCore: true,
      });
    }

    // 2. Sector Clusters and Intermediary Relay Nodes
    const sectorKeys: SectorId[] = ['about', 'projects', 'experience', 'contact'];
    sectorKeys.forEach((sec) => {
      const secCenter = sectorPositions[sec];
      const secColor = new THREE.Color(SECTORS[sec].color);

      // Relay nodes along arterial pathways
      for (let step = 1; step <= 4; step++) {
        const ratio = step / 5;
        const relayPos = new THREE.Vector3().lerpVectors(sectorPositions.home, secCenter, ratio);
        relayPos.x += (Math.random() - 0.5) * 1.1;
        relayPos.y += (Math.random() - 0.5) * 1.1;
        relayPos.z += (Math.random() - 0.5) * 1.1;

        nodeList.push({
          id: idCounter++,
          position: relayPos,
          size: 0.065 + Math.random() * 0.05,
          sector: sec,
          color: secColor,
          connections: [],
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }

      // Clustered nodes around sector beacon
      for (let i = 0; i < 11; i++) {
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 2.4,
          (Math.random() - 0.5) * 2.2,
          (Math.random() - 0.5) * 2.2
        );
        const pos = secCenter.clone().add(offset);

        nodeList.push({
          id: idCounter++,
          position: pos,
          size: 0.07 + Math.random() * 0.08,
          sector: sec,
          color: secColor,
          connections: [],
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    });

    // 3. Connect nodes: Fine Synaptic Web
    const finePairs: [number, number][] = [];
    const maxFineDist = 3.2;

    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const d = nodeList[i].position.distanceTo(nodeList[j].position);
        if (d < maxFineDist) {
          finePairs.push([i, j]);
          nodeList[i].connections.push(j);
          nodeList[j].connections.push(i);
        }
      }
    }

    const finePos = new Float32Array(finePairs.length * 2 * 3);
    finePairs.forEach(([i, j], idx) => {
      const p1 = nodeList[i].position;
      const p2 = nodeList[j].position;
      finePos[idx * 6 + 0] = p1.x;
      finePos[idx * 6 + 1] = p1.y;
      finePos[idx * 6 + 2] = p1.z;
      finePos[idx * 6 + 3] = p2.x;
      finePos[idx * 6 + 4] = p2.y;
      finePos[idx * 6 + 5] = p2.z;
    });

    // 4. Major Arterial Conduits (Triple high-voltage lines between core and sector centers)
    const arterialPairsCount = sectorKeys.length * 3;
    const arterialPos = new Float32Array(arterialPairsCount * 2 * 3);
    let artIdx = 0;

    sectorKeys.forEach((sec) => {
      const start = sectorPositions.home;
      const end = sectorPositions[sec];

      [-0.12, 0, 0.12].forEach((offsetY) => {
        arterialPos[artIdx * 6 + 0] = start.x;
        arterialPos[artIdx * 6 + 1] = start.y + offsetY;
        arterialPos[artIdx * 6 + 2] = start.z;
        arterialPos[artIdx * 6 + 3] = end.x;
        arterialPos[artIdx * 6 + 4] = end.y + offsetY;
        arterialPos[artIdx * 6 + 5] = end.z;
        artIdx++;
      });
    });

    // 5. Traveling Photon Pulses along synapses
    const pulseCount = 36;
    const pulses = Array.from({ length: pulseCount }, (_, i) => ({
      id: i,
      pairIdx: i % finePairs.length,
      speed: 0.4 + Math.random() * 0.6,
      progress: Math.random(),
      startNode: finePairs[i % finePairs.length][0],
      endNode: finePairs[i % finePairs.length][1],
    }));

    return {
      nodes: nodeList,
      fineLinePositions: finePos,
      arterialLinePositions: arterialPos,
      pulseSpheres: pulses,
    };
  }, []);

  const pulseGroupRef = useRef<THREE.Group>(null);
  const nodesGroupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;

    // Animate traveling photon data pulses
    if (pulseGroupRef.current) {
      pulseGroupRef.current.children.forEach((child, idx) => {
        const pulse = pulseSpheres[idx];
        if (!pulse) return;

        pulse.progress = (pulse.progress + delta * pulse.speed * 0.4) % 1.0;
        const n1 = nodes[pulse.startNode];
        const n2 = nodes[pulse.endNode];

        if (n1 && n2) {
          child.position.lerpVectors(n1.position, n2.position, pulse.progress);
          const isActive = n1.sector === activeSector || n2.sector === activeSector;
          child.scale.setScalar(isActive ? 1.5 : 0.85);
        }
      });
    }

    // Gentle organic breathing of synaptic nodes
    if (nodesGroupRef.current) {
      nodesGroupRef.current.children.forEach((mesh, idx) => {
        const node = nodes[idx];
        if (!node) return;

        const pulseScale = 1 + Math.sin(t * 2.0 + node.pulseOffset) * 0.18;
        const isHovered = hoveredNode === node.id;
        const isSectorActive = node.sector === activeSector;

        const scale = node.size * pulseScale * (isHovered ? 2.2 : isSectorActive ? 1.4 : 1.0);
        mesh.scale.setScalar(scale);
      });
    }
  });

  return (
    <group>
      {/* 1. Fine Micro-Synaptic Web (Delicate Ethereal Connections) */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[fineLinePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#0284c7"
          transparent
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* 2. Major Arterial Trunk Conduits (Highway Bundles) */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[arterialLinePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00f0ff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* 3. Luminous Traveling Photon Packets */}
      <group ref={pulseGroupRef}>
        {pulseSpheres.map((pulse) => (
          <mesh key={pulse.id}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* 4. Synaptic Nodes (Inner Emissive Core + Radial Halo) */}
      <group ref={nodesGroupRef}>
        {nodes.map((node) => {
          const isSectorActive = node.sector === activeSector;
          const isCore = Boolean(node.isCore);

          return (
            <mesh
              key={node.id}
              position={node.position}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredNode(node.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredNode(null);
                document.body.style.cursor = 'default';
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (node.sector && node.sector !== 'home') {
                  onSelectSector(node.sector);
                }
              }}
            >
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={isSectorActive ? 3.2 : isCore ? 2.4 : 1.4}
                roughness={0.15}
                metalness={0.85}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
