
import { useCallback, useState } from 'react'
import HoloScene from './components/HoloScene'
import HandCamera from './vision/HandCamera'

type HandPoint = {
  x: number
  y: number
}

function App() {
  const [handPoint, setHandPoint] = useState<HandPoint | null>(null)
  const [gesture, setGesture] = useState('UNKNOWN')

  const handleHandUpdate = useCallback(
    (point: HandPoint | null, currentGesture: string) => {
      setHandPoint(point)
      setGesture(currentGesture)
    },
    [],
  )

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#080512',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <HoloScene handPoint={handPoint} gesture={gesture} />

      <div
        style={{
          position: 'absolute',
          right: 24,
          bottom: 24,
          width: 280,
          height: 210,
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid rgba(168, 85, 247, 0.5)',
          background: '#000',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.12)',
        }}
      >
        <HandCamera onHandUpdate={handleHandUpdate} />
      </div>
    </div>
  )
}

export default App
