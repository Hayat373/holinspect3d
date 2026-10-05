import cv2
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision


MODEL_PATH = "models/hand_landmarker.task"


def main() -> None:
    # Configure the MediaPipe Hand Landmarker.
    base_options = python.BaseOptions(
        model_asset_path=MODEL_PATH
    )

    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO,
        num_hands=2,
        min_hand_detection_confidence=0.6,
        min_hand_presence_confidence=0.6,
        min_tracking_confidence=0.6,
    )

    # Open webcam.
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        raise RuntimeError("Could not open webcam.")

    timestamp_ms = 0

    with vision.HandLandmarker.create_from_options(options) as landmarker:

        while True:
            success, frame = cap.read()

            if not success:
                print("Could not read frame from webcam.")
                break

            # Mirror camera for natural interaction.
            frame = cv2.flip(frame, 1)

            # OpenCV: BGR
            # MediaPipe: SRGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb_frame,
            )

            timestamp_ms += 33

            results = landmarker.detect_for_video(
                mp_image,
                timestamp_ms,
            )

            hand_count = len(results.hand_landmarks)

            # Draw detected hands.
            for hand_landmarks in results.hand_landmarks:

                height, width, _ = frame.shape

                points = []

                for landmark in hand_landmarks:
                    x = int(landmark.x * width)
                    y = int(landmark.y * height)

                    points.append((x, y))

                    # Draw landmark.
                    cv2.circle(
                        frame,
                        (x, y),
                        5,
                        (0, 255, 0),
                        -1,
                    )

                # Draw connections.
                connections = [
                    (0, 1), (1, 2), (2, 3), (3, 4),
                    (0, 5), (5, 6), (6, 7), (7, 8),
                    (0, 9), (9, 10), (10, 11), (11, 12),
                    (0, 13), (13, 14), (14, 15), (15, 16),
                    (0, 17), (17, 18), (18, 19), (19, 20),
                    (5, 9),
                    (9, 13),
                    (13, 17),
                ]

                for start, end in connections:
                    cv2.line(
                        frame,
                        points[start],
                        points[end],
                        (255, 255, 255),
                        2,
                    )

            # Status text.
            if hand_count > 0:
                cv2.putText(
                    frame,
                    f"Hands detected: {hand_count}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2,
                )
            else:
                cv2.putText(
                    frame,
                    "No hand detected",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 0, 255),
                    2,
                )

            cv2.putText(
                frame,
                "Press Q to quit",
                (20, frame.shape[0] - 20),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
            )

            cv2.imshow(
                "HoloInspect3D - Hand Tracking",
                frame,
            )

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()