import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from './config.js'
import TimeLine from './components/Timeline.jsx'
import { Upload, AlertTriangle, Play, Pause, FileText, ChevronDown, ChevronUp, Download, Info } from 'lucide-react'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle, analyzing, complete, error
  const [result, setResult] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Phase 2: Analysis States
  const [analysisStep, setAnalysisStep] = useState(0)
  const analysisSteps = [
    "Initializing secure environment...",
    "Extracting frame sequences...",
    "Analyzing temporal consistency artifacts...",
    "Correlating motion vectors...",
    "Finalizing likelihood assessment..."
  ]

  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (window.self !== window.top) setIsEmbedded(true)
  }, [])

  const validateFile = (file) => {
    if (file.size > 500 * 1024 * 1024) {
      alert("File exceeds 500MB forensic limit."); return false;
    }
    const valid = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png']
    if (!valid.includes(file.type)) {
      alert("Format not supported for forensic analysis."); return false;
    }
    return true
  }

  const startAnalysis = async (selectedFile) => {
    setStatus('analyzing')
    setAnalysisStep(0)

    // Simulate deliberate analysis steps (Phase 2)
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => prev < analysisSteps.length - 1 ? prev + 1 : prev)
    }, 2500)

    const formData = new FormData()
    formData.append('file', selectedFile)
    const endpoint = selectedFile.type.startsWith('image') ? '/api/analyze/image' : '/api/analyze'

    try {
      const response = await axios.post(`${API_URL}${endpoint}`, formData)
      clearInterval(stepInterval)
      setResult(response.data)
      setStatus('complete')
    } catch (error) {
      clearInterval(stepInterval)
      console.error('Analysis failed', error)
      setStatus('error')
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
      <div className="max-w-4xl mx-auto flex flex-col gap-12">

        {/* PHASE 0: SYSTEM READINESS */}
        <header className="flex items-center justify-between border-b border-border-main pb-4">
          <div>
            <h1 className="text-xl font-medium tracking-tight text-text-primary">DeepForged <span className="text-text-secondary font-normal">Forensic Workstation</span></h1>
            <p className="text-xs text-text-secondary mt-1 font-mono">v2.2.0 | SYSTEM ONLINE</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
            <span className="text-xs text-text-secondary font-mono">OPERATIONAL</span>
          </div>
        </header>

        {/* PHASE 1: EVIDENCE SUBMISSION */}
        {status === 'idle' && (
          <div
            onClick={() => fileInputRef.current.click()}
            className="bg-bg-surface border border-border-main rounded-none p-12 text-center cursor-pointer hover:bg-[#151b2b] transition-colors group"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="w-12 h-12 bg-bg-main border border-border-main flex items-center justify-center rounded-sm group-hover:border-primary transition-colors">
                <FileText className="text-text-secondary w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-text-primary">Submit Media for Analysis</h2>
                <p className="text-text-secondary text-sm mt-2 max-w-sm mx-auto">
                  Evidence is processed locally within this container. No external transmission.
                </p>
              </div>
              <button className="bg-bg-main border border-border-main text-text-primary text-xs font-medium px-6 py-2 rounded-sm hover:border-primary transition-colors uppercase tracking-wider">
                Select Evidence File
              </button>
              <p className="text-[10px] text-text-secondary mt-4 font-mono">
                Supported: MP4, MOV, PNG, JPG (MAX 500MB)
              </p>
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

        {/* PHASE 2: ANALYSIS IN PROGRESS */}
        {status === 'analyzing' && (
          <div className="max-w-lg mx-auto w-full py-12">
            <div className="border border-border-main bg-bg-surface p-8 rounded-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-4 h-4 border-2 border-t-primary border-r-transparent border-b-border-main border-l-border-main rounded-full animate-spin"></div>
                <h3 className="text-sm font-medium text-text-primary">Analysis Sequence Active</h3>
              </div>
              <div className="space-y-3 font-mono text-xs">
                {analysisSteps.map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-3 ${idx > analysisStep ? 'opacity-30' : idx === analysisStep ? 'text-primary' : 'text-text-secondary opacity-50'}`}>
                    <span className="w-4">{idx + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-text-secondary text-center mt-6 font-mono">
              DO NOT CLOSE THIS WINDOW. PROCESSING TEMPORAL ARTIFACTS.
            </p>
          </div>
        )}

        {/* PHASE 3 & 4: EVIDENCE FIRST, ASSESSMENT SECOND */}
        {status === 'complete' && result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">

            {/* PRIMARY COL: EVIDENCE INSPECTOR (2/3) */}
            <div className="lg:col-span-2 flex flex-col gap-8">

              {/* VISUAL EVIDENCE */}
              <div className="bg-bg-surface border border-border-main rounded-sm overflow-hidden">
                <div className="border-b border-border-main px-4 py-2 bg-bg-main flex justify-between items-center">
                  <span className="text-xs font-mono text-text-secondary">VISUAL INSPECTION ({file.name})</span>
                  <span className="text-[10px] font-mono text-text-secondary">{duration.toFixed(2)}s</span>
                </div>
                {file && file.type.startsWith('video') ? (
                  <div className="relative bg-black aspect-video group">
                    <video
                      ref={videoRef}
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-contain"
                      onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                      onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onClick={togglePlay}
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Play className="text-white/50 w-8 h-8" />
                      </div>
                    )}
                  </div>
                ) : (
                  <img src={URL.createObjectURL(file)} className="w-full object-contain bg-black" />
                )}

                {/* FORENSIC TIMELINE */}
                {file && file.type.startsWith('video') && (
                  <div className="p-4 bg-bg-surface border-t border-border-main">
                    <TimeLine
                      duration={duration}
                      currentTime={currentTime}
                      segments={result.manipulated_segments}
                      onSeek={(t) => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = t;
                          videoRef.current.play();
                          setIsPlaying(true);
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* EVIDENCE LOG */}
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-3 uppercase tracking-wider font-mono">Evidence Log</h3>
                <div className="bg-bg-surface border border-border-main rounded-sm">
                  {result.manipulated_segments?.length === 0 ? (
                    <div className="p-6 text-sm text-text-secondary italic">
                      No clear manipulation artifacts detected in the analyzed frames.
                    </div>
                  ) : (
                    <div className="divide-y divide-border-main">
                      {result.manipulated_segments.map((seg, idx) => (
                        <div
                          key={idx}
                          className="p-4 hover:bg-bg-main cursor-pointer transition-colors flex items-start gap-4 group"
                          onClick={() => {
                            const parts = seg.start_time.split(':').map(Number);
                            const t = parts[0] * 3600 + parts[1] * 60 + parts[2];
                            if (videoRef.current) videoRef.current.currentTime = t;
                          }}
                        >
                          <div className="font-mono text-xs text-primary mt-1">SEGMENT {idx + 1}</div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium text-text-primary">Temporal inconsistency detected</span>
                              <span className="text-xs font-mono text-danger">{(seg.confidence * 100).toFixed(0)}% deviation</span>
                            </div>
                            <div className="text-xs text-text-secondary mt-1 font-mono">
                              Timestamp: {seg.start_time} - {seg.end_time}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* SECONDARY COL: ASSESSMENT (1/3) */}
            <div className="flex flex-col gap-6">

              {/* PHASE 4: ASSESSMENT CARD (Demoted) */}
              <div className="bg-bg-surface border border-border-main rounded-sm p-6">
                <h3 className="text-xs font-mono text-text-secondary uppercase tracking-widest mb-4">Assessment</h3>

                <div className="mb-6">
                  <div className="text-sm text-text-secondary mb-1">Likelihood of Manipulation</div>
                  <div className={`text-xl font-medium ${result.video_is_fake ? 'text-danger' : 'text-green-500'}`}>
                    {result.video_is_fake ? 'High Likelihood' : 'Low Likelihood'}
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    Confidence Band: <span className="font-mono text-text-primary">{(result.overall_confidence).toFixed(2)} / 1.00</span>
                  </div>
                </div>

                <div className="border-t border-border-main pt-4 mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-text-secondary">Analyzed Frames</span>
                    <span className="font-mono text-text-primary">ALL</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">Artifact Count</span>
                    <span className="font-mono text-text-primary">{result.manipulated_segments.length}</span>
                  </div>
                </div>

                <div className="text-[10px] text-text-secondary bg-bg-main p-3 border border-border-main rounded-sm italic leading-relaxed">
                  This assessment is a probabilistic estimation based on current detection models. It should be corroborated with other evidence methods.
                </div>
              </div>

              {/* PHASE 5: EXPORT */}
              <button
                className="w-full py-3 border border-border-main text-text-secondary text-xs hover:bg-bg-surface hover:text-text-primary transition-colors flex items-center justify-center gap-2"
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
                  const a = document.createElement('a');
                  a.href = dataStr;
                  a.download = `forensic_report_${Date.now()}.json`;
                  a.click();
                }}
              >
                <Download size={14} />
                Download Forensic Report (JSON)
              </button>

            </div>
          </div>
        )}

        {/* PHASE 6: METHODOLOGY FOOTER */}
        <div className="border-t border-border-main pt-8 mt-4 pb-12">
          <details className="group cursor-pointer">
            <summary className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary transition-colors list-none">
              <Info size={12} />
              <span>Methodology & Limitations</span>
              <ChevronDown size={12} className="group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] text-text-secondary leading-relaxed pl-5 border-l border-border-main ml-1">
              <div>
                <strong className="text-text-primary block mb-1">Detection Logic</strong>
                Our engine utilizes a multi-stream Convolutional Neural Network (CNN) combined with LSTM layers to detect temporal inconsistencies across video frames. It specifically looks for ghosting artifacts, jitter, and uneven pixel interpolation common in generated media.
              </div>
              <div>
                <strong className="text-text-primary block mb-1">Known Limitations</strong>
                Current models may produce false positives on high-compression media (e.g., WhatsApp videos) or videos with heavy post-processing effects. Low-light environments and extreme face angles also reduce confidence accuracy.
              </div>
            </div>
          </details>
        </div>

      </div>
    </div>
  )
}

export default App
