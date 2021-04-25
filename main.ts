music.setVolume(200);

class Ref<T> {
    current: T;

    constructor(value: T) {
        this.current = value;
    }
}

const notes = [
    Note.A,
    Note.A3,
    Note.A4,
    Note.A5,
    Note.B,
    Note.B3,
    Note.B4,
    Note.B5,
    Note.Bb3,
    Note.Bb4,
    Note.Bb5,
    Note.C,
    Note.C3,
    Note.C4,
    Note.C5,
    Note.CSharp,
    Note.CSharp3,
    Note.CSharp4,
    Note.CSharp5,
    Note.D,
    Note.D3,
    Note.D4,
    Note.D5,
    Note.E,
    Note.E3,
    Note.E4,
    Note.E5,
    Note.Eb3,
    Note.Eb4,
    Note.Eb5,
    Note.F,
    Note.F3,
    Note.F4,
    Note.F5,
    Note.FSharp,
    Note.FSharp3,
    Note.FSharp4,
    Note.FSharp5,
    Note.G,
    Note.G3,
    Note.G4,
    Note.G5,
    Note.GSharp,
    Note.GSharp3,
    Note.GSharp4,
    Note.GSharp5,
].sort((a, b) => a - b);

const state = new Ref(0);

const tone = new Ref(Note.C);

const delay = new Ref(300);

enum EventSource {
    State = 999998,
    Acceleration = 999999
}

basic.forever(function () {
    // Update state
    state.current = pins.digitalReadPin(DigitalPin.P2);
    control.raiseEvent(EventSource.State, state.current);
    if (state.current === 1) {
        music.playTone(tone.current, music.beat(BeatFraction.Half));
    }

    // If state is enabled...
    if (state.current) {
        // Get pitch rotation
        const rotation = input.rotation(Rotation.Pitch)
        // Pitch rotation determines which note plays
        const noteIndex = Math.round(Math.map(Math.abs(rotation), 0, 180, 0, notes.length - 1))
        tone.current = notes[noteIndex];

        // Get acceleration strength
        const strength = input.acceleration(Dimension.Strength)

        // Strength determines sleep between notes
        const MAX_DELAY = 800;
        const MAX_STRENGTH = 2000;
        const delayMs = MAX_DELAY - Math.map(Math.min(strength, MAX_STRENGTH), 0, MAX_STRENGTH, 0, MAX_DELAY);
        const lastDelayMs = delay.current;
        delay.current = delayMs;
        // If delay has changed, raise an acceleration event
        if (delayMs < Math.max(0, lastDelayMs - (MAX_DELAY / 4))) {
            control.raiseEvent(EventSource.Acceleration, 1);
        }
    }
});

basic.forever(function () {
    const breakLoop = new Ref(false);

    control.onEvent(EventSource.Acceleration, 1, function () {
        breakLoop.current = true;
    });

    while (state.current) {
        // Reset break state
        breakLoop.current = false;
        // Play tone
        music.playTone(tone.current, music.beat(BeatFraction.Half));
        // Rest in max-10ms intervals, until complete or loop is broken
        const interval = Math.min(10, delay.current);
        for (let i = 0; i < delay.current; i += interval) {
            if (!state.current || breakLoop.current) {
                break;
            }
            basic.pause(interval);
        }
    }

    control.waitForEvent(EventSource.State, 1);
});