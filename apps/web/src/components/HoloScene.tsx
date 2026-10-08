import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useState } from 'react'

type PartProps = {
  name: string
  position: [number, number, number]
  scale: [number, number, number]
  color: string
  selected: boolean
  onSelect: () => void
}

function Part({
  position,
  scale,
  color,
  selected,
  onSelect,
}: PartProps) {
  return (
    <mesh
      position={position}
      scale={scale}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
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

function InspectableObject() {
  const [selectedPart, setSelectedPart] = useState<string | null>(null)

  return (
    <group>
      {/* Main body */}
      <Part
        name="Main Body"
        position={[0, 0, 0]}
        scale={[2.5, 1.4, 1.5]}
        color="#8b5cf6"
        selected={selectedPart === 'Main Body'}
        onSelect={() => setSelectedPart('Main Body')}
      />

      {/* Top module */}
      <Part
        name="Top Module"
        position={[0, 1.1, 0]}
        scale={[1.2, 0.6, 1.0]}
        color="#a855f7"
        selected={selectedPart === 'Top Module'}
        onSelect={() => setSelectedPart('Top Module')}
      />

      {/* Left module */}
      <Part
        name="Left Module"
        position={[-1.6, 0, 0]}
        scale={[0.5, 1.0, 1.1]}
        color="#7c3aed"
        selected={selectedPart === 'Left Module'}
        onSelect={() => setSelectedPart('Left Module')}
      />

      {/* Right module */}
      <Part
        name="Right Module"
        position={[1.6, 0, 0]}
        scale={[0.5, 1.0, 1.1]}
        color="#7c3aed"
        selected={selectedPart === 'Right Module'}
        onSelect={() => setSelectedPart('Right Module')}
      />

      {/* Core */}
      <Part
        name="Core"
        position={[0, 0, 0.85]}
        scale={[0.8, 0.8, 0.3]}
        color="#c084fc"
        selected={selectedPart === 'Core'}
        onSelect={() => setSelectedPart('Core')}
      />
    </group>
  )
}

export default function HoloScene() {
  return (
    <div
      style={{
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
        <InspectableObject />

        <OrbitControls />
      </Canvas>
    </div>
  )
}