from vision.gesture_smoother import GestureSmoother


def test_smoother_returns_majority_gesture():
    smoother = GestureSmoother(window_size=5)

    smoother.update("POINT")
    smoother.update("POINT")
    smoother.update("PINCH")
    smoother.update("POINT")
    result = smoother.update("POINT")

    assert result == "POINT"


def test_smoother_handles_unknown():
    smoother = GestureSmoother(window_size=3)

    smoother.update("UNKNOWN")
    smoother.update("UNKNOWN")
    result = smoother.update("POINT")

    assert result == "UNKNOWN"


def test_smoother_reset():
    smoother = GestureSmoother(window_size=3)

    smoother.update("POINT")
    smoother.update("POINT")

    smoother.reset()

    assert smoother.update("PINCH") == "PINCH"
