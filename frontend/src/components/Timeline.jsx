import React, { useRef, useEffect } from 'react';

const Timeline = ({ duration, segments, currentTime, onSeek }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    // Timeline Rendering Logic
    const draw = (ctx, width, height) => {
        // Clear (transparent)
        ctx.clearRect(0, 0, width, height);

        // Define Bar Area (centered vertically)
        const barHeight = 8;
        const barY = (height - 20) / 2; // Reserve 20px for labels at bottom

        // 1. Draw Base Bar
        ctx.fillStyle = '#1F2937';
        ctx.beginPath();
        ctx.roundRect(0, barY, width, barHeight, 4);
        ctx.fill();

        // 2. Draw Manipulation Segments (Red Zones)
        segments.forEach((seg) => {
            const parseTime = (t) => {
                const parts = t.split(':').map(Number);
                if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                return 0;
            };
            const startSec = parseTime(seg.start_time);
            const endSec = parseTime(seg.end_time);

            const startX = (startSec / duration) * width;
            const endX = (endSec / duration) * width;
            const segWidth = Math.max(endX - startX, 2); // Min 2px visibility

            ctx.fillStyle = '#EF4444';
            ctx.beginPath();
            // Match rounded corners if at edges, otherwise rect
            ctx.roundRect(startX, barY, segWidth, barHeight, 4);
            ctx.fill();
        });

        // 3. Draw Current Time Indicator (Simple vertical line or small handle)
        const currentX = (currentTime / duration) * width;
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath();
        ctx.arc(currentX, barY + barHeight / 2, 6, 0, 2 * Math.PI); // Simple circle handle
        ctx.fill();

        // 4. Time Labels (0s, End, and maybe mid points)
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText("0s", 0, height - 2);

        ctx.textAlign = 'right';
        ctx.fillText(formatTime(duration), width, height - 2);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}m ${s}s`;
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
    }, [duration, segments, currentTime]);

    // Click to Seek
    const handleCanvasClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickTime = (x / rect.width) * duration;
        onSeek(Math.max(0, Math.min(clickTime, duration)));
    };

    return (
        <div ref={containerRef} className="w-full h-12 cursor-pointer mt-4" onClick={handleCanvasClick}>
            <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
    );
};

export default Timeline;
