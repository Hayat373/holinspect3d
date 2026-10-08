import { useEffect, useRef, useState } from 'react'
import {
  FilesetResolver,
  HandLandmarker,
} from '@mediapipe/tasks-vision'

const MODEL_PATH = '/models/hand_landmarker.task'

export default function HandCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [status, setStatus] = useState('Starting...')
  const [handCount, setHandCount] = useState(0)

  useEffect(() => {
    let stream: MediaStream | null = null
    let animationFrame = 0
    let handLandmarker: HandLandmarker | null = null

    async function start() {
      try {
        setStatus('Opening camera...')

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
          },
          audio: false,
        })

        if (!videoRef.current) {
          throw new Error('Video element not available.')
        }

        videoRef.current.srcObject = stream

        await new Promise<void>((resolve) => {
        const video = videoRef.current

        if (!video) {
          resolve()
          return
        }

        if (video.readyState >= 1) {
          resolve()
          return
        }

        video.onloadedmetadata = () => {
          resolve()
        }
      })

      await videoRef.current.play()

        setStatus('Loading MediaPipe...')

        const vision = await FilesetResolver.forVisionTasks(
          '/mediapipe/wasm',
        )

        handLandmarker =
          await HandLandmarker.createFromOptions(
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

        setStatus('Hand tracking active')

        detectHands()
      } catch (error) {
        console.error('HAND TRACKING ERROR:', error)
        setStatus('ERROR - check browser console')
      }
    }

    function detectHands() {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !handLandmarker
      ) {
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (!context) {
        return
      }

      if (
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        animationFrame = requestAnimationFrame(
          detectHands,
        )
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const timestamp = performance.now()

      const results =
        handLandmarker.detectForVideo(
          video,
          timestamp,
        )

      const detectedHands =
        results.landmarks?.length ?? 0

      setHandCount(detectedHands)

      context.clearRect(
        0,
        0,
        canvas.width,
        canvas.height,
      )

      if (results.landmarks) {
        for (const hand of results.landmarks) {
          // Draw landmarks
          for (const landmark of hand) {
            const x =
              landmark.x * canvas.width

            const y =
              landmark.y * canvas.height

            context.beginPath()
            context.arc(
              x,
              y,
              5,
              0,
              Math.PI * 2,
            )

            context.fillStyle = '#c084fc'
            context.fill()
          }

          // Draw connections
          const connections = [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],

            [0, 5],
            [5, 6],
            [6, 7],
            [7, 8],

            [0, 9],
            [9, 10],
            [10, 11],
            [11, 12],

            [0, 13],
            [13, 14],
            [14, 15],
            [15, 16],

            [0, 17],
            [17, 18],
            [18, 19],
            [19, 20],

            [5, 9],
            [9, 13],
            [13, 17],
          ]

          for (const [start, end] of connections) {
            const startPoint = hand[start]
            const endPoint = hand[end]

            context.beginPath()

            context.moveTo(
              startPoint.x * canvas.width,
              startPoint.y * canvas.height,
            )

            context.lineTo(
              endPoint.x * canvas.width,
              endPoint.y * canvas.height,
            )

            context.strokeStyle = '#ffffff'
            context.lineWidth = 3
            context.stroke()
          }
        }
      }

      animationFrame =
        requestAnimationFrame(detectHands)
    }

    start()

    return () => {
      cancelAnimationFrame(animationFrame)

      handLandmarker?.close()

      stream?.getTracks().forEach((track) => {
        track.stop()
      })
    }
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
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
          top: '8px',
          left: '8px',
          padding: '6px 10px',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          fontSize: '12px',
        }}
      >
        {status}
        <br />
        Hands detected: {handCount}
      </div>
    </div>
  )
}