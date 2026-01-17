import React from 'react';

const Timeline = ({ duration, segments, currentTime, onSeek }) => {
    const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-neutral-900 border-t border-neutral-700 p-4 h-[140px] flex flex-col justify-center">
            {/* Time Labels */}
            <div className="flex justify-between text-neutral-600 text-[10px] font-mono mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            <div
                className="relative h-12 bg-neutral-850 border border-neutral-700 rounded-sm cursor-pointer overflow-hidden group"
                onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percent = x / rect.width;
                    onSeek(percent * duration);
                }}
            >
                {/* Tick Marks (Forensic Scale) */}
                <div className="absolute top-0 w-full h-full pointer-events-none opacity-30">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-0 h-2 w-px bg-neutral-600"
                            style={{ left: `${(i / 20) * 100}%` }}
                        />
                    ))}
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={`major-${i}`}
                            className="absolute bottom-0 h-3 w-px bg-neutral-500"
                            style={{ left: `${(i / 4) * 100}%` }}
                        />
                    ))}
                </div>

                {/* Simulated Waveform Background (Static pattern for aesthetics) */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #fff 2px, #fff 3px)'
                }}></div>

                {/* Progress Bar (Blue Line) */}
                <div
                    className="absolute top-0 bottom-0 left-0 border-r-2 border-forensics-blue z-20 pointer-events-none transition-all duration-75 ease-linear shadow-[0_0_8px_rgba(93,173,226,0.4)]"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                />

                {/* Fake Segments (Red Zones) */}
                {segments.map((seg, idx) => {
                    const parseTime = (t) => {
                        const parts = t.split(':').map(Number);
                        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                        return 0;
                    };

                    const start = parseTime(seg.start_time);
                    const end = parseTime(seg.end_time);
                    const left = (start / duration) * 100;
                    const width = ((end - start) / duration) * 100;

                    return (
                        <div
                            key={idx}
                            className="absolute top-0 bottom-0 bg-forensics-red/30 border-t-2 border-forensics-red z-10 hover:opacity-100 hover:bg-forensics-red/40 transition-all"
                            style={{ left: `${left}%`, width: `${width}%` }}
                            title={`ANOMALY DETECTED: ${seg.start_time} - ${seg.end_time}`}
                        >
                            <span className="absolute -top-3 left-0 text-[8px] text-forensics-red font-bold uppercase tracking-wider bg-black/50 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Anomaly
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex gap-6 text-[10px] text-neutral-500 font-mono tracking-wide justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-1 bg-forensics-blue"></div>
                    <span>Current Position</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-forensics-red/30 border border-forensics-red"></div>
                    <span>Detected Manipulation</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-neutral-600"></div>
                    <span>Verified Authentic</span>
                </div>
            </div>
        </div>
    );
};

export default Timeline;
