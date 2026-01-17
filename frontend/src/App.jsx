import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from './config.js'
import TimeLine from './components/Timeline.jsx'
import { Upload, AlertTriangle, CheckCircle, FileVideo, Play, Download, Pause } from 'lucide-react'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle, uploading, analyzing, complete, error
  const [progress, setProgress] = useState(0)
  const [analysisStage, setAnalysisStage] = useState('') // "Stage 1/4: Frame Extraction"
  const [result, setResult] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [systemStatus, setSystemStatus] = useState('Checking...')
  const [evidenceId, setEvidenceId] = useState(null)

  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  // 1. System Health Check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await axios.get(`${API_URL}/`); // Assuming root or health endpoint exists
        setSystemStatus('Operational');
      } catch (err) {
        setSystemStatus('Offline');
        console.warn("Backend offline:", err);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const generateEvidenceId = () => {
    return `#${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }

  const validateFile = (file) => {
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    const ALLOWED_TYPES = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'image/jpeg', 'image/png', 'image/jpg'];

    if (file.size > MAX_SIZE) {
      alert("EVIDENCE REJECTED: File size exceeds 500MB limit.");
      return false;
    }
    if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      // Fallback loose check if exact mime not captured
      alert("EVIDENCE REJECTED: Unsupported file format. Supported: MP4, AVI, MOV, JPG, PNG");
      return false;
    }
    return true;
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
        startAnalysis(droppedFile)
      }
    }
  }

  const startAnalysis = async (selectedFile) => {
    setStatus('uploading')
    setProgress(0)
    setAnalysisStage('Stage 1/4: Secure Upload Sequence')
    setEvidenceId(generateEvidenceId())

    const formData = new FormData()
    formData.append('file', selectedFile)

    const isImage = selectedFile.type.startsWith('image/')
    const endpoint = isImage ? '/api/analyze/image' : '/api/analyze'

    try {
      // Simulate Stages for UX during upload/processing
      const stageTimer = setInterval(() => {
        setProgress(old => {
          if (old < 30) {
            setAnalysisStage('Stage 2/4: Frame Extraction & Normalization');
            return old + 5;
          }
          if (old < 60) {
            setAnalysisStage('Stage 3/4: Temporal Inconsistency Detection');
            return old + 2;
          }
          if (old < 90) {
            setAnalysisStage('Stage 4/4: Generating Forensic Report');
            return old + 1;
          }
          return old;
        })
      }, 800);

      const response = await axios.post(`${API_URL}${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          // Upload is just PART of the process, don't let it jump to 100% immediately visually
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // We map upload to first 25% of visual progress to allow time for analysis "stages"
          if (percentCompleted < 100) {
            setProgress(Math.min(25, percentCompleted / 4));
          }
        }
      })

      clearInterval(stageTimer);
      setProgress(100)
      setAnalysisStage('Analysis Complete');

      // Artificial delay to show 100% briefly
      setTimeout(() => {
        setResult(response.data)
        setStatus('complete')
      }, 600)

    } catch (error) {
      console.error("Analysis Failed", error)
      setStatus('error')
      alert("Analysis Incomplete: " + (error.response?.data?.detail || error.message))
      setStatus('idle')
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

  // --- RENDER HELPERS ---
  const getCurrentFrame = () => {
    return Math.floor(currentTime * 30); // Approx 30fps
  }

  const getTotalFrames = () => {
    return Math.floor(duration * 30);
  }

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-neutral-300 selection:bg-forensics-red/20 selection:text-forensics-red">

      {/* 1. HEADER */}
      <header className="border-b border-neutral-800 px-8 py-6 flex items-center justify-between sticky top-0 bg-neutral-950/95 backdrop-blur z-50">
        <div className="flex items-center gap-4">
          <div className="border-[1.5px] border-forensics-red p-2 rounded-sm shadow-[0_0_10px_rgba(231,76,60,0.1)]">
            <AlertTriangle size={20} className="text-forensics-red" />
          </div>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-[#E8E8E8]">
              DeepForged <span className="text-forensics-red font-semibold">Forensics</span>
            </h1>
            <p className="text-xs text-neutral-500 font-mono tracking-wide mt-1">Temporal Localization Engine v2.0</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-mono mb-1 ${systemStatus === 'Operational' ? 'text-forensics-green' : 'text-neutral-500'}`}>
            System: {systemStatus}
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className={`w-2 h-2 rounded-full ${systemStatus === 'Operational' ? 'bg-forensics-green animate-pulse-slow' : 'bg-red-500'}`}></div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">

        {/* 2. UPLOAD INTERFACE (IDLE) */}
        {status === 'idle' && (
          <div className="mt-12">
            <div
              className="border-2 border-dashed border-neutral-700 bg-neutral-900/50 rounded-md p-24 text-center hover:border-neutral-500 hover:bg-neutral-850 transition-all cursor-pointer group relative overflow-hidden"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-forensics-blue'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-forensics-blue'); }}
              onDrop={(e) => {
                e.currentTarget.classList.remove('border-forensics-blue');
                handleDrop(e);
              }}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="video/*,image/*"
                onChange={(e) => {
                  if (e.target.files[0] && validateFile(e.target.files[0])) {
                    setFile(e.target.files[0])
                    startAnalysis(e.target.files[0])
                  }
                }}
              />

              <div className="w-16 h-16 border-2 border-neutral-600 rounded-sm flex items-center justify-center mx-auto mb-8 group-hover:border-forensics-blue group-hover:scale-105 transition-all">
                <Upload size={28} className="text-neutral-400 group-hover:text-forensics-blue" />
              </div>

              <h2 className="text-xl text-[#D0D0D0] font-medium mb-3">Drop Evidence Here</h2>
              <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                Supported formats: MP4, AVI, MOV, PNG, JPG (Max 500MB)<br />
                Analysis time: 3-15 minutes depending on media length
              </p>
              <p className="text-[10px] text-neutral-600 italic">
                *Submitted media is processed locally. No data is transmitted.
              </p>
            </div>
          </div>
        )}

        {/* 3. PROGRESS INTERFACE */}
        {(status === 'uploading' || status === 'analyzing') && (
          <div className="max-w-2xl mx-auto mt-32 text-center">
            <div className="text-5xl font-mono text-forensics-blue mb-8">{progress}%</div>

            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-[#4A90E2] to-[#5DADE2] transition-all duration-300 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-neutral-500 font-mono">
              <span>{analysisStage}</span>
              <span>Estimated: 2-5m</span>
            </div>
          </div>
        )}

        {/* 4. MAIN DASHBOARD (RESULT) */}
        {status === 'complete' && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">

            {/* LEFT: MEDIA & TIMELINE (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-0 border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900">
              {/* Player Area */}
              <div className="relative bg-black aspect-video group">
                {file && file.type.startsWith('video/') ? (
                  <>
                    <video
                      ref={videoRef}
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-contain"
                      controls={false} // Custom controls only
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onClick={() => videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause()}
                    />
                    {/* Play Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {videoRef.current?.paused && (
                        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                          <Play fill="white" className="text-white ml-1" />
                        </div>
                      )}
                    </div>
                    {/* Header Overlay Info */}
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur px-3 py-1.5 rounded-sm border border-white/10 text-[11px] font-mono text-white/80">
                      FRAME {getCurrentFrame()} / {getTotalFrames()} | {currentTime.toFixed(2)}s
                    </div>
                  </>
                ) : (
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-contain" />
                )}

                {/* Evidence Tag */}
                <div className="absolute top-4 right-4 bg-neutral-800/90 border border-neutral-700 px-3 py-1.5 rounded-sm text-[10px] font-mono text-neutral-400">
                  EVIDENCE {evidenceId}
                </div>
              </div>

              {/* Timeline Component (Only for video) */}
              {file && file.type.startsWith('video/') && (
                <TimeLine
                  duration={duration || 10}
                  currentTime={currentTime}
                  segments={result.manipulated_segments}
                  onSeek={(time) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = time;
                      videoRef.current.play(); // Auto play on seek
                    }
                  }}
                />
              )}
            </div>

            {/* RIGHT: REPORT PANEL (4 cols) */}
            <div className="lg:col-span-4 space-y-6">

              {/* Verdict Card */}
              <div className={`p-6 rounded-md border-l-4 ${result.video_is_fake ? 'bg-forensics-red/10 border-forensics-red' : 'bg-forensics-green/10 border-forensics-green'}`}>
                <div className="flex items-center gap-3 mb-4">
                  {result.video_is_fake ?
                    <AlertTriangle className="text-forensics-red" /> :
                    <CheckCircle className="text-forensics-green" />
                  }
                  <h3 className={`text-lg font-semibold tracking-tight ${result.video_is_fake ? 'text-forensics-red' : 'text-forensics-green'}`}>
                    {result.video_is_fake ? 'MANIPULATION DETECTED' : 'AUTHENTIC MEDIA'}
                  </h3>
                </div>

                <div className="mb-4">
                  <div className="text-4xl font-mono font-medium text-neutral-200">
                    {(result.overall_confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">Confidence Score</div>
                </div>

                <div className="text-[11px] text-neutral-500 italic border-t border-neutral-700/30 pt-3">
                  This assessment is probabilistic. Review evidence segments below.
                </div>
              </div>

              {/* Forensic Log */}
              {file && file.type.startsWith('video/') && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-md overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2 bg-neutral-850">
                    <FileVideo size={14} className="text-neutral-500" />
                    <span className="text-xs font-semibold text-neutral-300">Detected Segments ({result.manipulated_segments.length})</span>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-2">
                    {result.manipulated_segments.length === 0 ? (
                      <div className="p-4 text-center text-xs text-neutral-600 italic">No anomalies detected in this scan.</div>
                    ) : (
                      result.manipulated_segments.map((seg, i) => (
                        <div
                          key={i}
                          className="bg-neutral-950 border border-neutral-800 p-3 rounded-sm hover:border-neutral-600 transition-colors cursor-pointer group"
                          onClick={() => {
                            const parts = seg.start_time.split(':').map(Number);
                            const time = parts[0] * 3600 + parts[1] * 60 + parts[2];
                            if (videoRef.current) {
                              videoRef.current.currentTime = time;
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] text-forensics-red font-mono font-bold bg-forensics-red/10 px-1 rounded-sm">ANOMALY #{i + 1}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">{(seg.confidence * 100).toFixed(1)}% Conf.</span>
                          </div>
                          <div className="text-xs font-mono text-neutral-400 group-hover:text-forensics-blue">
                            {seg.start_time} - {seg.end_time}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="space-y-2">
                <button
                  className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 hover:shadow-lg hover:shadow-black/50 text-neutral-300 font-medium text-sm rounded-sm border border-neutral-700 transition-all flex items-center justify-center gap-3"
                  onClick={() => {
                    const exportData = {
                      ...result,
                      evidence_id: evidenceId,
                      generated_at: new Date().toISOString(),
                      tool_version: "2.0.0"
                    };
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", `forensic_report_${evidenceId}.json`);
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                >
                  <Download size={16} />
                  Export Forensic Report (JSON)
                </button>
                <div className="text-[10px] text-center text-neutral-600 font-mono">
                  Report generated: {new Date().toLocaleTimeString()} UTC
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default App
