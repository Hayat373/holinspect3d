import math

from vision.landmarks import Landmark
from vision.landmark_indices import (
    INDEX_TIP,
    MIDDLE_TIP,
    RING_TIP,
    PINKY_TIP,
    THUMB_TIP,
    WRIST,
)


def distance(a: Landmark, b: Landmark) -> float:
    """Calculate 3D Euclidean distance between two landmarks."""

    return math.sqrt(
        (a.x - b.x) ** 2
        + (a.y - b.y) ** 2
        + (a.z - b.z) ** 2
    )


def midpoint(a: Landmark, b: Landmark) -> Landmark:
    """Return the midpoint between two landmarks."""

    return Landmark(
        x=(a.x + b.x) / 2,
        y=(a.y + b.y) / 2,
        z=(a.z + b.z) / 2,
    )


def palm_center(landmarks: list[Landmark]) -> Landmark:
    """Estimate the center of the palm."""

    return midpoint(
        landmarks[WRIST],
        landmarks[MIDDLE_TIP],
    )


def pinch_distance(landmarks: list[Landmark]) -> float:
    """Distance between thumb tip and index fingertip."""

    return distance(
        landmarks[THUMB_TIP],
        landmarks[INDEX_TIP],
    )


def fingertip_distances_from_wrist(
    landmarks: list[Landmark],
) -> dict[str, float]:
    """Calculate distances from wrist to each fingertip."""

    wrist = landmarks[WRIST]

    return {
        "thumb": distance(wrist, landmarks[THUMB_TIP]),
        "index": distance(wrist, landmarks[INDEX_TIP]),
        "middle": distance(wrist, landmarks[MIDDLE_TIP]),
        "ring": distance(wrist, landmarks[RING_TIP]),
        "pinky": distance(wrist, landmarks[PINKY_TIP]),
    }
