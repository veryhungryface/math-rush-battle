'use client';

import { OrbitControls, PerspectiveCamera, useGLTF, useTexture } from '@react-three/drei';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import {
  Component,
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import * as THREE from 'three';
import type { CellModel, Organelle } from './cell-data';
import styles from './cell-architecture-studio.module.css';

type Viewer3DProps = {
  cell: CellModel;
  crossSection: boolean;
  highlightedPartId: string | null;
  isolateMode: boolean;
  microscopeMode: boolean;
  onHoverPart: (partId: string | null) => void;
  onSelectPart: (partId: string | null) => void;
  resetSignal: number;
  selectedPartId: string | null;
};

type ViewerHandle = {
  getCanvas: () => HTMLCanvasElement | null;
};

type ClippedMaterialProps = {
  clippingPlanes?: THREE.Plane[];
  clipShadows: boolean;
};

function useClipping(crossSection: boolean) {
  return useMemo(() => {
    if (!crossSection) {
      return undefined;
    }
    return [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.12)];
  }, [crossSection]);
}

function CameraRig({ resetSignal }: { resetSignal: number }) {
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(3.45, 1.36, 4.55);
    camera.lookAt(0.1, -0.14, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0.1, -0.14, 0);
      controlsRef.current.update();
    }
  }, [camera, resetSignal]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      maxDistance={6.5}
      minDistance={1.7}
      rotateSpeed={0.58}
    />
  );
}

type TextureSet = NonNullable<CellModel['textures']>;

function NormalizedModel({
  sourceScene,
  textures
}: {
  sourceScene: THREE.Group;
  textures?: {
    baseColor?: THREE.Texture;
    normal?: THREE.Texture;
    roughness?: THREE.Texture;
  };
}) {
  const { center, scene, scale } = useMemo(() => {
    const clonedScene = sourceScene.clone(true);

    if (textures?.baseColor) {
      clonedScene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) {
          return;
        }

        mesh.material = new THREE.MeshStandardMaterial({
          color: '#ffffff',
          map: textures.baseColor,
          metalness: 0.02,
          normalMap: textures.normal,
          normalScale: new THREE.Vector2(0.36, 0.36),
          roughness: 0.52,
          roughnessMap: textures.roughness,
          side: THREE.DoubleSide
        });
      });
    }

    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    const modelCenter = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(modelCenter);

    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    return {
      center: modelCenter,
      scene: clonedScene,
      scale: 3.05 / maxDimension
    };
  }, [sourceScene, textures]);

  return (
    <group scale={scale} position={[-center.x * scale, -center.y * scale, -center.z * scale]}>
      <primitive object={scene} />
    </group>
  );
}

function TexturedGlbModel({ modelPath, textures }: { modelPath: string; textures: TextureSet }) {
  const gltf = useGLTF(modelPath);
  const [baseColor, normal, roughness] = useTexture([
    textures.baseColor,
    textures.normal ?? textures.baseColor,
    textures.roughness ?? textures.baseColor
  ]);

  useEffect(() => {
    baseColor.colorSpace = THREE.SRGBColorSpace;
    for (const texture of [baseColor, normal, roughness]) {
      texture.flipY = false;
      texture.needsUpdate = true;
    }
  }, [baseColor, normal, roughness]);

  return <NormalizedModel sourceScene={gltf.scene} textures={{ baseColor, normal, roughness }} />;
}

function PlainGlbModel({ modelPath }: { modelPath: string }) {
  const gltf = useGLTF(modelPath);
  return <NormalizedModel sourceScene={gltf.scene} />;
}

function GlbModel({ modelPath, textures }: { modelPath: string; textures?: TextureSet }) {
  if (textures) {
    return <TexturedGlbModel modelPath={modelPath} textures={textures} />;
  }
  return <PlainGlbModel modelPath={modelPath} />;
}

