import React, { useRef, useEffect } from 'react';

const Timeline = ({ duration, segments, currentTime, onSeek }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Timeline Rendering Logic
    const draw = (ctx, width, height) => {
        // Clear background
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 0, width, height);

        // 1. Draw Time Scale
        const tickInterval = Math.max(1, Math.floor(duration / 20)); // Adaptive ticks

        for (let i = 0; i <= duration; i += tickInterval) {
            const x = (i / duration) * width;

            // Major tick every 5 intervals
            const isMajor = i % (tickInterval * 5) === 0;
            const tickHeight = isMajor ? 12 : 6;

            ctx.strokeStyle = isMajor ? '#666666' : '#444444';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, height - tickHeight);
            ctx.lineTo(x, height);
            ctx.stroke();

            // Time label for major ticks
            if (isMajor) {
                const mins = Math.floor(i / 60);
                const secs = Math.floor(i % 60);
                const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

                ctx.fillStyle = '#999999';
                ctx.font = '10px "IBM Plex Mono"';
                ctx.textAlign = 'center';
                ctx.fillText(timeStr, x, height - 16);
            }
        }

        // 2. Draw Manipulation Segments (Red Zones)
        segments.forEach((seg, idx) => {
            // Parse time "HH:MM:SS" -> seconds
            const parseTime = (t) => {
                const parts = t.split(':').map(Number);
                if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                return 0;
            };
            const startStr = parseTime(seg.start_time);
            const endStr = parseTime(seg.end_time);

            const startX = (startStr / duration) * width;
            const endX = (endStr / duration) * width;
            const segWidth = endX - startX;

            // Background
            ctx.fillStyle = 'rgba(231, 76, 60, 0.3)';
            ctx.fillRect(startX, 0, segWidth, height - 20);

            // Top Border
            ctx.strokeStyle = '#E74C3C';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            ctx.lineTo(endX, 0);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#E74C3C';
            ctx.font = 'bold 9px "IBM Plex Mono"';
            ctx.textAlign = 'left';
            // Ensure text fits
            if (segWidth > 50) {
                ctx.fillText(`ANOMALY ${idx + 1}`, startX + 4, 12);
            }
        });

        // 3. Draw Current Time Indicator (Blue Line)
        const currentX = (currentTime / duration) * width;
        ctx.strokeStyle = '#5DADE2';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(93, 173, 226, 0.4)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height - 20);
        ctx.stroke();
        ctx.shadowBlur = 0;
    };

    // Handle Resize & Drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');

        const resizeAndDraw = () => {
            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            ctx.scale(dpr, dpr);
            draw(ctx, rect.width, rect.height);
        };

        // Initial Draw
        resizeAndDraw();

        // Resize Observer
        const observer = new ResizeObserver(resizeAndDraw);
        observer.observe(container);

        return () => observer.disconnect();
    }, [duration, segments, currentTime]); // Re-draw on updates

    // Click to Seek
    const handleCanvasClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickTime = (x / rect.width) * duration;
        onSeek(Math.max(0, Math.min(clickTime, duration)));
    };

    return (
        <div ref={containerRef} className="w-full bg-neutral-900 border-t border-neutral-700 p-4">
            <div className="timeline-container h-[80px] w-full bg-[#1A1A1A] relative cursor-pointer group">
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="w-full h-full block"
                />
            </div>

            {/* Legend */}
            <div className="flex gap-6 text-[10px] text-neutral-500 font-mono tracking-wide justify-center mt-3">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-forensics-blue rounded-sm"></div>
                    <span>Current Position</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-forensics-red/30 border border-forensics-red rounded-sm"></div>
                    <span>Detected Manipulation</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-forensics-green/30 border border-forensics-green rounded-sm"></div>
                    <span>Verified Authentic</span>
                </div>
            </div>
        </div>
    );
};

export default Timeline;
