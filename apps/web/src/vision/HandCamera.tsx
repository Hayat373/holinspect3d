
import { useEffect, useRef, useState } from 'react'
import {
  FilesetResolver,
  HandLandmarker,
} from '@mediapipe/tasks-vision'
import { detectGesture } from './gestureEngine'

const MODEL_PATH = '/models/hand_landmarker.task'
const WASM_PATH = '/mediapipe/wasm'

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
]

type HandPoint = {
  x: number
  y: number
}

type HandCameraProps = {
  onHandUpdate: (
    point: HandPoint | null,
    gesture: string,
  ) => void
}

export default function HandCamera({
  onHandUpdate,
}: HandCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [status, setStatus] = useState('Starting...')
  const [handCount, setHandCount] = useState(0)
  const [gesture, setGesture] = useState('UNKNOWN')

  useEffect(() => {
    let stream: MediaStream | null = null
    let animationFrame = 0
    let handLandmarker: HandLandmarker | null = null
    let cancelled = false

    async function start() {
      try {
        setStatus('Opening camera...')

        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        })

        if (cancelled || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        const video = videoRef.current
        video.srcObject = stream

        if (video.readyState < 1) {
          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => resolve()
            video.onerror = () => {
              reject(new Error('Could not load webcam video.'))
            }
          })
        }

        if (cancelled) return

        await video.play()

        if (cancelled) return

        setStatus('Loading hand tracking model...')

        const vision = await FilesetResolver.forVisionTasks(
          WASM_PATH,
        )

        if (cancelled) return

        handLandmarker = await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath: MODEL_PATH,
            },
            runningMode: 'VIDEO',
            numHands: 2,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          },
        )

        if (cancelled) {
          handLandmarker.close()
          handLandmarker = null
          return
        }

        setStatus('Hand tracking active')
        detectHands()
      } catch (error) {
        if (!cancelled) {
          console.error('HAND TRACKING ERROR:', error)
          setStatus('ERROR - check browser console')
          onHandUpdate(null, 'UNKNOWN')
        }
      }
    }

    function detectHands() {
      if (
        cancelled ||
        !videoRef.current ||
        !canvasRef.current ||
        !handLandmarker
      ) {
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) return

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrame = requestAnimationFrame(detectHands)
        return
      }

      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      try {
        const results = handLandmarker.detectForVideo(
          video,
          performance.now(),
        )

        const hands = results.landmarks ?? []
        const firstHand = hands[0]

        setHandCount(hands.length)

        const currentGesture = firstHand
          ? detectGesture(firstHand)
          : 'UNKNOWN'

        setGesture(currentGesture)

        // Send the mirrored index fingertip position to the 3D scene.
        const indexTip = firstHand?.[8]

        onHandUpdate(
          indexTip
            ? {
                x: 1 - indexTip.x,
                y: indexTip.y,
              }
            : null,
          currentGesture,
        )

        context.clearRect(0, 0, canvas.width, canvas.height)

        for (const hand of hands) {
          // Draw hand connections.
          context.beginPath()

          for (const [start, end] of CONNECTIONS) {
            const a = hand[start]
            const b = hand[end]

            context.moveTo(
              a.x * canvas.width,
              a.y * canvas.height,
            )

            context.lineTo(
              b.x * canvas.width,
              b.y * canvas.height,
            )
          }

          context.strokeStyle = '#ffffff'
          context.lineWidth = 2
          context.stroke()

          // Draw landmark points.
          for (const landmark of hand) {
            context.beginPath()

            context.arc(
              landmark.x * canvas.width,
              landmark.y * canvas.height,
              4,
              0,
              Math.PI * 2,
            )

            context.fillStyle = '#c084fc'
            context.fill()
          }

          // Highlight the index fingertip.
          const tip = hand[8]

          if (tip) {
            context.beginPath()
            context.arc(
              tip.x * canvas.width,
              tip.y * canvas.height,
              8,
              0,
              Math.PI * 2,
            )
            context.strokeStyle = '#e9d5ff'
            context.lineWidth = 3
            context.stroke()
          }
        }
      } catch (error) {
        console.error('HAND DETECTION ERROR:', error)
      }

      animationFrame = requestAnimationFrame(detectHands)
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(animationFrame)

      handLandmarker?.close()
      stream?.getTracks().forEach((track) => track.stop())

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      onHandUpdate(null, 'UNKNOWN')
    }
  }, [onHandUpdate])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#080512',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transform: 'scaleX(-1)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          padding: '8px 10px',
          borderRadius: 8,
          background: 'rgba(8, 5, 18, 0.82)',
          border: '1px solid rgba(192, 132, 252, 0.35)',
          color: '#f5f3ff',
          fontSize: 12,
          lineHeight: 1.7,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div>{status}</div>
        <div>Hands detected: {handCount}</div>
        <div>Gesture: {gesture}</div>
      </div>
    </div>
  )
}