class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; resetKey: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps: { resetKey: string }) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: unknown) {
    console.warn('Failed to load GLB model. Falling back to procedural preview.', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function ModelSlot({
  fallback,
  modelPath,
  textures
}: {
  fallback: ReactNode;
  modelPath: string;
  textures?: TextureSet;
}) {
  const [assetAvailable, setAssetAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setAssetAvailable(false);

    fetch(modelPath, { method: 'HEAD' })
      .then((response) => {
        if (!cancelled) {
          setAssetAvailable(response.ok);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAssetAvailable(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [modelPath]);

  if (!assetAvailable) {
    return fallback;
  }

  return (
    <ModelErrorBoundary fallback={fallback} resetKey={modelPath}>
      <Suspense fallback={fallback}>
        <GlbModel modelPath={modelPath} textures={textures} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

function Envelope({
  cell,
  clippingPlanes,
  microscopeMode
}: {
  cell: CellModel;
  clippingPlanes?: THREE.Plane[];
  microscopeMode: boolean;
}) {
  const shellColor = microscopeMode ? '#d9fff1' : cell.shell;
  const materialProps: ClippedMaterialProps = {
    clippingPlanes,
    clipShadows: true
  };

  if (cell.shape === 'plant') {
    return (
      <group>
        <mesh scale={[3.4, 2.12, 1.15]}>
          <boxGeometry args={[1, 1, 1, 10, 10, 10]} />
          <meshPhysicalMaterial
            {...materialProps}
            color={shellColor}
            transparent
            opacity={0.1}
            roughness={0.38}
            metalness={0.03}
            transmission={0.12}
            thickness={0.25}
          />
        </mesh>
      </group>
    );
  }

  if (cell.shape === 'neuron') {
    return (
      <group>
        <mesh position={[-1.05, 0.05, 0]} scale={[0.82, 0.68, 0.55]}>
          <sphereGeometry args={[1, 48, 32]} />
          <meshPhysicalMaterial
            {...materialProps}
            color={shellColor}
            transparent
            opacity={0.18}
            roughness={0.42}
            transmission={0.08}
          />
        </mesh>
        <TubeMesh
          color={shellColor}
          clippingPlanes={clippingPlanes}
          opacity={0.22}
          points={[
            [-0.5, 0, 0],
            [0.25, 0.04, 0.05],
            [0.98, -0.02, -0.02],
            [1.72, 0.03, 0.02],
            [2.18, -0.03, 0]
          ]}
          radius={0.07}
        />
      </group>
    );
  }

  if (cell.shape === 'mitochondria') {
    return (
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.62, 1.74, 0.62]}>
        <capsuleGeometry args={[0.72, 1.46, 18, 42]} />
        <meshPhysicalMaterial
          {...materialProps}
          color={shellColor}
          transparent
          opacity={0.18}
          roughness={0.36}
          transmission={0.08}
        />
      </mesh>
    );
  }

  return (
    <mesh scale={cell.shape === 'immune' ? [1.68, 1.5, 1.28] : [1.48, 1.32, 1.12]}>
      <sphereGeometry args={[1, 64, 40]} />
      <meshPhysicalMaterial
        {...materialProps}
        color={shellColor}
        transparent
        opacity={0.16}
        roughness={0.35}
        metalness={0.02}
        transmission={0.1}
        thickness={0.22}
      />
    </mesh>
  );
}

function TubeMesh({
  clippingPlanes,
  color,
  opacity,
  points,
  radius
}: {
  clippingPlanes?: THREE.Plane[];
  color: string;
  opacity: number;
  points: Array<[number, number, number]>;
  radius: number;
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    return new THREE.TubeGeometry(curve, 80, radius, 18, false);
  }, [points, radius]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        clipShadows
        clippingPlanes={clippingPlanes}
        color={color}
        emissive={color}
        emissiveIntensity={0.08}
        roughness={0.42}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

function PartMaterial({
  active,
  clippingPlanes,
  color,
  hovered,
  muted,
  microscopeMode
}: {
  active: boolean;
  clippingPlanes?: THREE.Plane[];
  color: string;
  hovered: boolean;
  muted: boolean;
  microscopeMode: boolean;
}) {
  const displayColor = microscopeMode ? new THREE.Color(color).lerp(new THREE.Color('#eafff7'), 0.28) : color;

  return (
    <meshStandardMaterial
      clipShadows
      clippingPlanes={clippingPlanes}
      color={displayColor}
      emissive={displayColor}
      emissiveIntensity={active || hovered ? 0.24 : 0.07}
      metalness={0.05}
      opacity={muted ? 0.14 : 0.88}
      roughness={0.36}
      transparent
    />
  );
}

function Granules({
  active,
  clippingPlanes,
  color,
  hovered,
  muted,
  microscopeMode
}: {
  active: boolean;
  clippingPlanes?: THREE.Plane[];
  color: string;
  hovered: boolean;
  muted: boolean;
  microscopeMode: boolean;
}) {
  const offsets: Array<[number, number, number]> = [
    [-0.18, 0.14, 0.03],
    [0.04, 0.18, -0.08],
    [0.18, -0.02, 0.07],
    [-0.03, -0.16, -0.04],
    [0.28, 0.2, 0.12],
    [-0.28, -0.08, -0.1],
    [0.05, 0.0, 0.16]
  ];
  return (
    <group>
      {offsets.map((offset, index) => (
        <mesh key={`${offset.join(':')}-${index}`} position={offset} scale={0.12 + (index % 3) * 0.025}>
          <sphereGeometry args={[1, 20, 16]} />
          <PartMaterial
            active={active}
            clippingPlanes={clippingPlanes}
            color={color}
            hovered={hovered}
            muted={muted}
            microscopeMode={microscopeMode}
          />
        </mesh>
      ))}
    </group>
  );
}

function Stack({
  active,
  clippingPlanes,
  color,
  hovered,
  muted,
  microscopeMode
}: {
  active: boolean;
  clippingPlanes?: THREE.Plane[];
  color: string;
  hovered: boolean;
  muted: boolean;
  microscopeMode: boolean;
}) {
  return (
    <group>
      {[-0.24, -0.12, 0, 0.12, 0.24].map((y, index) => (
        <mesh key={y} position={[Math.sin(index) * 0.06, y, index * 0.012]} scale={[0.58 - index * 0.035, 0.045, 0.18]}>
          <sphereGeometry args={[1, 32, 12]} />
          <PartMaterial
            active={active}
            clippingPlanes={clippingPlanes}
            color={color}
            hovered={hovered}
            muted={muted}
            microscopeMode={microscopeMode}
          />
        </mesh>
      ))}
    </group>
  );
}

function Lobed({
  active,
  clippingPlanes,
  color,
  hovered,
  muted,
  microscopeMode
}: {
  active: boolean;
  clippingPlanes?: THREE.Plane[];
  color: string;
  hovered: boolean;
  muted: boolean;
  microscopeMode: boolean;
}) {
  const lobes: Array<[number, number, number, number]> = [
    [-0.24, 0.08, 0.03, 0.38],
    [0.12, 0.16, -0.04, 0.34],
    [0.28, -0.12, 0.02, 0.32],
    [-0.12, -0.18, -0.03, 0.3]
  ];
  return (
    <group>
      {lobes.map(([x, y, z, scale], index) => (
        <mesh key={`${x}-${y}-${index}`} position={[x, y, z]} scale={[scale, scale * 0.85, scale * 0.78]}>
          <sphereGeometry args={[1, 32, 20]} />
          <PartMaterial
            active={active}
            clippingPlanes={clippingPlanes}
            color={color}
            hovered={hovered}
            muted={muted}
            microscopeMode={microscopeMode}
          />
        </mesh>
      ))}
    </group>
  );
}

function CinematicPlantCell({
  cell,
  clippingPlanes,
  highlightedPartId,
  isolateMode,
  microscopeMode,
  onHoverPart,
  onSelectPart,
  selectedPartId
}: {
  cell: CellModel;
  clippingPlanes?: THREE.Plane[];
  highlightedPartId: string | null;
  isolateMode: boolean;
  microscopeMode: boolean;
  onHoverPart: (partId: string | null) => void;
  onSelectPart: (partId: string | null) => void;
  selectedPartId: string | null;
}) {
  const activePart = highlightedPartId ?? selectedPartId;

  function handlers(partId: string) {
    return {
      onClick: (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelectPart(partId);
      },
      onPointerOut: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onHoverPart(null);
      },
      onPointerOver: (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onHoverPart(partId);
      }
    };
  }

  function opacity(partId: string, base: number) {
    if (!isolateMode || selectedPartId === partId) {
      return base;
    }
    return base * 0.2;
  }

  return (
    <group rotation={[0.04, -0.42, -0.04]} position={[-0.18, -0.06, 0.06]} scale={1.08}>
      <mesh position={[0.45, 0.02, -0.04]} scale={[2.2, 1.34, 0.82]} {...handlers('cell-wall')}>
        <boxGeometry args={[1, 1, 1, 12, 12, 12]} />
        <meshPhysicalMaterial
          clipShadows
          clippingPlanes={clippingPlanes}
          color={microscopeMode ? '#1e473d' : '#153322'}
          metalness={0.02}
          opacity={opacity('cell-wall', 0.7)}
          roughness={0.44}
          transparent
        />
      </mesh>

      <mesh
        position={[-0.72, -0.18, 0.26]}
        rotation={[0.04, 0.04, Math.PI / 2]}
        scale={[1.18, 0.98, 0.62]}
        {...handlers('cell-wall')}
      >
        <capsuleGeometry args={[0.72, 3.25, 28, 72]} />
        <meshPhysicalMaterial
          clipShadows
          clippingPlanes={clippingPlanes}
          color={microscopeMode ? '#d4ffd5' : '#a8c96e'}
          emissive={microscopeMode ? '#aef4b5' : '#6c873b'}
          emissiveIntensity={activePart === 'cell-wall' ? 0.18 : 0.08}
          metalness={0.02}
          opacity={opacity('cell-wall', 0.86)}
          roughness={0.24}
          transparent
        />
      </mesh>

      <mesh position={[-0.06, -0.18, 0.74]} scale={[0.55, 0.74, 0.32]} {...handlers('central-vacuole')}>
        <sphereGeometry args={[1, 64, 42]} />
        <meshPhysicalMaterial
          clipShadows
          clippingPlanes={clippingPlanes}
          color={microscopeMode ? '#c8fffb' : '#7bc8d2'}
          emissive="#3aa7b3"
          emissiveIntensity={activePart === 'central-vacuole' ? 0.2 : 0.08}
          metalness={0.04}
          opacity={opacity('central-vacuole', 0.92)}
          roughness={0.2}
          transparent
        />
      </mesh>

      <mesh position={[-0.66, 0.18, 0.76]} scale={[0.14, 0.18, 0.08]} {...handlers('chloroplast-a')}>
        <sphereGeometry args={[1, 32, 20]} />
        <meshPhysicalMaterial
          clipShadows
          clippingPlanes={clippingPlanes}
          color="#bfe27b"
          emissive="#83b44b"
          emissiveIntensity={0.1}
          opacity={opacity('chloroplast-a', 0.82)}
          roughness={0.28}
          transparent
        />
      </mesh>

      <mesh position={[0.74, -0.68, 0.62]} scale={[0.32, 0.17, 0.12]} rotation={[0.12, 0.24, -0.28]} {...handlers('plant-mitochondria')}>
        <capsuleGeometry args={[0.48, 1.0, 18, 42]} />
        <meshPhysicalMaterial
          clipShadows
          clippingPlanes={clippingPlanes}
          color="#d9a759"
          emissive="#8a5f20"
          emissiveIntensity={0.1}
          opacity={opacity('plant-mitochondria', 0.88)}
          roughness={0.24}
          transparent
        />
      </mesh>
    </group>
  );
}

function OrganelleObject({
  clippingPlanes,
  highlightedPartId,
  isolateMode,
  microscopeMode,
  onHoverPart,
  onSelectPart,
  organelle,
  selectedPartId
}: {
  clippingPlanes?: THREE.Plane[];
  highlightedPartId: string | null;
  isolateMode: boolean;
  microscopeMode: boolean;
  onHoverPart: (partId: string | null) => void;
  onSelectPart: (partId: string | null) => void;
  organelle: Organelle;
  selectedPartId: string | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const active = selectedPartId === organelle.id;
  const hovered = highlightedPartId === organelle.id && !active;
  const muted = isolateMode && selectedPartId !== organelle.id;

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }
    const pulse = 1 + Math.sin(clock.elapsedTime * (1.4 + organelle.emphasis)) * 0.02 * organelle.emphasis;
    const highlight = active || hovered ? 1.12 : 1;
    groupRef.current.scale.set(
      organelle.scale[0] * pulse * highlight,
      organelle.scale[1] * pulse * highlight,
      organelle.scale[2] * pulse * highlight
    );
    groupRef.current.rotation.y += 0.0025 + organelle.emphasis * 0.0008;
  });

  const eventHandlers = {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onSelectPart(organelle.id);
    },
    onPointerOut: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      onHoverPart(null);
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      onHoverPart(organelle.id);
    }
  };

  return (
    <group ref={groupRef} position={organelle.position} {...eventHandlers}>
      {organelle.shape === 'sphere' ? (
        <mesh>
          <sphereGeometry args={[1, 48, 32]} />
          <PartMaterial
            active={active}
            clippingPlanes={clippingPlanes}
            color={organelle.color}
            hovered={hovered}
            muted={muted}
            microscopeMode={microscopeMode}
          />
        </mesh>
      ) : null}

      {organelle.shape === 'capsule' ? (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.55, 1.4, 18, 36]} />
          <PartMaterial
            active={active}
            clippingPlanes={clippingPlanes}
            color={organelle.color}
            hovered={hovered}
            muted={muted}
            microscopeMode={microscopeMode}
          />
        </mesh>
      ) : null}

      {organelle.shape === 'rod' ? (
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 1.8, 24]} />
          <PartMaterial
            active={active}
            clippingPlanes={clippingPlanes}
            color={organelle.color}
            hovered={hovered}
            muted={muted}
            microscopeMode={microscopeMode}
          />
        </mesh>
      ) : null}

      {organelle.shape === 'torus' ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.08, 18, 80]} />
          <PartMaterial
            active={active}
            clippingPlanes={clippingPlanes}
            color={organelle.color}
            hovered={hovered}
            muted={muted}
            microscopeMode={microscopeMode}
          />
        </mesh>
      ) : null}

      {organelle.shape === 'stack' ? (
        <Stack
          active={active}
          clippingPlanes={clippingPlanes}
          color={organelle.color}
          hovered={hovered}
          muted={muted}
          microscopeMode={microscopeMode}
        />
      ) : null}

      {organelle.shape === 'granules' ? (
        <Granules
          active={active}
          clippingPlanes={clippingPlanes}
          color={organelle.color}
          hovered={hovered}
          muted={muted}
          microscopeMode={microscopeMode}
        />
      ) : null}

      {organelle.shape === 'lobed' ? (
        <Lobed
          active={active}
          clippingPlanes={clippingPlanes}
          color={organelle.color}
          hovered={hovered}
          muted={muted}
          microscopeMode={microscopeMode}
        />
      ) : null}

      {organelle.shape === 'axon' ? (
        <TubeMesh
          clippingPlanes={clippingPlanes}
          color={organelle.color}
          opacity={muted ? 0.16 : 0.88}
          points={[
            [-1.25, 0, 0],
            [-0.58, 0.18, 0.1],
            [0, -0.1, -0.04],
            [0.62, 0.12, 0.08],
            [1.22, -0.04, -0.02]
          ]}
          radius={active || hovered ? 0.075 : 0.055}
        />
      ) : null}
    </group>
  );
}

