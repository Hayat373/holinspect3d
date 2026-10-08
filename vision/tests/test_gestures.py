from vision.gestures import (
    detect_gesture,
    get_finger_states,
    is_pinch,
)
from vision.landmarks import Landmark
from vision.landmark_indices import (
    INDEX_PIP,
    INDEX_TIP,
    MIDDLE_PIP,
    MIDDLE_TIP,
    RING_PIP,
    RING_TIP,
    PINKY_PIP,
    PINKY_TIP,
    THUMB_IP,
    THUMB_TIP,
    WRIST,
)


def make_hand():
    """Create a simple synthetic hand."""

    landmarks = [
        Landmark(0.0, 0.0, 0.0)
        for _ in range(21)
    ]

    # Wrist.
    landmarks[WRIST] = Landmark(0.0, 0.0, 0.0)

    return landmarks


def test_open_hand_has_four_extended_fingers():
    landmarks = make_hand()

    landmarks[INDEX_PIP] = Landmark(0.0, 0.2, 0.0)
    landmarks[INDEX_TIP] = Landmark(0.0, 0.5, 0.0)

    landmarks[MIDDLE_PIP] = Landmark(0.1, 0.2, 0.0)
    landmarks[MIDDLE_TIP] = Landmark(0.1, 0.5, 0.0)

    landmarks[RING_PIP] = Landmark(0.2, 0.2, 0.0)
    landmarks[RING_TIP] = Landmark(0.2, 0.5, 0.0)

    landmarks[PINKY_PIP] = Landmark(0.3, 0.2, 0.0)
    landmarks[PINKY_TIP] = Landmark(0.3, 0.5, 0.0)

    states = get_finger_states(landmarks)

    assert all(states.values())


def test_fist_has_no_extended_fingers():
    landmarks = make_hand()

    landmarks[INDEX_PIP] = Landmark(0.0, 0.5, 0.0)
    landmarks[INDEX_TIP] = Landmark(0.0, 0.2, 0.0)

    landmarks[MIDDLE_PIP] = Landmark(0.1, 0.5, 0.0)
    landmarks[MIDDLE_TIP] = Landmark(0.1, 0.2, 0.0)

    landmarks[RING_PIP] = Landmark(0.2, 0.5, 0.0)
    landmarks[RING_TIP] = Landmark(0.2, 0.2, 0.0)

    landmarks[PINKY_PIP] = Landmark(0.3, 0.5, 0.0)
    landmarks[PINKY_TIP] = Landmark(0.3, 0.2, 0.0)

    states = get_finger_states(landmarks)

    assert not any(states.values())


def test_pinch_detection():
    landmarks = make_hand()

    landmarks[THUMB_TIP] = Landmark(0.02, 0.02, 0.0)
    landmarks[INDEX_TIP] = Landmark(0.03, 0.03, 0.0)

    assert is_pinch(landmarks)


def test_gesture_returns_result():
    landmarks = make_hand()

    landmarks[INDEX_PIP] = Landmark(0.0, 0.2, 0.0)
    landmarks[INDEX_TIP] = Landmark(0.0, 0.5, 0.0)

    landmarks[MIDDLE_PIP] = Landmark(0.1, 0.5, 0.0)
    landmarks[MIDDLE_TIP] = Landmark(0.1, 0.2, 0.0)

    landmarks[RING_PIP] = Landmark(0.2, 0.5, 0.0)
    landmarks[RING_TIP] = Landmark(0.2, 0.2, 0.0)

    landmarks[PINKY_PIP] = Landmark(0.3, 0.5, 0.0)
    landmarks[PINKY_TIP] = Landmark(0.3, 0.2, 0.0)

    result = detect_gesture(landmarks)

    assert result.name in {
        "POINT",
        "UNKNOWN",
        "PINCH",
    }
