import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, Clock, Wifi, X } from "lucide-react";
import { generateQRCode } from "@/lib/qr-utils";

interface QrCodeDisplayProps {
  pairingCode: string;
  onCopy: (code: string) => void;
  onCancel: () => void;
  isConnected: boolean;
  onStartTransfer: () => void;
}

export function QrCodeDisplay({ 
  pairingCode, 
  onCopy, 
  onCancel, 
  isConnected,
  onStartTransfer 
}: QrCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && pairingCode) {
      generateQRCode(pairingCode, canvasRef.current);
    }
  }, [pairingCode]);

  return (
    <Card className="glass text-center">
      <CardContent className="p-8">
        <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          <QrCode className="mr-3 text-emerald-500 inline" />
          Pairing Code Generated
        </h3>
        
        {/* QR Code Display */}
        <div className="bg-white p-6 rounded-xl mb-6 inline-block shadow-lg">
          <canvas 
            ref={canvasRef}
            className="w-48 h-48"
            data-testid="qr-code-canvas"
          />
        </div>
        
        {/* Pairing Code Text */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Or share this code:</p>
          <div className="glass p-4 rounded-lg inline-block">
            <span className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {pairingCode}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(pairingCode)}
            className="ml-3 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            data-testid="button-copy-code"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Connection Status */}
        <div className="mb-6">
          {isConnected ? (
            <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
              <Wifi className="animate-pulse" />
              <span>Connected! Ready to transfer files</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400">
              <Clock className="animate-pulse" />
              <span>Waiting for connection...</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-4 justify-center">
          {isConnected ? (
            <Button
              onClick={onStartTransfer}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              data-testid="button-start-transfer"
            >
              Start Transfer
            </Button>
          ) : null}
          
          <Button
            variant="secondary"
            onClick={onCancel}
            data-testid="button-cancel-sharing"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel Sharing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
