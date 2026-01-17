import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from './config.js'
import TimeLine from './components/Timeline.jsx'
import { Upload, AlertTriangle, CheckCircle, FileVideo, Play, Download } from 'lucide-react'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle, uploading, analyzing, complete, error
  const [progress, setProgress] = useState(0)
  const [analysisStage, setAnalysisStage] = useState('')
  const [result, setResult] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [systemStatus, setSystemStatus] = useState('Checking...')
  const [evidenceId, setEvidenceId] = useState(null)
  const [isEmbedded, setIsEmbedded] = useState(false)

  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  // 1. System Health Check & Embed Detection
  useEffect(() => {
    // Check if embedded in iframe (HF Spaces)
    if (window.self !== window.top) {
      setIsEmbedded(true)
      document.body.classList.add('embedded')
    }

    const checkHealth = async () => {
      try {
        await axios.get(`${API_URL}/api/health`, { timeout: 5000 })
        setSystemStatus('Operational')
      } catch (err) {
        setSystemStatus('Offline')
        console.warn("Backend offline:", err)
      }
    }
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const generateEvidenceId = () => {
    return `#${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  }

  const validateFile = (file) => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png']

    if (file.size > maxSize) {
      alert(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 500MB limit.\nConsider using a shorter clip or lower resolution.`)
      return false
    }
    if (!validTypes.includes(file.type)) {
      alert("Invalid format. Supported: MP4, AVI, MOV, JPG, PNG")
      return false
    }
    return true
  }

  const startAnalysis = async (selectedFile) => {
    setStatus('uploading')
    setProgress(0)
    setAnalysisStage('Stage 1/4: Initializing secure upload...')
    setEvidenceId(generateEvidenceId())

    const formData = new FormData()
    formData.append('file', selectedFile)

    const isImage = selectedFile.type.startsWith('image/')
    const endpoint = isImage ? '/api/analyze/image' : '/api/analyze'

    try {
      const stageTimer = setInterval(() => {
        setProgress(old => {
          if (old < 30) {
            setAnalysisStage('Stage 2/4: Frame Extraction & Normalization');
            return old + 2;
          }
          if (old < 60) {
            setAnalysisStage('Stage 3/4: Temporal Inconsistency Detection');
            return old + 1;
          }
          if (old < 85) {
            setAnalysisStage('Stage 4/4: Pattern Recognition');
            return old + 0.5;
          }
          return old;
        })
      }, 500);

      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Upload only counts for first 20% visual
            if (percent < 100) setProgress(Math.min(20, percent / 5));
          }
        }
      })

      clearInterval(stageTimer)

      setResult(response.data)
      setProgress(100)
      setAnalysisStage('Analysis Complete')
      setStatus('complete')

    } catch (error) {
      console.error('Analysis failed', error)
      setStatus('error')
    }
  }

  // Video Player Logic
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const getCurrentFrame = () => Math.floor(currentTime * 30)
  const getTotalFrames = () => Math.floor(duration * 30)

  return (
    <div className={`min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-forensics-red/30 ${isEmbedded ? 'p-4' : 'p-8'}`}>

      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white">
            DeepForged <span className="text-forensics-red font-semibold">Forensics</span>
          </h1>
          <p className="text-neutral-500 font-mono text-xs mt-1 tracking-wide">
            Temporal Localization Engine v2.0
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 mt-4 md:mt-0">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
            <div className={`w-2 h-2 rounded-full ${systemStatus === 'Operational' ? 'bg-forensics-green animate-pulse-slow' : 'bg-forensics-red'}`}></div>
            <span>System: <span className={systemStatus === 'Operational' ? 'text-forensics-green' : 'text-forensics-red'}>{systemStatus}</span></span>
          </div>
          <div className="group relative">
            <AlertTriangle className="w-4 h-4 text-forensics-red/70 cursor-help" />
            <div className="absolute right-0 top-6 w-64 bg-neutral-900 border border-neutral-700 p-3 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Analysis requires time and scrutiny. Results are likelihood assessments, not absolute verdicts.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {status === 'idle' && (
          <div className="max-w-2xl mx-auto mt-20">
            <div
              className="border-2 border-dashed border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900/80 hover:border-neutral-600 transition-all duration-200 rounded-sm p-20 text-center cursor-pointer group relative overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile && validateFile(droppedFile)) {
                  setFile(droppedFile);
                  startAnalysis(droppedFile);
                }
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 mb-8 rounded-full bg-neutral-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-neutral-700">
                  <Upload className="w-8 h-8 text-neutral-400 group-hover:text-forensics-blue transition-colors" />
                </div>
                <h2 className="text-xl font-medium text-neutral-200 mb-2">Drop Evidence Here</h2>
                <p className="text-neutral-500 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                  Supported formats: MP4, AVI, MOV, PNG, JPG (Max 500MB)
                  <br /><span className="text-xs text-neutral-600 mt-1 block">Analysis time: 3-15 minutes depending on media length</span>
                </p>
                <button className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold px-6 py-3 rounded-sm border border-neutral-700 transition-all">
                  OR SELECT FILE
                </button>

                <div className="mt-8 flex items-center gap-2 text-[10px] text-neutral-600 italic">
                  <div className="w-3 h-3 border border-neutral-600 rounded-[1px] flex items-center justify-center"><div className="w-1.5 h-1.5 bg-neutral-600"></div></div>
                  Submitted media is processed in this container. No data is transmitted externally.
                </div>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="video/*,image/*"
              onChange={(e) => {
                const selected = e.target.files[0];
                if (selected && validateFile(selected)) {
                  setFile(selected);
                  startAnalysis(selected);
                }
              }}
            />
          </div>
        )}

        {(status === 'uploading' || status === 'analyzing') && (
          <div className="max-w-xl mx-auto mt-32 text-center">
            <h2 className="text-xl font-medium text-neutral-300 mb-8">Analyzing Artifacts...</h2>

            <div className="text-5xl font-mono text-forensics-blue mb-6">{Math.round(progress)}%</div>

            <div className="h-2 bg-neutral-800 rounded-sm overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-[#4A90E2] to-[#5DADE2] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <p className="text-xs text-neutral-500 font-mono mt-4 tracking-wide">
              {analysisStage}
            </p>

            <p className="text-[10px] text-neutral-600 mt-8">
              Estimated completion: 3-6 minutes
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-12 px-4 py-2 text-[10px] text-neutral-500 border border-neutral-700 hover:text-neutral-300 hover:border-neutral-500 transition-colors uppercase tracking-widest"
            >
              Cancel Analysis
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="max-w-lg mx-auto mt-32 text-center border border-forensics-red/50 bg-forensics-red/5 p-12 rounded-sm">
            <AlertTriangle className="w-12 h-12 text-forensics-red mx-auto mb-6" />
            <h3 className="text-xl text-forensics-red font-medium mb-2">Analysis Incomplete</h3>
            <p className="text-neutral-400 text-sm mb-8">
              Evidence file exceeded processing capacity or system timed out.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="bg-forensics-red hover:bg-red-700 text-white text-xs font-bold px-6 py-3 rounded-sm transition-colors"
            >
              RETRY UPLOAD
            </button>
          </div>
        )}

        {status === 'complete' && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">

            {/* LEFT: MEDIA & TIMELINE */}
            <div className="lg:col-span-8 flex flex-col gap-0 border border-neutral-800 rounded-sm overflow-hidden bg-neutral-900">
              <div className="relative bg-black aspect-video group flex items-center justify-center">
                {file && file.type.startsWith('video/') ? (
                  <>
                    <video
                      ref={videoRef}
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-contain"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onClick={() => videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause()}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {videoRef.current?.paused && (
                        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                          <Play fill="white" className="text-white ml-1" />
                        </div>
                      )}
                    </div>
                    <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent flex justify-between pointer-events-none">
                      <span className="font-mono text-[10px] text-white/90 bg-black/50 px-2 py-1 rounded-sm border border-white/10">
                        FRAME {getCurrentFrame()} / {getTotalFrames()} | {currentTime.toFixed(2)}s
                      </span>
                    </div>
                  </>
                ) : (
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-contain" />
                )}
                <div className="absolute top-3 right-3 bg-neutral-800/90 border border-neutral-700 px-2 py-1 rounded-sm text-[10px] font-mono text-neutral-400">
                  EVIDENCE {evidenceId}
                </div>
              </div>

              {file && file.type.startsWith('video/') && (
                <TimeLine
                  duration={duration || 10}
                  currentTime={currentTime}
                  segments={result.manipulated_segments}
                  onSeek={(time) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = time;
                      videoRef.current.play();
                    }
                  }}
                />
              )}
            </div>

            {/* RIGHT: REPORT */}
            <div className="lg:col-span-4 space-y-4">

              {/* VERDICT CARD */}
              <div className={`p-6 rounded-sm border-2 ${result.video_is_fake ? 'bg-forensics-red/5 border-forensics-red' : 'bg-forensics-green/5 border-forensics-green'}`}>
                <div className="flex items-center gap-3 mb-4">
                  {result.video_is_fake ? <AlertTriangle className="text-forensics-red" /> : <CheckCircle className="text-forensics-green" />}
                  <h3 className={`text-lg font-bold tracking-tight ${result.video_is_fake ? 'text-forensics-red' : 'text-forensics-green'}`}>
                    {result.video_is_fake ? 'MANIPULATION DETECTED' : 'AUTHENTIC MEDIA'}
                  </h3>
                </div>
                <div className="text-center mb-2">
                  <div className={`text-4xl font-mono font-medium ${result.video_is_fake ? 'text-forensics-red' : 'text-forensics-green'}`}>
                    {(result.overall_confidence * 100).toFixed(1)}%
                  </div>
                  <div className={`text-[10px] uppercase tracking-widest mt-1 font-semibold ${result.video_is_fake ? 'text-forensics-red-dark' : 'text-green-700'}`}>
                    Confidence Score
                  </div>
                </div>
                <div className="text-[10px] text-neutral-500 italic text-center mt-4 border-t border-neutral-700/20 pt-3">
                  This assessment is probabilistic. Review evidence segments below.
                </div>
              </div>

              {/* LOGS */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-sm flex flex-col h-[300px]">
                <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-850">
                  <h4 className="text-xs font-semibold text-neutral-300">Detected Segments ({result.manipulated_segments?.length || 0})</h4>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                  {result.manipulated_segments?.length === 0 ? (
                    <div className="text-center p-8 text-neutral-600 text-xs italic">No anomalies detected.</div>
                  ) : (
                    result.manipulated_segments.map((seg, i) => (
                      <div
                        key={i}
                        className="bg-neutral-950 border border-neutral-800 p-3 rounded-sm hover:border-neutral-600 cursor-pointer group transition-all"
                        onClick={() => {
                          const parts = seg.start_time.split(':').map(Number);
                          const time = parts[0] * 3600 + parts[1] * 60 + parts[2];
                          if (videoRef.current) videoRef.current.currentTime = time;
                        }}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] font-mono text-forensics-blue group-hover:text-white transition-colors">
                            {seg.start_time} - {seg.end_time}
                          </span>
                          <span className="text-[10px] text-forensics-red font-bold">{(seg.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="text-[10px] text-neutral-500">Temporal Inconsistency Detected</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 flex items-center justify-center gap-2 transition-colors">
                <Download size={14} />
                EXPORT REPORT (JSON)
              </button>
              <div className="text-center text-[9px] text-neutral-600 font-mono">
                Report generated: {new Date().toLocaleTimeString()} UTC
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default App
