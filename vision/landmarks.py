from dataclasses import dataclass


@dataclass
class Landmark:
    """A single normalized hand landmark."""

    x: float
    y: float
    z: float


def extract_landmarks(hand_landmarks) -> list[Landmark]:
    """
    Convert MediaPipe hand landmarks into simple Python objects.

    MediaPipe provides 21 landmarks for each detected hand.
    """

    return [
        Landmark(
            x=landmark.x,
            y=landmark.y,
            z=landmark.z,
        )
        for landmark in hand_landmarks
    ]
