import React, { useEffect, useRef, useState } from 'react'
import { findPitch } from 'pitchy'

function freqToNote(freq) {
  if (!freq || freq <= 0) return { note: '-', cents: 0 }
  const A4 = 440
  const semitone = 12 * Math.log2(freq / A4)
  const noteNumber = Math.round(semitone) + 69
  const cents = Math.round((semitone - Math.round(semitone)) * 100)
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const name = noteNames[(noteNumber + 120) % 12] + Math.floor(noteNumber / 12 - 1)
  return { note: name, cents }
}

export default function Tuner() {
  const [note, setNote] = useState('-')
  const [cents, setCents] = useState(0)
  const rafRef = useRef(null)
  const analyserRef = useRef(null)
  const bufferRef = useRef(null)

  useEffect(() => {
    let ctx, stream, source
    let running = true
    async function init() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      ctx = new (window.AudioContext || window.webkitAudioContext)()
      source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser
      bufferRef.current = new Float32Array(analyser.fftSize)

      const update = () => {
        if (!running) return
        analyser.getFloatTimeDomainData(bufferRef.current)
        const [f0] = findPitch(bufferRef.current, ctx.sampleRate)
        const res = freqToNote(f0)
        setNote(res.note)
        setCents(res.cents || 0)
        rafRef.current = requestAnimationFrame(update)
      }
      update()
    }
    init().catch((e) => console.error('Tuner init failed', e))

    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      try {
        analyserRef.current?.disconnect()
      } catch {}
    }
  }, [])

  return (
    <div className="card">
      <h3>Tuner</h3>
      <div className="tuner">
        <div className="note">{note}</div>
        <div className="cents">Cents: {cents}</div>
        <div className="needle" style={{ transform: `translateX(${cents}px)` }} />
      </div>
    </div>
  )
}
