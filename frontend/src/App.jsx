import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from './config.js'
import TimeLine from './components/Timeline.jsx'
import { Upload, AlertTriangle, Play, Pause } from 'lucide-react'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle, uploading, analyzing, complete, error
  const [result, setResult] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  // System Check
  useEffect(() => {
    if (window.self !== window.top) {
      setIsEmbedded(true)
    }
  }, [])

  const validateFile = (file) => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png']

    if (file.size > maxSize) {
      alert("File exceeds 500MB limit.")
      return false
    }
    if (!validTypes.includes(file.type)) {
      alert("Invalid format. Supported: MP4, AVI, MOV, JPG, PNG")
      return false
    }
    return true
  }

  const startAnalysis = async (selectedFile) => {
    setStatus('analyzing')

    const formData = new FormData()
    formData.append('file', selectedFile)

    const isImage = selectedFile.type.startsWith('image/')
    const endpoint = isImage ? '/api/analyze/image' : '/api/analyze'

    try {
      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setResult(response.data)
      setStatus('complete')
    } catch (error) {
      console.error('Analysis failed', error)
      setStatus('error')
    }
  }

  // Video Logic
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

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }

  return (
    <div className={`min-h-screen bg-bg-main text-text-primary font-sans ${isEmbedded ? 'p-4' : 'p-8'}`}>

      <div className="max-w-3xl mx-auto flex flex-col gap-8">

        {/* HEADER */}
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-text-primary">DeepForged Forensics <span className="text-xs text-text-secondary font-normal ml-2">v2.1 (Strict)</span></h1>
          <p className="text-text-secondary text-sm">Temporal Localization Engine</p>
        </header>

        {/* UPLOAD CARD */}
        {status === 'idle' && (
          <div
            onClick={() => fileInputRef.current.click()}
            className="bg-bg-surface border border-border-main rounded-xl p-8 text-center cursor-pointer hover:border-text-secondary transition-colors"
          >
            <div className="flex flex-col items-center gap-4">
              <Upload className="text-text-secondary w-8 h-8" />
              <div>
                <h2 className="text-lg font-medium text-text-primary">Drop Evidence Here</h2>
                <p className="text-text-secondary text-sm mt-1">MP4, AVI, MOV, JPG (Max 500MB)</p>
              </div>
              <button className="bg-primary hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg mt-2">
                Select File
              </button>
              <p className="text-xs text-text-secondary mt-4">analysis takes 3-15 minutes</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && validateFile(file)) {
                  setFile(file);
                  startAnalysis(file);
                }
              }}
            />
          </div>
        )}

        {/* LOADING STATE */}
        {status === 'analyzing' && (
          <div className="text-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-text-secondary border-t-primary rounded-full mx-auto mb-4"></div>
            <p className="text-text-secondary text-sm">Analyzing media... This may take up to 30 seconds.</p>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div className="bg-bg-surface border border-danger rounded-xl p-6 text-center">
            <h3 className="text-danger font-medium mb-2">Analysis Failed</h3>
            <p className="text-text-secondary text-sm mb-4">File processing error or timeout.</p>
            <button onClick={() => setStatus('idle')} className="text-primary text-sm hover:underline">Try Again</button>
          </div>
        )}

        {/* RESULTS DASHBOARD */}
        {status === 'complete' && result && (
          <>
            {/* 1. MEDIA PREVIEW */}
            <div className="bg-bg-surface border border-border-main rounded-xl overflow-hidden">
              {file && file.type.startsWith('image') ? (
                <img src={URL.createObjectURL(file)} className="w-full h-auto object-contain" />
              ) : (
                <div className="relative bg-black aspect-video">
                  <video
                    ref={videoRef}
                    src={URL.createObjectURL(file)}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onClick={togglePlay}
                  />
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                        <Play className="text-white fill-white ml-1 w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. SUMMARY CARD */}
            <div className="bg-bg-surface border border-border-main rounded-xl p-6">
              <h3 className="text-lg font-medium text-text-primary mb-4">Analysis Summary</h3>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-text-secondary">Overall Confidence</div>
                  <div className={`text-2xl font-semibold mt-1 ${result.video_is_fake ? 'text-danger' : 'text-primary'}`}>
                    {(result.overall_confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-text-secondary">Verdict</div>
                  <div className="text-base font-medium text-text-primary mt-1">
                    {result.video_is_fake ? 'Possible Manipulation' : 'Authentic Media'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. TIMELINE CARD */}
            {file && !file.type.startsWith('image') && (
              <div className="bg-bg-surface border border-border-main rounded-xl p-6">
                <h3 className="text-lg font-medium text-text-primary mb-2">Temporal Timeline</h3>
                <TimeLine
                  duration={duration}
                  currentTime={currentTime}
                  segments={result.manipulated_segments}
                  onSeek={(t) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = t;
                    }
                  }}
                />
              </div>
            )}

            {/* 4. EVIDENCE CARDS */}
            {result.manipulated_segments && result.manipulated_segments.length > 0 && (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-medium text-text-primary">Evidence List</h3>
                {result.manipulated_segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className="bg-bg-surface border border-border-main rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start cursor-pointer hover:border-text-secondary transition-colors"
                    onClick={() => {
                      const parts = seg.start_time.split(':').map(Number);
                      const t = parts[0] * 3600 + parts[1] * 60 + parts[2];
                      if (videoRef.current) {
                        videoRef.current.currentTime = t;
                        videoRef.current.play();
                        setIsPlaying(true);
                      }
                    }}
                  >
                    {/* Thumbnail Placeholder (since we don't have real thumbnails extracted yet) */}
                    <div className="w-24 h-24 bg-black rounded-lg flex-shrink-0 flex items-center justify-center text-xs text-text-secondary">
                      Frame View
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-medium text-text-secondary">Segment {idx + 1}</div>
                          <div className="text-base text-text-primary mt-1 font-mono">
                            {seg.start_time} - {seg.end_time}
                          </div>
                        </div>
                        <div className="text-danger font-medium text-sm">
                          {(seg.confidence * 100).toFixed(0)}% Conf.
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-text-secondary">
                        Temporal inconsistency detected in frame sequence.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}

export default App
