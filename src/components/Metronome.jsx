import React, { useEffect, useRef } from 'react'
import * as Tone from 'tone'

export default function Metronome({ bpm }) {
  const clickSynthRef = useRef(null)

  useEffect(() => {
    clickSynthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 10,
      envelope: { attack: 0.001, decay: 0.15, sustain: 0.01 }
    }).toDestination()

    // schedule a simple click on every quarter note
    Tone.Transport.scheduleRepeat((time) => {
      clickSynthRef.current.triggerAttackRelease('C4', '8n', time)
    }, '4n')

    return () => {
      Tone.Transport.cancel()
      clickSynthRef.current.dispose()
    }
  }, [])

  useEffect(() => {
    Tone.Transport.bpm.value = bpm
  }, [bpm])

  return (
    <div className="card">
      <h3>Metronome</h3>
      <p>BPM: {bpm}</p>
      <div className="metronome-visual" aria-hidden />
    </div>
  )
}
