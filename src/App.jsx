import React, { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import Metronome from './components/Metronome'
import Tuner from './components/Tuner'
import InstrumentPlayer from './components/InstrumentPlayer'

export default function App() {
  const [bpm, setBpm] = useState(90)
  const [isTransportStarted, setIsTransportStarted] = useState(false)
  const [monitor, setMonitor] = useState(true)
  const [recording, setRecording] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    Tone.Transport.bpm.value = bpm
  }, [bpm])

  // Setup recording (route Tone master to a MediaStream)
  useEffect(() => {
    async function setup() {
      await Tone.start()
      // Create a MediaStream from Tone's master output
      if (!window.audioDest) {
        const dest = Tone.context.createMediaStreamDestination()
        Tone.getDestination().connect(dest)
        window.audioDest = dest
      }
    }
    setup()
  }, [])

  const startRecording = () => {
    const stream = window.audioDest.stream
    if (!stream) {
      alert('Audio not ready yet.')
      return
    }
    const mr = new MediaRecorder(stream)
    mediaRecorderRef.current = mr
    chunksRef.current = []
    mr.ondataavailable = (e) => chunksRef.current.push(e.data)
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'jam-recording.webm'
      a.click()
      URL.revokeObjectURL(url)
      setRecording(false)
    }
    mr.start()
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  const toggleTransport = async () => {
    if (!isTransportStarted) {
      await Tone.start()
      const startAt = Tone.now() + 0.1
      Tone.Transport.start(startAt)
      setIsTransportStarted(true)
    } else {
      Tone.Transport.stop()
      setIsTransportStarted(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Jam Prototype — Metronome & Tuner</h1>
      </header>

      <main>
        <section className="left">
          <div className="controls card">
            <label>BPM: {bpm}</label>
            <input
              type="range"
              min="40"
              max="200"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
            />
            <button onClick={toggleTransport}>
              {isTransportStarted ? 'Stop' : 'Start'} Transport
            </button>
            <label>
              <input
                type="checkbox"
                checked={monitor}
                onChange={() => setMonitor((m) => !m)}
              />
              Mic monitor
            </label>
            <div style={{ marginTop: 10 }}>
              {recording ? (
                <button onClick={stopRecording}>Stop Recording</button>
              ) : (
                <button onClick={startRecording}>Start Recording</button>
              )}
            </div>
          </div>

          <Metronome bpm={bpm} />
          <InstrumentPlayer bpm={bpm} monitor={monitor} />
        </section>

        <aside className="right">
          <Tuner />
          <div className="card">
            <h3>Notes</h3>
            <ul>
              <li>Use desktop for best results.</li>
              <li>If mic access is requested, allow it.</li>
              <li>Recording downloads as webm audio file (mix of instruments + mic).</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  )
}
