from vision.interaction import (
    InteractionEngine,
    InteractionCommand,
)


def test_point_selects():
    engine = InteractionEngine()

    result = engine.update(
        "POINT",
        (0.5, 0.5),
    )

    assert isinstance(result, InteractionCommand)
    assert result.action == "SELECT"
    assert result.active is True
    assert result.hand_position == (0.5, 0.5)


def test_pinch_grabs():
    engine = InteractionEngine()

    result = engine.update(
        "PINCH",
        (0.4, 0.6),
    )

    assert result.action == "GRAB"
    assert result.active is True


def test_open_palm_releases():
    engine = InteractionEngine()

    result = engine.update("OPEN_PALM")

    assert result.action == "RELEASE"
    assert result.active is False


def test_fist_explodes():
    engine = InteractionEngine()

    result = engine.update("FIST")

    assert result.action == "EXPLODE"
    assert result.active is True


def test_unknown_does_nothing():
    engine = InteractionEngine()

    result = engine.update("UNKNOWN")

    assert result.action == "NONE"
    assert result.active is False
