
export type HandLandmark = {
  x: number
  y: number
  z: number
}

export type GestureName =
  | 'POINT'
  | 'PINCH'
  | 'OPEN_PALM'
  | 'FIST'
  | 'UNKNOWN'

const WRIST = 0
const THUMB_TIP = 4
const INDEX_TIP = 8
const INDEX_PIP = 6
const MIDDLE_TIP = 12
const MIDDLE_PIP = 10
const RING_TIP = 16
const RING_PIP = 14
const PINKY_TIP = 20
const PINKY_PIP = 18
const MIDDLE_MCP = 9

function distance(a: HandLandmark, b: HandLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

function fingerExtended(
  landmarks: HandLandmark[],
  tip: number,
  pip: number,
) {
  return (
    distance(landmarks[WRIST], landmarks[tip]) >
    distance(landmarks[WRIST], landmarks[pip])
  )
}

export function detectGesture(
  landmarks: HandLandmark[],
): GestureName {
  if (landmarks.length < 21) return 'UNKNOWN'

  const wrist = landmarks[WRIST]
  const handScale = distance(wrist, landmarks[MIDDLE_MCP])

  if (handScale < 0.0001) return 'UNKNOWN'

  const pinchDistance =
    distance(landmarks[THUMB_TIP], landmarks[INDEX_TIP]) /
    handScale

  const index = fingerExtended(landmarks, INDEX_TIP, INDEX_PIP)
  const middle = fingerExtended(
    landmarks,
    MIDDLE_TIP,
    MIDDLE_PIP,
  )
  const ring = fingerExtended(landmarks, RING_TIP, RING_PIP)
  const pinky = fingerExtended(
    landmarks,
    PINKY_TIP,
    PINKY_PIP,
  )

  if (pinchDistance < 0.3) return 'PINCH'

  if (index && !middle && !ring && !pinky) return 'POINT'

  if (index && middle && ring && pinky) return 'OPEN_PALM'

  if (!index && !middle && !ring && !pinky) return 'FIST'

  return 'UNKNOWN'
}
