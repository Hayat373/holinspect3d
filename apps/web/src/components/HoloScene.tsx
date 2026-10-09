
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
} from '@react-three/drei'
import * as THREE from 'three'

type GestureName =
  | 'POINT'
  | 'PINCH'
  | 'ROTATE'
  | 'OPEN_PALM'
  | 'FIST'
  | 'UNKNOWN'

type HandPoint = { x: number; y: number } | null

type HoloSceneProps = {
  handPoint: HandPoint
  gesture: GestureName
}

type MeshEntry = {
  mesh: THREE.Mesh
  originalPosition: THREE.Vector3
  explodedPosition: THREE.Vector3
}

const MODEL_OPTIONS = [
  { name: 'Mechanical chassis', path: '/models/mechanical-chassis.glb' },
  { name: 'Inspection drone', path: '/models/inspection-drone.glb' },
]

const gestureInfo: Record<
  GestureName,
  { title: string; detail: string }
> = {
  ROTATE: { title: 'Two fingers', detail: 'Rotate model' },
  PINCH: { title: 'Pinch', detail: 'Move to zoom' },
  POINT: { title: 'Point', detail: 'Select component' },
  FIST: { title: 'Fist', detail: 'Exploded view' },
  OPEN_PALM: { title: 'Open palm', detail: 'Reassemble model' },
  UNKNOWN: { title: 'Waiting for gesture', detail: 'Show your hand to the camera' },
}

function Icon({
  name,
  size = 20,
}: {
  name: 'cube' | 'search' | 'chart' | 'settings' | 'hand' | 'scan' | 'layers' | 'rotate'
  size?: number
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'cube':
      return (
        <svg {...common}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4.5 4.5" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 20V11M10 20V5M16 20v-7M22 20H2" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="m19.4 15 .1.1 1.2 1-1.5 2.6-1.5-.5a8 8 0 0 1-1.8 1l-.3 1.6h-3l-.3-1.6a8 8 0 0 1-1.8-1l-1.5.5-1.5-2.6 1.2-1a7 7 0 0 1 0-2l-1.2-1 1.5-2.6 1.5.5a8 8 0 0 1 1.8-1l.3-1.6h3l.3 1.6a8 8 0 0 1 1.8 1l1.5-.5 1.5 2.6-1.2 1a7 7 0 0 1 0 1.9Z" />
        </svg>
      )
    case 'hand':
      return (
        <svg {...common}>
          <path d="M8 12V5a1.5 1.5 0 0 1 3 0v5-7a1.5 1.5 0 0 1 3 0v7-5a1.5 1.5 0 0 1 3 0v7-3a1.5 1.5 0 0 1 3 0v6c0 4-2.5 6.5-6.5 6.5h-1c-2 0-3.3-.9-4.4-2.3L5 15.5a1.8 1.8 0 0 1 2.6-2.5L8 13.5" />
        </svg>
      )
    case 'scan':
      return (
        <svg {...common}>
          <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
          <circle cx="12" cy="12" r="3.5" />
        </svg>
      )
    case 'layers':
      return (
        <svg {...common}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
        </svg>
      )
    case 'rotate':
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14-5L4 8" />
          <path d="M4 4v4h4M4 13a8 8 0 0 0 14 5l2-2" />
          <path d="M20 20v-4h-4" />
        </svg>
      )
  }
}

