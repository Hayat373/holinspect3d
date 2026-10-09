
import { useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

type HandPoint = {
  x: number
  y: number
}

type HoloSceneProps = {
  handPoint: HandPoint | null
  gesture: string
}

type PartProps = {
  name: string
  position: [number, number, number]
  scale: [number, number, number]
  color: string
  selected: boolean
  onSelect: (name: string) => void
}

function Part({
  name,
  position,
  scale,
  color,
  selected,
  onSelect,
}: PartProps) {
  return (
    <mesh
      name={name}
      userData={{ partName: name }}
      position={position}
      scale={scale}
      onClick={(event) => {
        event.stopPropagation()
        onSelect(name)
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        color={selected ? '#ffffff' : color}
        wireframe={false}
      />
    </mesh>
  )
}

function InspectableObject({
  selectedPart,
  onSelect,
}: {
  selectedPart: string | null
  onSelect: (name: string) => void
}) {
  return (
    <group>
      <Part
        name="Main Body"
        position={[0, 0, 0]}
        scale={[2.5, 1.4, 1.5]}
        color="#8b5cf6"
        selected={selectedPart === 'Main Body'}
        onSelect={onSelect}
      />
      <Part
        name="Top Module"
        position={[0, 1.1, 0]}
        scale={[1.2, 0.6, 1.0]}
        color="#c084fc"
        selected={selectedPart === 'Top Module'}
        onSelect={onSelect}
      />
      <Part
        name="Left Module"
        position={[-1.6, 0, 0]}
        scale={[0.5, 1.0, 1.1]}
        color="#7c3aed"
        selected={selectedPart === 'Left Module'}
        onSelect={onSelect}
      />
      <Part
        name="Right Module"
        position={[1.6, 0, 0]}
        scale={[0.5, 1.0, 1.1]}
        color="#7c3aed"
        selected={selectedPart === 'Right Module'}
        onSelect={onSelect}
      />
      <Part
        name="Core"
        position={[0, 0, 0.85]}
        scale={[0.8, 0.8, 0.3]}
        color="#e9d5ff"
        selected={selectedPart === 'Core'}
        onSelect={onSelect}
      />
    </group>
  )
}

function HandSelector({
  handPoint,
  gesture,
  onSelect,
}: {
  handPoint: HandPoint | null
  gesture: string
  onSelect: (name: string) => void
}) {
  const { camera, scene } = useThree()

  useEffect(() => {
    if (!handPoint || gesture !== 'POINT') return

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(
      handPoint.x * 2 - 1,
      1 - handPoint.y * 2,
    )

    raycaster.setFromCamera(pointer, camera)

    const hits = raycaster.intersectObjects(
      scene.children,
      true,
    )

    const selectedHit = hits.find(
      (hit) => typeof hit.object.userData.partName === 'string',
    )

    if (selectedHit) {
      onSelect(selectedHit.object.userData.partName as string)
    }
  }, [handPoint, gesture, camera, scene, onSelect])

  return null
}

export default function HoloScene({
  handPoint,
  gesture,
}: HoloSceneProps) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null)

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#080512',
      }}
    >
      <Canvas
        camera={{
          position: [5, 3, 6],
          fov: 45,
        }}
      >
        <InspectableObject
          selectedPart={selectedPart}
          onSelect={setSelectedPart}
        />

        <HandSelector
          handPoint={handPoint}
          gesture={gesture}
          onSelect={setSelectedPart}
        />

        <OrbitControls makeDefault />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          color: '#f5f3ff',
          fontFamily: 'sans-serif',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 3,
            color: '#c084fc',
            marginBottom: 8,
          }}
        >
          HOLOINSPECT / 3D
        </div>

        <div style={{ fontSize: 22, fontWeight: 600 }}>
          Object Inspection
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: '#b8aecb',
          }}
        >
          Gesture: {gesture.replace('_', ' ')}
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: '#e9d5ff',
          }}
        >
          Selected: {selectedPart ?? 'None'}
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: '#827694',
          }}
        >
          POINT · Select component
        </div>
      </div>
    </div>
  )
}
