from collections import deque


class GestureSmoother:
    """Stabilize gesture predictions over several frames."""

    def __init__(self, window_size: int = 5):
        self.window_size = window_size
        self.history = deque(maxlen=window_size)

    def update(self, gesture_name: str) -> str:
        self.history.append(gesture_name)

        if not self.history:
            return "UNKNOWN"

        counts = {}

        for gesture in self.history:
            counts[gesture] = counts.get(gesture, 0) + 1

        return max(counts, key=counts.get)

    def reset(self) -> None:
        self.history.clear()
