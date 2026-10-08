from dataclasses import dataclass

from vision.features import distance
from vision.landmarks import Landmark
from vision.landmark_indices import (
    INDEX_TIP,
    INDEX_PIP,
    MIDDLE_TIP,
    MIDDLE_PIP,
    RING_TIP,
    RING_PIP,
    PINKY_TIP,
    PINKY_PIP,
    THUMB_TIP,
    THUMB_IP,
)


@dataclass
class GestureResult:
    name: str
    confidence: float


def finger_extended(
    landmarks: list[Landmark],
    tip_index: int,
    pip_index: int,
) -> bool:
    """
    Estimate whether a finger is extended.

    A simple approximation:
    fingertip must be farther from the wrist
    than the PIP joint.
    """

    wrist = landmarks[0]

    tip_distance = distance(
        wrist,
        landmarks[tip_index],
    )

    pip_distance = distance(
        wrist,
        landmarks[pip_index],
    )

    return tip_distance > pip_distance


def get_finger_states(
    landmarks: list[Landmark],
) -> dict[str, bool]:
    """Return the extended/folded state of each finger."""

    return {
        "index": finger_extended(
            landmarks,
            INDEX_TIP,
            INDEX_PIP,
        ),
        "middle": finger_extended(
            landmarks,
            MIDDLE_TIP,
            MIDDLE_PIP,
        ),
        "ring": finger_extended(
            landmarks,
            RING_TIP,
            RING_PIP,
        ),
        "pinky": finger_extended(
            landmarks,
            PINKY_TIP,
            PINKY_PIP,
        ),
    }


def is_pinch(
    landmarks: list[Landmark],
    threshold: float = 0.08,
) -> bool:
    """Detect thumb-index pinch."""

    return (
        distance(
            landmarks[THUMB_TIP],
            landmarks[INDEX_TIP],
        )
        < threshold
    )


def detect_gesture(
    landmarks: list[Landmark],
) -> GestureResult:
    """
    Classify the current hand pose.

    Priority:
    1. Pinch
    2. Point
    3. Open palm
    4. Fist
    """

    if is_pinch(landmarks):
        return GestureResult(
            name="PINCH",
            confidence=0.95,
        )

    fingers = get_finger_states(landmarks)

    extended_count = sum(fingers.values())

    # Pointing gesture:
    # index extended while other three fingers are folded.
    if (
        fingers["index"]
        and not fingers["middle"]
        and not fingers["ring"]
        and not fingers["pinky"]
    ):
        return GestureResult(
            name="POINT",
            confidence=0.90,
        )

    # Open palm.
    if extended_count == 4:
        return GestureResult(
            name="OPEN_PALM",
            confidence=0.95,
        )

    # Fist.
    if extended_count == 0:
        return GestureResult(
            name="FIST",
            confidence=0.90,
        )

    return GestureResult(
        name="UNKNOWN",
        confidence=0.50,
    )
