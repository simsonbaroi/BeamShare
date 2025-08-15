import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Video } from "lucide-react";
import { startQRScanner, stopQRScanner } from "@/lib/qr-utils";
import { toast } from "@/hooks/use-toast";

interface QrScannerProps {
  onCodeScanned: (code: string) => void;
}

export function QrScanner({ onCodeScanned }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const startCamera = async () => {
    try {
      if (videoRef.current) {
        await startQRScanner(videoRef.current, (result) => {
          onCodeScanned(result);
          stopCamera();
          toast({
            title: "QR Code scanned",
            description: "Attempting to connect..."
          });
        });
        setIsScanning(true);
        setHasPermission(true);
      }
    } catch (error) {
      setHasPermission(false);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to scan QR codes.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      stopQRScanner(videoRef.current);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="glass">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
          <Camera className="mr-3 text-purple-500" />
          Scan QR Code
        </h3>
        
        <div className="qr-scanner mb-4">
          {isScanning ? (
            <video 
              ref={videoRef}
              className="w-full h-64 object-cover rounded-xl"
              autoPlay
              playsInline
              muted
              data-testid="qr-scanner-video"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Camera className="text-gray-400 text-4xl mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {hasPermission === false 
                    ? "Camera access required" 
                    : "Click to start camera"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
        
        <Button
          onClick={isScanning ? stopCamera : startCamera}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          data-testid="button-camera-toggle"
        >
          <Video className="mr-2 h-4 w-4" />
          {isScanning ? "Stop Camera" : "Start Camera"}
        </Button>
      </CardContent>
    </Card>
  );
}
