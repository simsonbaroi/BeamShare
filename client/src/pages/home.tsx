import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/components/theme-provider";
import { QrCodeDisplay } from "@/components/qr-code-display";
import { QrScanner } from "@/components/qr-scanner";
import { FileSelector } from "@/components/file-selector";
import { TransferProgress } from "@/components/transfer-progress";
import { useWebRTC } from "@/hooks/use-webrtc";
import { useFileTransfer } from "@/hooks/use-file-transfer";
import autoOptimizer from "@/lib/auto-optimize";
import { toast } from "@/hooks/use-toast";
import { 
  Upload, 
  Download, 
  ArrowLeft, 
  Wifi, 
  Shield, 
  Server, 
  Smartphone,
  Settings,
  Lock,
  Network,
  QrCode,
  Camera,
  Keyboard,
  Check,
  ExternalLink,
  Copy,
  Clock,
  X,
  Home,
  Redo,
  Video,
  Link,
  Moon,
  Sun
} from "lucide-react";

type ViewType = 'role-selection' | 'sender-view' | 'receiver-view' | 'transfer-view' | 'completion-view';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<ViewType>('role-selection');
  const [encryptionPasscode, setEncryptionPasscode] = useState('');
  const [turnServer, setTurnServer] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showPairingDisplay, setShowPairingDisplay] = useState(false);
  
  const { 
    isConnected, 
    connectionState, 
    localPeerCode,
    connect,
    sendData,
    createOffer,
    acceptOffer 
  } = useWebRTC({
    encryptionKey: encryptionPasscode,
    turnServer
  });

  const {
    transferProgress,
    transferSpeed,
    timeRemaining,
    isTransferring,
    startTransfer,
    cancelTransfer
  } = useFileTransfer();
  
  // Auto-optimize on component mount for maximum speed
  useEffect(() => {
    autoOptimizer.optimizeForSpeed();
  }, []);

  const handleRoleSelect = (role: 'sender' | 'receiver') => {
    setCurrentView(role === 'sender' ? 'sender-view' : 'receiver-view');
  };

  const handleCreatePairingCode = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to share first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const code = await createOffer();
      setPairingCode(code || '');
      setShowPairingDisplay(true);
      toast({
        title: "Pairing code created",
        description: "Share this code with the receiver."
      });
    } catch (error) {
      toast({
        title: "Failed to create pairing code",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleConnectWithCode = async () => {
    if (!manualCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid pairing code.",
        variant: "destructive"
      });
      return;
    }

    try {
      await connect(manualCode.trim());
      toast({
        title: "Connected successfully",
        description: "Ready to receive files."
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const handleStartTransfer = async () => {
    if (!isConnected || selectedFiles.length === 0) return;

    setCurrentView('transfer-view');
    try {
      await startTransfer(selectedFiles, sendData);
    } catch (error) {
      toast({
        title: "Transfer failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Pairing code copied successfully."
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
              <Wifi className="text-white text-2xl" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
              BeamShare
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
            Serverless peer-to-peer file transfer with end-to-end encryption
          </p>
          
          <Button
            onClick={toggleTheme}
            variant="outline"
            className="glass border-white/20 hover:bg-white/25 transition-all duration-300"
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Dark Mode
              </>
            )}
          </Button>
        </header>

        <main>
          {/* Role Selection View */}
          {currentView === 'role-selection' && (
            <div className="space-y-8">
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                <Card 
                  className="glass hover:scale-105 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleRoleSelect('sender')}
                  data-testid="sender-card"
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="text-white text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Send Files</h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                      Share files, folders, or entire directories with another device securely
                    </p>
                    <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Get Started</span>
                      <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="glass hover:scale-105 transition-all duration-300 cursor-pointer group"
                  onClick={() => handleRoleSelect('receiver')}
                  data-testid="receiver-card"
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Download className="text-white text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Receive Files</h2>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                      Accept files from another device using QR code or pairing code
                    </p>
                    <div className="flex items-center justify-center text-purple-600 dark:text-purple-400 font-medium">
                      <span>Get Started</span>
                      <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card className="glass text-center">
                  <CardContent className="p-6">
                    <Shield className="text-emerald-500 text-3xl mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">End-to-End Encrypted</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Your files are encrypted during transfer</p>
                  </CardContent>
                </Card>
                <Card className="glass text-center">
                  <CardContent className="p-6">
                    <Server className="text-purple-500 text-3xl mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Serverless</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Direct device-to-device transfer</p>
                  </CardContent>
                </Card>
                <Card className="glass text-center">
                  <CardContent className="p-6">
                    <Smartphone className="text-emerald-500 text-3xl mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Cross-Platform</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Works on all devices and browsers</p>
                  </CardContent>
                </Card>
              </div>

              {/* Settings Panel */}
              <Card className="glass">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
                    <Settings className="mr-3 text-emerald-500" />
                    Transfer Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Lock className="mr-2 h-4 w-4" />
                        Encryption Passcode (Optional)
                      </Label>
                      <Input
                        type="password"
                        value={encryptionPasscode}
                        onChange={(e) => setEncryptionPasscode(e.target.value)}
                        placeholder="Leave empty for WebRTC encryption only"
                        className="glass"
                        data-testid="input-encryption-passcode"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Network className="mr-2 h-4 w-4" />
                        TURN Server (Optional)
                      </Label>
                      <Input
                        type="text"
                        value={turnServer}
                        onChange={(e) => setTurnServer(e.target.value)}
                        placeholder="turn:your-turn-server.com:3478"
                        className="glass"
                        data-testid="input-turn-server"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sender View */}
          {currentView === 'sender-view' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView('role-selection')}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Upload className="h-4 w-4" />
                  <span>Sender Mode</span>
                </div>
              </div>

              {!showPairingDisplay ? (
                <FileSelector
                  selectedFiles={selectedFiles}
                  onFilesSelected={setSelectedFiles}
                  onCreatePairingCode={handleCreatePairingCode}
                />
              ) : (
                <QrCodeDisplay
                  pairingCode={pairingCode}
                  onCopy={copyToClipboard}
                  onCancel={() => {
                    setShowPairingDisplay(false);
                    setPairingCode('');
                  }}
                  isConnected={isConnected}
                  onStartTransfer={handleStartTransfer}
                />
              )}
            </div>
          )}

          {/* Receiver View */}
          {currentView === 'receiver-view' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView('role-selection')}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                  data-testid="button-back-home-receiver"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Download className="h-4 w-4" />
                  <span>Receiver Mode</span>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <QrScanner onCodeScanned={connect} />

                <Card className="glass">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                      <Keyboard className="mr-3 text-emerald-500" />
                      Enter Pairing Code
                    </h3>
                    
                    <div className="space-y-4 mb-4">
                      <Input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="ABC-DEF-123"
                        className="text-center font-mono text-lg glass"
                        style={{ letterSpacing: '0.1em' }}
                        data-testid="input-pairing-code"
                      />
                    </div>
                    
                    <Button
                      onClick={handleConnectWithCode}
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                      data-testid="button-connect-code"
                    >
                      <Link className="mr-2 h-4 w-4" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {isConnected && (
                <Card className="glass">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="text-white text-xl" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Connected Successfully!</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Ready to receive files</p>
                    
                    <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                      <Wifi className="h-4 w-4" />
                      <span>Secure P2P connection established</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Transfer View */}
          {currentView === 'transfer-view' && (
            <TransferProgress
              progress={transferProgress}
              speed={transferSpeed}
              timeRemaining={timeRemaining}
              files={selectedFiles}
              onCancel={cancelTransfer}
              onComplete={() => setCurrentView('completion-view')}
            />
          )}

          {/* Completion View */}
          {currentView === 'completion-view' && (
            <div className="text-center space-y-6">
              <Card className="glass">
                <CardContent className="p-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="text-white text-3xl" />
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                    Transfer Complete!
                  </h2>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    Successfully transferred <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedFiles.length} files</span>
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => {
                        setCurrentView('role-selection');
                        setSelectedFiles([]);
                        setShowPairingDisplay(false);
                      }}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                      data-testid="button-transfer-again"
                    >
                      <Redo className="mr-2 h-4 w-4" />
                      Transfer More Files
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setCurrentView('role-selection');
                        setSelectedFiles([]);
                        setShowPairingDisplay(false);
                      }}
                      data-testid="button-back-start"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Back to Home
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
            <div className="flex items-center">
              <Shield className="mr-2 h-4 w-4 text-green-500" />
              <span>Secure WebRTC Transfer</span>
            </div>
            <div className="flex items-center">
              <Server className="mr-2 h-4 w-4 text-purple-500" />
              <span>No Server Required</span>
            </div>
          </div>
          <div className="mt-4">
            <p>&copy; 2024 BeamShare. Built with ❤️ for privacy.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
