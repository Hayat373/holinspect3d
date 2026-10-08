from vision.features import (
    distance,
    midpoint,
    pinch_distance,
    palm_center,
    fingertip_distances_from_wrist,
)
from vision.landmarks import Landmark
from vision.landmark_indices import (
    INDEX_TIP,
    MIDDLE_TIP,
    RING_TIP,
    PINKY_TIP,
    THUMB_TIP,
    WRIST,
)


def create_test_landmarks():
    """Create 21 simple landmarks for testing."""

    landmarks = [
        Landmark(0.0, 0.0, 0.0)
        for _ in range(21)
    ]

    landmarks[WRIST] = Landmark(0.0, 0.0, 0.0)

    landmarks[THUMB_TIP] = Landmark(0.3, 0.0, 0.0)
    landmarks[INDEX_TIP] = Landmark(0.0, 0.4, 0.0)
    landmarks[MIDDLE_TIP] = Landmark(0.0, 0.5, 0.0)
    landmarks[RING_TIP] = Landmark(0.0, 0.6, 0.0)
    landmarks[PINKY_TIP] = Landmark(0.0, 0.7, 0.0)

    return landmarks


def test_distance():
    a = Landmark(0.0, 0.0, 0.0)
    b = Landmark(3.0, 4.0, 0.0)

    assert distance(a, b) == 5.0


def test_midpoint():
    a = Landmark(0.0, 0.0, 0.0)
    b = Landmark(1.0, 1.0, 1.0)

    result = midpoint(a, b)

    assert result.x == 0.5
    assert result.y == 0.5
    assert result.z == 0.5


def test_pinch_distance():
    landmarks = create_test_landmarks()

    result = pinch_distance(landmarks)

    assert result == 0.5


def test_palm_center():
    landmarks = create_test_landmarks()

    result = palm_center(landmarks)

    assert result.y == 0.25


def test_fingertip_distances():
    landmarks = create_test_landmarks()

    result = fingertip_distances_from_wrist(landmarks)

    assert result["thumb"] == 0.3
    assert result["index"] == 0.4
    assert result["middle"] == 0.5
    assert result["ring"] == 0.6
    assert result["pinky"] == 0.7
