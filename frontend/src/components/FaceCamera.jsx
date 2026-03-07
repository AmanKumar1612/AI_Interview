import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

/**
 * FaceCamera — live webcam feed with face presence detection.
 * Shows a floating PiP panel during the interview.
 * Props:
 *   onFaceStatus(detected: boolean) — optional callback
 */
const FaceCamera = ({ onFaceStatus }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const detLoopRef = useRef(null);

    const [camGranted, setCamGranted] = useState(null); // null=pending, true, false
    const [faceDetected, setFaceDetected] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [warning, setWarning] = useState(false);
    const warnTimerRef = useRef(null);

    // ── Load tiny face detector models ──────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                if (!cancelled) setModelsLoaded(true);
            } catch (err) {
                console.warn('Face detection models failed to load:', err.message);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // ── Request webcam ───────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, facingMode: 'user' },
                    audio: false,
                });
                if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => videoRef.current?.play();
                }
                setCamGranted(true);
            } catch {
                if (!cancelled) setCamGranted(false);
            }
        })();
        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach(t => t.stop());
            clearInterval(detLoopRef.current);
        };
    }, []);

    // ── Face detection loop (runs every 800ms) ───────────────────────────────
    useEffect(() => {
        if (!camGranted || !modelsLoaded) return;
        const video = videoRef.current;
        if (!video) return;

        detLoopRef.current = setInterval(async () => {
            if (video.readyState < 2) return; // not ready yet
            try {
                const result = await faceapi.detectSingleFace(
                    video,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 })
                );
                const detected = !!result;
                setFaceDetected(detected);
                onFaceStatus?.(detected);

                if (!detected) {
                    // Show warning after 2 seconds of no face
                    if (!warnTimerRef.current) {
                        warnTimerRef.current = setTimeout(() => setWarning(true), 2000);
                    }
                } else {
                    clearTimeout(warnTimerRef.current);
                    warnTimerRef.current = null;
                    setWarning(false);
                }
            } catch {
                // silently swallow detection errors
            }
        }, 800);

        return () => {
            clearInterval(detLoopRef.current);
            clearTimeout(warnTimerRef.current);
        };
    }, [camGranted, modelsLoaded]);

    // Camera denied or not available — render nothing
    if (camGranted === false) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 50,
                width: '200px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                border: `2px solid ${camGranted === null ? '#475569'            // pending
                        : faceDetected ? '#10b981'            // face detected — green
                            : '#ef4444'             // no face — red
                    }`,
                background: '#0f172a',
                transition: 'border-color 0.4s ease',
            }}
        >
            {/* Status bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                background: 'rgba(15,23,42,0.85)',
                fontSize: '11px',
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                color: faceDetected ? '#10b981' : camGranted === null ? '#94a3b8' : '#ef4444',
            }}>
                <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: faceDetected ? '#10b981' : camGranted === null ? '#94a3b8' : '#ef4444',
                    display: 'inline-block',
                    animation: camGranted && !faceDetected ? 'none' : 'pulse 1.5s infinite',
                }} />
                {camGranted === null ? 'Camera...' : faceDetected ? 'Face detected' : 'No face'}
            </div>

            {/* Video */}
            <video
                ref={videoRef}
                muted
                playsInline
                style={{
                    width: '100%',
                    display: 'block',
                    transform: 'scaleX(-1)', // mirror effect
                    maxHeight: '150px',
                    objectFit: 'cover',
                    background: '#0f172a',
                    opacity: camGranted ? 1 : 0.3,
                }}
            />

            {/* Warning overlay */}
            {warning && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(239,68,68,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '4px',
                    pointerEvents: 'none',
                }}>
                    <span style={{ fontSize: '22px' }}>⚠️</span>
                    <span style={{ fontSize: '10px', color: '#fca5a5', fontWeight: 700, textAlign: 'center', padding: '0 8px' }}>
                        Face not visible
                    </span>
                </div>
            )}

            {/* Loading overlay */}
            {camGranted && !modelsLoaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15,23,42,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#94a3b8',
                    fontFamily: 'Inter, sans-serif',
                }}>
                    Loading detector...
                </div>
            )}
        </div>
    );
};

export default FaceCamera;
