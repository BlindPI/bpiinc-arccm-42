
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

interface QrScannerProps {
  onCodeDetected: (code: string) => void;
}

export function QrScanner({ onCodeDetected }: QrScannerProps) {
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [scanning, setScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<number | null>(null);

  // Handle camera initialization
  const initializeCamera = async () => {
    try {
      setCameraError(null);
      setScanning(true);
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasCamera(true);
        startScanning();
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please check your permissions.');
      setScanning(false);
      setHasCamera(false);
    }
  };

  // Start QR code scanning
  const startScanning = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    // Create a canvas context for image processing
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    
    // Set up interval to scan for QR codes
    intervalRef.current = window.setInterval(() => {
      if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
        // Get video dimensions
        const videoWidth = videoRef.current.videoWidth;
        const videoHeight = videoRef.current.videoHeight;
        
        // Set canvas dimensions to match video
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Here we would use a QR code library to detect codes
        // For now, we'll simulate detection
        simulateQrDetection();
      }
    }, 500);
  };

  // Simulate QR code detection (in a real app, use a library like jsQR)
  const simulateQrDetection = () => {
    // For demonstration - we'll use a timeout to simulate finding a code
    // In a real implementation, this would be replaced with actual QR detection logic
    setTimeout(() => {
      if (Math.random() > 0.95 && scanning) {  // 5% chance of "detecting" a code
        const fakeCodes = ['ABC12345DE', 'XYZ98765FG', 'LMN24680JK'];
        const detectedCode = fakeCodes[Math.floor(Math.random() * fakeCodes.length)];
        handleCodeDetected(detectedCode);
      }
    }, 3000);
  };

  // Handle a detected QR code
  const handleCodeDetected = (code: string) => {
    stopScanning();
    toast.success('QR Code detected!');
    onCodeDetected(code);
  };

  // Stop scanning and release camera
  const stopScanning = () => {
    setScanning(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Release camera
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-md overflow-hidden">
        {scanning ? (
          <>
            <video 
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scan area overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border-2 border-white/70 rounded w-3/4 h-1/2 flex items-center justify-center">
                <div className="animate-pulse text-white/80">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Scanning...</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
            {cameraError ? (
              <div className="text-center p-4">
                <p className="mb-2">{cameraError}</p>
                <Button 
                  variant="outline" 
                  onClick={initializeCamera}
                  className="mt-2"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="text-center p-4">
                <Camera className="h-8 w-8 mx-auto mb-2" />
                <p className="mb-2">Camera ready</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-center">
        <Button
          onClick={scanning ? stopScanning : initializeCamera}
          variant={scanning ? "destructive" : "default"}
          className="w-full"
        >
          {scanning ? "Stop Scanning" : "Start Scanning"}
          <Camera className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Position the QR code within the scanning area. Keep your device steady.
      </p>
    </div>
  );
}
