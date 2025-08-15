import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QrCodeDisplay } from "@/components/qr-code-display";
import { QrScanner } from "@/components/qr-scanner";
import { Zap, Smartphone, Monitor, Shield, Clock } from "lucide-react";

interface InstantConnectProps {
  onModeSelect: (mode: 'send' | 'receive') => void;
  onConnection: () => void;
}

export function InstantConnect({ onModeSelect, onConnection }: InstantConnectProps) {
  const [mode, setMode] = useState<'send' | 'receive' | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [pairingCode, setPairingCode] = useState('');

  // Simulate ultra-fast connection for demo
  useEffect(() => {
    if (isConnecting) {
      const interval = setInterval(() => {
        setConnectionProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            onConnection();
            return 100;
          }
          return prev + 10;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isConnecting, onConnection]);

  const handleModeSelect = (selectedMode: 'send' | 'receive') => {
    setMode(selectedMode);
    onModeSelect(selectedMode);
    
    if (selectedMode === 'send') {
      setShowQR(true);
      setPairingCode('demo-code-123');
    } else {
      setIsConnecting(true);
    }
  };

  if (isConnecting) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Connecting at lightspeed...</h3>
            <Progress value={connectionProgress} className="w-full" />
            <div className="flex justify-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Shield className="w-3 h-3 mr-1" />
                Encrypted
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Clock className="w-3 h-3 mr-1" />
                P2P Direct
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'send' && showQR) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Share this QR code</h3>
            <QrCodeDisplay 
              pairingCode={pairingCode}
              onCopy={() => navigator.clipboard?.writeText(pairingCode)}
              onCancel={() => { setMode(null); setShowQR(false); }}
              isConnected={false}
              onStartTransfer={() => {}}
            />
            <p className="text-sm text-muted-foreground">
              Receiver scans this to connect instantly
            </p>
            <Button 
              variant="ghost" 
              onClick={() => { setMode(null); setShowQR(false); }}
            >
              ← Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'receive') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Scan sender's QR code</h3>
            <QrScanner onCodeScanned={() => setIsConnecting(true)} />
            <Button 
              variant="ghost" 
              onClick={() => setMode(null)}
            >
              ← Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Zap className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          BeamShare
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          The fastest, most private file transfer ever made. No installation, no servers, no limits.
        </p>
        <div className="flex justify-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <Shield className="w-3 h-3 mr-1" />
            100% Private
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Zap className="w-3 h-3 mr-1" />
            Lightning Fast
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Zero Install
          </Badge>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <Card 
          className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 hover:border-blue-300"
          onClick={() => handleModeSelect('send')}
        >
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <Monitor className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">Send Files</h3>
              <p className="text-sm text-muted-foreground">
                Choose files and generate QR code for instant sharing
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 hover:border-purple-300"
          onClick={() => handleModeSelect('receive')}
        >
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Receive Files</h3>
              <p className="text-sm text-muted-foreground">
                Scan QR code to start receiving files instantly
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <div className="text-center space-y-2 max-w-md mx-auto">
        <p className="text-sm text-muted-foreground">
          ✨ Optimized for maximum speed and privacy
        </p>
        <p className="text-xs text-muted-foreground">
          No servers involved • Direct device-to-device • End-to-end encrypted
        </p>
      </div>
    </div>
  );
}