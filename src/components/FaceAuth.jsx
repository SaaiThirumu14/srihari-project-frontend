import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const FaceAuth = ({ mode = 'verify', onComplete, onCancel }) => {
    const videoRef = useRef();
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        const loadModels = async () => {
            try {
                // Use absolute URL based on window.location.origin
                const MODEL_URL = `${window.location.origin}/models`;
                console.log("Loading face-api models from:", MODEL_URL);
                
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                
                console.log("Face-api models loaded successfully");
                setModelsLoaded(true);
                setStatus('Models loaded. Starting camera...');
            } catch (err) {
                console.error("Critical: Model loading error:", err);
                setError(`Failed to load face detection models. (${err.message})`);
            }
        };
        loadModels();
    }, []);

    useEffect(() => {
        let stream = null;
        if (modelsLoaded) {
            const startVideo = async () => {
                try {
                    console.log("Requesting camera access...");
                    stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { 
                            width: { ideal: 640 }, 
                            height: { ideal: 480 },
                            facingMode: "user"
                        } 
                    });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    setStatus('Camera ready. Please align your face.');
                } catch (err) {
                    console.error("Camera access error:", err);
                    setError(`Camera access failed: ${err.name} - ${err.message}`);
                }
            };
            startVideo();
        }
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [modelsLoaded]);

    const handleCapture = async () => {
        if (!videoRef.current || !modelsLoaded) return;
        
        setIsDetecting(true);
        setStatus(mode === 'enroll' ? 'Capturing face profile...' : 'Verifying identity...');

        try {
            const detections = await faceapi
                .detectSingleFace(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detections) {
                // Return numerical array
                const descriptor = Array.from(detections.descriptor);
                onComplete(descriptor);
                setStatus('Success!');
            } else {
                setError("No face detected. Please face the camera clearly.");
                setIsDetecting(false);
            }
        } catch (err) {
            console.error("Detection error:", err);
            setError("An error occurred during face detection.");
            setIsDetecting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
            <div className="glass-card max-w-md w-full !p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-transparent" />
                
                <h2 className="text-xl font-bold text-white mb-2">
                    {mode === 'enroll' ? 'Biometric Enrollment' : 'Face Verification'}
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                    {mode === 'enroll' 
                        ? 'Position your face in the frame to register your unique profile.' 
                        : 'Checking identity for secure check-in.'}
                </p>

                <div className="relative aspect-video bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden mb-6 group">
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        className="w-full h-full object-cover scale-x-[-1]"
                    />
                    
                    {/* Scanning Animation Overlay */}
                    {isDetecting && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="w-full h-1 bg-primary-400 absolute animate-scan shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
                        </div>
                    )}

                    {!modelsLoaded && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80">
                            <Loader2 className="w-8 h-8 text-primary-400 animate-spin mb-2" />
                            <span className="text-xs text-slate-400 font-mono">Initializing Neural Models...</span>
                        </div>
                    )}
                </div>

                {error ? (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 text-left">
                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <div className="text-xs text-red-200">{error}</div>
                        <button onClick={() => setError(null)} className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 ml-auto">Retry</button>
                    </div>
                ) : (
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6">
                        {status}
                    </p>
                )}

                <div className="flex gap-3">
                    <button 
                        onClick={onCancel}
                        className="btn-secondary flex-1 py-3"
                        disabled={isDetecting}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCapture}
                        disabled={!modelsLoaded || isDetecting}
                        className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                    >
                        {isDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        {mode === 'enroll' ? 'Capture Face' : 'Verify Face'}
                    </button>
                </div>

                <div className="mt-6 flex items-center justify-center gap-4 border-t border-slate-800 pt-6">
                    <div className="flex items-center gap-1.5 opacity-50">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Privacy Secured</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-50">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Neural Verification</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaceAuth;
