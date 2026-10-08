from vision.landmarks import Landmark, extract_landmarks


class FakeMediaPipeLandmark:
    def __init__(self, x: float, y: float, z: float):
        self.x = x
        self.y = y
        self.z = z


def test_extract_landmarks_returns_21_points():
    fake_landmarks = [
        FakeMediaPipeLandmark(
            x=i / 21,
            y=i / 21,
            z=0.0,
        )
        for i in range(21)
    ]

    landmarks = extract_landmarks(fake_landmarks)

    assert len(landmarks) == 21


def test_landmark_values_are_preserved():
    fake_landmarks = [
        FakeMediaPipeLandmark(
            x=0.5,
            y=0.25,
            z=-0.1,
        )
    ]

    landmarks = extract_landmarks(fake_landmarks)

    assert landmarks[0].x == 0.5
    assert landmarks[0].y == 0.25
    assert landmarks[0].z == -0.1
