import React, { useEffect, useRef, useState } from 'react'

/**
 * Simple autocorrelation-based pitch detector (small and dependency-free).
 * Returns an array [frequencyInHz] to match the previous usage.
 */
function findPitch(buf, sampleRate) {
  // buffer is Float32Array of time domain samples
  const SIZE = buf.length
  let sum = 0
  for (let i = 0; i < SIZE; i++) {
    const val = buf[i]
    sum += val * val
  }
  const rms = Math.sqrt(sum / SIZE)
  if (rms < 0.01) return [0] // too quiet

  // Trim edges (silence)
  let r1 = 0
  let r2 = SIZE - 1
  const threshold = 0.02
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < threshold) {
      r1 = i
      break
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < threshold) {
      r2 = SIZE - i
      break
    }
  }
  const trimmed = buf.slice(r1, r2)
  const newSize = trimmed.length
  if (newSize < 16) return [0]

  // Autocorrelation
  const c = new Array(newSize).fill(0)
  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize - i; j++) {
      c[i] = c[i] + trimmed[j] * trimmed[j + i]
    }
  }

  // Find the first dip
  let d = 0
  while (c[d] > c[d + 1]) d++
  // Find max after dip
  let maxval = -Infinity
  let maxpos = -1
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i]
      maxpos = i
    }
  }
  if (maxpos <= 0) return [0]

  // Parabolic interpolation for peak refinement
  const T0 = maxpos
  const x1 = c[T0 - 1] || 0
  const x2 = c[T0] || 0
  const x3 = c[T0 + 1] || 0
  const a = (x1 + x3 - 2 * x2) / 2
  const b = (x3 - x1) / 2
  let refined = T0
  if (a !== 0) refined = T0 - b / (2 * a)
  const frequency = sampleRate / refined
  if (!isFinite(frequency) || frequency <= 0 || frequency > 5000) return [0]
  return [frequency]
}

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
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (err) {
        console.error('Microphone permission denied or not available', err)
        return
      }
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