function StatusDot({ active = true }: { active?: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        active ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-white/25'
      }`}
    />
  )
}

function ImportedModel({
  modelPath,
  handPoint,
  gesture,
  exploded,
  onSelect,
  onInfo,
}: {
  modelPath: string
  handPoint: HandPoint
  gesture: GestureName
  exploded: boolean
  onSelect: (mesh: THREE.Mesh) => void
  onInfo: (info: {
    name: string
    type: string
    material: string
    vertices: number
    dimensions: string
    parts: number
  }) => void
}) {
  const { scene } = useGLTF(modelPath)
  const { camera, controls } = useThree()

  const model = useMemo(() => {
    const clone = scene.clone(true)

    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return

      if (Array.isArray(object.material)) {
        object.material = object.material.map((material) => material.clone())
      } else {
        object.material = object.material.clone()
      }

      object.castShadow = true
      object.receiveShadow = true
    })

    return clone
  }, [scene])

  const raycaster = useRef(new THREE.Raycaster())
  const pointer = useRef(new THREE.Vector2())
  const previousPoint = useRef<HandPoint>(null)
  const meshEntries = useRef<MeshEntry[]>([])
  const selectedMesh = useRef<THREE.Mesh | null>(null)
  const cameraTarget = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  useEffect(() => {
    const meshes: THREE.Mesh[] = []
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) meshes.push(object)
    })

    model.updateMatrixWorld(true)
    const sourceBounds = new THREE.Box3().setFromObject(model)
    const sourceSize = sourceBounds.getSize(new THREE.Vector3())
    const sourceCenter = sourceBounds.getCenter(new THREE.Vector3())
    const fitScale = 5.2 / Math.max(sourceSize.x, sourceSize.y, sourceSize.z, 0.001)
    model.scale.setScalar(fitScale)
    model.position.copy(sourceCenter).multiplyScalar(-fitScale)
    model.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(model)
    const center = bounds.getCenter(new THREE.Vector3())

    meshEntries.current = meshes.map((mesh, index) => {
      const originalPosition = mesh.position.clone()
      const meshCenter = mesh.getWorldPosition(new THREE.Vector3())
      const direction = meshCenter.sub(center)

      if (direction.lengthSq() < 0.001) {
        direction.set(
          Math.sin(index * 2.4),
          Math.cos(index * 1.7),
          Math.sin(index * 3.1),
        )
      }

      direction.normalize()

      return {
        mesh,
        originalPosition,
        explodedPosition: originalPosition
          .clone()
          .add(direction.multiplyScalar(0.45 + (index % 4) * 0.14)),
      }
    })

    onInfo({
      name: model.name || 'Mechanical assembly',
      type: '3D model',
      material: 'Multiple',
      vertices: meshes.reduce(
        (total, mesh) =>
          total + (mesh.geometry.getAttribute('position')?.count ?? 0),
        0,
      ),
      dimensions: `${sourceSize.x.toFixed(2)} × ${sourceSize.y.toFixed(2)} × ${sourceSize.z.toFixed(2)}`,
      parts: meshes.length,
    })
  }, [camera, cameraTarget, model, onInfo])

  useEffect(() => {
    if (!handPoint) {
      previousPoint.current = null
      return
    }

    const previous = previousPoint.current

    if (previous && gesture === 'ROTATE') {
      model.rotation.y += (handPoint.x - previous.x) * 4
      model.rotation.x += (handPoint.y - previous.y) * 2
      model.rotation.x = THREE.MathUtils.clamp(
        model.rotation.x,
        -Math.PI / 3,
        Math.PI / 3,
      )
    }

    if (previous && gesture === 'PINCH') {
      const deltaY = handPoint.y - previous.y
      const orbitControls = controls as unknown as {
        dollyIn?: (scale: number) => void
        dollyOut?: (scale: number) => void
        update?: () => void
      } | null
      if (Math.abs(deltaY) > 0.001 && orbitControls) {
        const scale = Math.exp(Math.min(Math.abs(deltaY) * 2.8, 0.12))
        if (deltaY > 0) orbitControls.dollyOut?.(scale)
        else orbitControls.dollyIn?.(scale)
        orbitControls.update?.()
      }
    }

    if (gesture === 'POINT') {
      pointer.current.set(handPoint.x * 2 - 1, 1 - handPoint.y * 2)
      model.updateMatrixWorld(true)
      raycaster.current.setFromCamera(pointer.current, camera)

      const hits = raycaster.current.intersectObject(model, true)
      const hit = hits.find(
        (item) => item.object instanceof THREE.Mesh,
      )

      if (hit && hit.object instanceof THREE.Mesh) {
        selectedMesh.current = hit.object
        onSelect(hit.object)
      }
    }

    previousPoint.current = handPoint
  }, [camera, cameraTarget, controls, gesture, handPoint, model, onSelect])

  useFrame((_, delta) => {
    const alpha = Math.min(delta * 4, 1)

    for (const entry of meshEntries.current) {
      entry.mesh.position.lerp(
        exploded ? entry.explodedPosition : entry.originalPosition,
        alpha,
      )
    }

    model.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material]

      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial) {
          const isSelected = object === selectedMesh.current
          material.emissive.set(isSelected ? '#7c3aed' : '#000000')
          material.emissiveIntensity = isSelected ? 0.65 : 0
        }
      }
    })
  })

  return <primitive object={model} />
}

function Scene({
  modelPath,
  handPoint,
  gesture,
  exploded,
  onSelect,
  onInfo,
}: {
  modelPath: string
  handPoint: HandPoint
  gesture: GestureName
  exploded: boolean
  onSelect: (mesh: THREE.Mesh) => void
  onInfo: (info: {
    name: string
    type: string
    material: string
    vertices: number
    dimensions: string
    parts: number
  }) => void
}) {
  return (
    <>
      <color attach="background" args={['#080611']} />
      <fog attach="fog" args={['#080611', 13, 28]} />

      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#c4b5fd', '#171027', 1.1]} />
      <directionalLight position={[5, 8, 6]} intensity={2.3} />
      <pointLight position={[-5, 3, -4]} color="#8b5cf6" intensity={16} />
      <pointLight position={[4, 1, 3]} color="#22d3ee" intensity={7} />

      <group position={[0, -0.15, 0]}>
        <ImportedModel
          modelPath={modelPath}
          handPoint={handPoint}
          gesture={gesture}
          exploded={exploded}
          onSelect={onSelect}
          onInfo={onInfo}
        />
      </group>

      <gridHelper
        args={[30, 60, '#54358b', '#211838']}
        position={[0, -1.45, 0]}
      />

      <ContactShadows
        position={[0, -1.4, 0]}
        opacity={0.5}
        scale={12}
        blur={2.5}
        far={4}
      />

      <Environment preset="warehouse" />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={2.5}
        maxDistance={12}
        target={[0, 0, 0]}
      />
    </>
  )
}

export default function HoloScene({
  handPoint,
  gesture,
}: HoloSceneProps) {
  const [selectedPart, setSelectedPart] = useState<THREE.Mesh | null>(null)
  const [exploded, setExploded] = useState(false)
  const [objectInfo, setObjectInfo] = useState({
    name: '—',
    type: '—',
    material: '—',
    vertices: 0,
    dimensions: '—',
    parts: 0,
  })
  const [activeTab, setActiveTab] = useState('VISUALIZE')
  const [modelPath, setModelPath] = useState(MODEL_OPTIONS[0].path)
  const [customModelName, setCustomModelName] = useState<string | null>(null)
  const [modelError, setModelError] = useState('')
  const objectUrls = useRef<string[]>([])

  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  const handleSelect = useCallback((mesh: THREE.Mesh) => {
    setSelectedPart(mesh)
  }, [])

  const handleInfo = useCallback((info: typeof objectInfo) => {
    setObjectInfo(info)
  }, [])

  const handleModelFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.glb')) {
      setModelError('Choose a .glb file to load.')
      return
    }
    const objectUrl = URL.createObjectURL(file)
    objectUrls.current.push(objectUrl)
    setModelPath(objectUrl)
    setCustomModelName(file.name)
    setModelError('')
    setSelectedPart(null)
    setExploded(false)
  }

  const currentModelName = customModelName ??
    MODEL_OPTIONS.find((model) => model.path === modelPath)?.name ?? 'Custom model'

  useEffect(() => {
    if (gesture === 'FIST') setExploded(true)
    if (gesture === 'OPEN_PALM') setExploded(false)
  }, [gesture])

  const currentGesture = gestureInfo[gesture] ?? gestureInfo.UNKNOWN

  const navItems = [
    { label: 'VISUALIZE', icon: 'cube' as const },
    { label: 'INSPECT', icon: 'search' as const },
    { label: 'ANALYZE', icon: 'chart' as const },
    { label: 'SETTINGS', icon: 'settings' as const },
  ]

  const controls = [
    { icon: 'rotate' as const, title: 'TWO FINGERS', detail: 'Rotate' },
    { icon: 'hand' as const, title: 'PINCH', detail: 'Zoom' },
    { icon: 'scan' as const, title: 'POINT', detail: 'Select' },
    { icon: 'layers' as const, title: 'FIST', detail: 'Explode' },
    { icon: 'hand' as const, title: 'OPEN PALM', detail: 'Reassemble' },
  ]

  return (
    <div className="holo-app">
      {/* Ambient background */}
      <div className="ambient-glow" />

      {/* Header */}
      <header className="app-header">
        <div className="brand-group">
          <div className="brand-mark">
            <Icon name="scan" size={23} />
          </div>

          <div className="brand-name">
            <span className="text-violet-300">HOLOINSPECT</span>
            <span className="text-cyan-300"> / 3D</span>
          </div>

          <div className="camera-state">
            <StatusDot />
            <span>
              CAMERA ACTIVE
            </span>
          </div>
        </div>

        <div className="gesture-state">
          <span><Icon name="hand" size={17} /></span>
          <span>
            {gesture}
          </span>
          <span className="state-indicator" />
        </div>
      </header>

      {/* Left navigation */}
      <aside className="left-rail">
        {navItems.map((item) => {
          const active = activeTab === item.label
          return (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`rail-button${active ? ' active' : ''}`}
            >
              <Icon name={item.icon} size={22} />
              <span>
                {item.label}
              </span>
            </button>
          )
        })}
        <div className="rail-build">
          <span className="h-1 w-1 rounded-full bg-violet-400" />
          BUILD 01
        </div>
      </aside>

      {/* 3D canvas */}
      <main className="scene-main">
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [4.5, 3.1, 5.8], fov: 42, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.setClearColor('#080611')
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.1
          }}
        >
          <Suspense fallback={null}>
            <Scene
              modelPath={modelPath}
              handPoint={handPoint}
              gesture={gesture}
              exploded={exploded}
              onSelect={handleSelect}
              onInfo={handleInfo}
            />
          </Suspense>
        </Canvas>

        {/* Viewport labels */}
        <div className="viewport-label">
          <div className="eyebrow">
            SPATIAL VIEWPORT / 01
          </div>
          <div className="viewport-subtitle">
            Real-time model inspection
          </div>
        </div>

        <div className="live-label">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
          LIVE INTERACTION ENABLED
        </div>

        {/* Gesture dock */}
        <div className="gesture-dock">
          <div className="gesture-items">
            {controls.map((control, index) => (
              <div
                key={control.title}
                className={`gesture-item${index === 0 ? ' highlighted' : ''}`}
              >
                <span className={index % 2 === 0 ? 'gesture-icon cyan' : 'gesture-icon violet'}>
                  <Icon name={control.icon} size={22} />
                </span>
                <div className="gesture-copy">
                  <div className="gesture-title">
                    {control.title}
                  </div>
                  <div className="gesture-detail">
                    {control.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Right-side inspector */}
      <aside className={`inspector-panel${activeTab !== 'VISUALIZE' ? ' mobile-open' : ''}`}>
        <section className="model-card">
          <div className="model-card-title">
            <div className="eyebrow">CURRENT MODEL</div>
            <div className="model-current-name">{currentModelName}</div>
          </div>
          <select
            className="model-select"
            aria-label="Choose a 3D model"
            value={MODEL_OPTIONS.some((model) => model.path === modelPath) ? modelPath : 'custom'}
            onChange={(event) => {
              const next = MODEL_OPTIONS.find((model) => model.path === event.target.value)
              if (!next) return
              setModelPath(next.path)
              setCustomModelName(null)
              setModelError('')
              setSelectedPart(null)
              setExploded(false)
            }}
          >
            {MODEL_OPTIONS.map((model) => <option key={model.path} value={model.path}>{model.name}</option>)}
            {customModelName && <option value="custom">{customModelName}</option>}
          </select>
          <label className="upload-model">
            <span>＋</span> Load a GLB file
            <input type="file" accept=".glb,model/gltf-binary" onChange={handleModelFile} />
          </label>
          {modelError && <div className="model-error">{modelError}</div>}
        </section>

        {activeTab === 'ANALYZE' ? (
          <section className="inspector-card page-card">
            <div className="inspector-heading"><span><Icon name="chart" size={19} /></span><h2>MODEL ANALYSIS</h2></div>
            <div className="analysis-grid">
              <div><strong>{objectInfo.parts}</strong><span>COMPONENTS</span></div>
              <div><strong>{objectInfo.vertices.toLocaleString()}</strong><span>VERTICES</span></div>
            </div>
            <div className="object-info"><div className="eyebrow">BOUNDING DIMENSIONS</div><div className="analysis-dimensions">{objectInfo.dimensions}</div></div>
            <p className="analysis-note">Measurements are calculated from the loaded model. Select a mesh in the viewport to view its individual details.</p>
          </section>
        ) : activeTab === 'SETTINGS' ? (
          <section className="inspector-card page-card">
            <div className="inspector-heading"><span><Icon name="settings" size={19} /></span><h2>VIEWER SETTINGS</h2></div>
            <div className="settings-row"><span>Exploded view</span><button className={`explode-toggle${exploded ? ' enabled' : ''}`} onClick={() => setExploded((value) => !value)}><span className="toggle-label">{exploded ? 'ON' : 'OFF'}</span><span className="toggle-track"><span className="toggle-knob" /></span></button></div>
            <div className="settings-row"><span>Controls</span><span className="settings-value">Drag · scroll · pinch · hand</span></div>
            <div className="settings-row"><span>Current model</span><span className="settings-value">{currentModelName}</span></div>
            <p className="analysis-note">Drag to orbit. Scroll or pinch to zoom. Use the model picker above to load a sample or your own GLB file.</p>
          </section>
        ) : (
        <section className="inspector-card">
          <div className="inspector-heading">
            <span><Icon name="scan" size={19} /></span>
            <h2>
              COMPONENT INSPECTOR
            </h2>
          </div>

          <div className="selected-block">
            <div className="eyebrow">
              SELECTED COMPONENT
            </div>
            <div className="selected-value">
              <span>
                {selectedPart?.name || 'Select a component'}
              </span>
              <span>›</span>
            </div>
          </div>

          <div className="object-info">
            <div className="eyebrow">
              OBJECT INFORMATION
            </div>
            {[
              ['Name', selectedPart?.name || objectInfo.name],
              ['Type', selectedPart ? selectedPart.type : objectInfo.type],
              [
                'Material',
                selectedPart
                  ? Array.isArray(selectedPart.material)
                    ? 'Multiple'
                    : selectedPart.material.name || selectedPart.material.type
                  : objectInfo.material,
              ],
              [
                'Vertices',
                selectedPart
                  ? String(selectedPart.geometry.getAttribute('position')?.count ?? '—')
                  : objectInfo.vertices.toLocaleString(),
              ],
              ['Dimensions', objectInfo.dimensions],
            ].map(([label, value]) => (
              <div key={label} className="info-row">
                <span>{label}</span>
                <span>
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>

          <div className="view-mode">
            <div className="eyebrow">
              VIEW MODE
            </div>
            <button
              onClick={() => setExploded((value) => !value)}
              className={`explode-toggle${exploded ? ' enabled' : ''}`}
            >
              <span>
                <Icon name="layers" size={19} />
                <span className="toggle-label">
                  {exploded ? 'EXPLODED VIEW ON' : 'EXPLODED VIEW'}
                </span>
              </span>
              <span className="toggle-track">
                <span className="toggle-knob" />
              </span>
            </button>
          </div>
        </section>
        )}

        {/* Live camera panel */}
        <section className="camera-card">
          <div className="camera-card-header">
            <div>
              <StatusDot />
              <span>
                HAND TRACKING
              </span>
            </div>
            <span>
              {handPoint ? '1 HAND ACTIVE' : 'AWAITING HAND'}
            </span>
          </div>

          <div className="camera-placeholder">
            <div className="camera-halo" />
            <div className="camera-placeholder-copy">
              <div className="camera-symbol">
                <Icon name="hand" size={22} />
              </div>
              <div>
                {currentGesture.title}
              </div>
              <div className="camera-detail">
                {currentGesture.detail}
              </div>
            </div>
            <div className="tracking-badge">
              <StatusDot active={Boolean(handPoint)} />
              {handPoint ? 'TRACKING' : 'NO HAND DETECTED'}
            </div>
          </div>
          <p className="camera-note">
            Camera preview is provided by the existing hand-tracking component.
          </p>
        </section>
      </aside>

      {/* Compact mobile status */}
      <div className="mobile-status">
        <div className="eyebrow">GESTURE</div>
        <div className="mobile-gesture">{gesture}</div>
        <div className="mobile-mode">
          {exploded ? 'Exploded view' : 'Assembly view'}
        </div>
      </div>
    </div>
  )
}

MODEL_OPTIONS.forEach((model) => useGLTF.preload(model.path))
