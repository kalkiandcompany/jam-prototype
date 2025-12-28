import React, { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

const DHOLAK_SAMPLE = 'https://cdn.jsdelivr.net/gh/nbro/upbeat-samples@main/dholak-loop-90bpm.wav'
// If that sample 404s, replace with any loop URL you own or another public sample.

export default function InstrumentPlayer({ bpm, monitor }) {
  const playerRef = useRef(null)
  const pitchShiftRef = useRef(null)
  const [playing, setPlaying] = useState(true)
  const [vol, setVol] = useState(0.6)
  const volRef = useRef(null)
  const droneRef = useRef(null)

  useEffect(() => {
    // setup dholak player
    volRef.current = new Tone.Gain(vol).toDestination()
    playerRef.current = new Tone.Player({
      url: DHOLAK_SAMPLE,
      loop: true,
      autostart: true
    }).connect(volRef.current)

    // small pitch shift (for key changes later)
    pitchShiftRef.current = new Tone.PitchShift({ pitch: 0 }).connect(volRef.current)

    // chain player through pitch shift then volume, so we keep tempo but can transpose
    playerRef.current.disconnect()
    playerRef.current.connect(pitchShiftRef.current)

    // harmonium drone synth
    droneRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.2, decay: 0.3, sustain: 0.6, release: 1.2 }
    }).toDestination()
    // play a low drone
    const now = Tone.now()
    droneRef.current.triggerAttackRelease(['C3'], '8n', now)

    return () => {
      playerRef.current?.dispose()
      pitchShiftRef.current?.dispose()
      volRef.current?.dispose()
      droneRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    volRef.current.gain.rampTo(vol, 0.1)
  }, [vol])

  useEffect(() => {
    // update tempo awareness if needed (the sample is looped; playbackRate could be changed if you want tempo-synced stretching)
  }, [bpm])

  const toggle = () => {
    if (playing) {
      playerRef.current.stop()
    } else {
      playerRef.current.start()
    }
    setPlaying(!playing)
  }

  return (
    <div className="card">
      <h3>Instruments</h3>
      <div>
        <strong>Dholak loop</strong>
        <div>
          <button onClick={toggle}>{playing ? 'Stop' : 'Start'}</button>
          <label>Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
          />
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Harmonium drone</strong>
        <div>
          <small>Simple synth drone (demo)</small>
        </div>
      </div>
    </div>
  )
}