function Scene({
  cell,
  crossSection,
  highlightedPartId,
  isolateMode,
  microscopeMode,
  onHoverPart,
  onSelectPart,
  resetSignal,
  selectedPartId
}: Viewer3DProps) {
  const clippingPlanes = useClipping(crossSection);
  const proceduralModel =
    cell.shape === 'plant' ? (
      <CinematicPlantCell
        cell={cell}
        clippingPlanes={clippingPlanes}
        highlightedPartId={highlightedPartId}
        isolateMode={isolateMode}
        microscopeMode={microscopeMode}
        onHoverPart={onHoverPart}
        onSelectPart={onSelectPart}
        selectedPartId={selectedPartId}
      />
    ) : (
      <>
        <Envelope cell={cell} clippingPlanes={clippingPlanes} microscopeMode={microscopeMode} />
        {cell.organelles.map((organelle) => (
          <OrganelleObject
            clippingPlanes={clippingPlanes}
            highlightedPartId={highlightedPartId}
            isolateMode={isolateMode}
            key={organelle.id}
            microscopeMode={microscopeMode}
            onHoverPart={onHoverPart}
            onSelectPart={onSelectPart}
            organelle={organelle}
            selectedPartId={selectedPartId}
          />
        ))}
      </>
    );

  return (
    <>
      <color attach="background" args={[microscopeMode ? '#edf5ec' : '#fbf2df']} />
      <fog attach="fog" args={[microscopeMode ? '#edf5ec' : '#fbf2df', 6.4, 12.8]} />
      <PerspectiveCamera makeDefault fov={34} position={[3.45, 1.36, 4.55]} />
      <CameraRig resetSignal={resetSignal} />
      <ambientLight intensity={microscopeMode ? 1.35 : 1.18} />
      <directionalLight color="#fff8df" intensity={2.9} position={[-2.4, 4.5, 3.3]} />
      <pointLight color={cell.accent} intensity={2.2} position={[-2.4, 0.7, 1.9]} />
      <pointLight color="#86d9cf" intensity={1.4} position={[2.8, -1.2, 2.3]} />
      <pointLight color="#ffd79b" intensity={1.2} position={[0, 2.2, -1.4]} />

      <group onClick={() => onSelectPart(null)}>
        <group scale={1.36} rotation={[0.02, 0.18, -0.04]} position={[-0.08, -0.08, 0]}>
          {cell.modelPath ? (
            <ModelSlot fallback={proceduralModel} modelPath={cell.modelPath} textures={cell.textures} />
          ) : (
            proceduralModel
          )}
        </group>
      </group>

      <mesh position={[0.18, -2.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.55, 128]} />
        <meshBasicMaterial color={microscopeMode ? '#9fc8ad' : cell.accent} transparent opacity={0.1} />
      </mesh>
    </>
  );
}

const Viewer3D = forwardRef<ViewerHandle, Viewer3DProps>(function Viewer3D(props, ref) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      getCanvas: () => wrapperRef.current?.querySelector('canvas') ?? null
    }),
    []
  );

  return (
    <div
      className={`${styles.canvasWrap} ${props.microscopeMode ? styles.canvasWrapMicroscope : ''}`}
      ref={wrapperRef}
      style={{ '--cell-accent': props.cell.accent } as React.CSSProperties}
    >
      <Canvas
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: false, localClippingEnabled: props.crossSection, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          gl.setClearColor(new THREE.Color(props.microscopeMode ? '#edf5ec' : '#fbf2df'), 1);
        }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
});

export default Viewer3D;
