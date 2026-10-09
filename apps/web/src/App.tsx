
import { useCallback, useState } from 'react'
import HoloScene from './components/HoloScene'
import HandCamera from './vision/HandCamera'

type HandPoint = {
  x: number
  y: number
}

type GestureName = 'POINT' | 'PINCH' | 'ROTATE' | 'OPEN_PALM' | 'FIST' | 'UNKNOWN'

const gestureNames: GestureName[] = [
  'POINT', 'PINCH', 'ROTATE', 'OPEN_PALM', 'FIST', 'UNKNOWN',
]

function App() {
  const [handPoint, setHandPoint] = useState<HandPoint | null>(null)
  const [gesture, setGesture] = useState<GestureName>('UNKNOWN')

  const handleHandUpdate = useCallback(
    (point: HandPoint | null, currentGesture: string) => {
      setHandPoint(point)
      setGesture(
        gestureNames.includes(currentGesture as GestureName)
          ? (currentGesture as GestureName)
          : 'UNKNOWN',
      )
    },
    [],
  )

  return (
    <div className="app-shell">
      <HoloScene handPoint={handPoint} gesture={gesture} />

      <div className="camera-preview">
        <HandCamera onHandUpdate={handleHandUpdate} />
      </div>
    </div>
  )
}

export default App
