from dataclasses import dataclass


@dataclass
class InteractionCommand:
    """A command produced by the gesture interaction layer."""

    action: str
    active: bool
    hand_position: tuple[float, float] | None = None


class InteractionEngine:
    """Convert stable gestures into 3D interaction commands."""

    def __init__(self) -> None:
        self.previous_gesture = "UNKNOWN"

    def update(
        self,
        gesture: str,
        hand_position: tuple[float, float] | None = None,
    ) -> InteractionCommand:

        if gesture == "POINT":
            action = "SELECT"
            active = True

        elif gesture == "PINCH":
            action = "GRAB"
            active = True

        elif gesture == "FIST":
            action = "EXPLODE"
            active = True

        elif gesture == "OPEN_PALM":
            action = "RELEASE"
            active = False

        else:
            action = "NONE"
            active = False

        self.previous_gesture = gesture

        return InteractionCommand(
            action=action,
            active=active,
            hand_position=hand_position,
        )
