import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeftRight, X, Check } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface TransferProgressProps {
  progress: number;
  speed: number;
  timeRemaining: number;
  files: File[];
  onCancel: () => void;
  onComplete: () => void;
}

export function TransferProgress({ 
  progress, 
  speed, 
  timeRemaining, 
  files, 
  onCancel,
  onComplete 
}: TransferProgressProps) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const transferredSize = (progress / 100) * totalSize;
  const completedFiles = Math.floor((progress / 100) * files.length);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Transfer Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <ArrowLeftRight className="mr-3 text-emerald-500" />
          File Transfer in Progress
        </h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {Math.round(progress)}% Complete
          </div>
          <Button
            variant="destructive"
            onClick={onCancel}
            data-testid="button-cancel-transfer"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>

      <Card className="glass">
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {formatFileSize(transferredSize)} of {formatFileSize(totalSize)}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          
          {/* Transfer Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center" data-testid="stat-speed">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatFileSize(speed)}/s
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Speed</div>
            </div>
            <div className="text-center" data-testid="stat-time-remaining">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Time Left</div>
            </div>
            <div className="text-center" data-testid="stat-files-completed">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {completedFiles}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Files Done</div>
            </div>
            <div className="text-center" data-testid="stat-total-files">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {files.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Files</div>
            </div>
          </div>
          
          {/* Individual File Progress */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3">File Progress</h4>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {files.map((file, index) => {
                const fileProgress = Math.min(100, Math.max(0, (progress - (index * 100 / files.length)) * files.length));
                const isComplete = fileProgress >= 100;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/30 dark:bg-gray-800/30 rounded-lg"
                    data-testid={`file-progress-${index}`}
                  >
                    <div className="flex items-center flex-1">
                      <span className="text-xl mr-3">📄</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-white">{file.name}</div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isComplete 
                                ? 'bg-green-500' 
                                : 'bg-gradient-to-r from-emerald-500 to-purple-500'
                            }`}
                            style={{ width: `${fileProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      {isComplete ? (
                        <div className="text-sm text-green-600 dark:text-green-400">
                          <Check className="inline mr-1 h-4 w-4" />
                          Complete
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-emerald-600 dark:text-emerald-400">
                            {Math.round(fileProgress)}%
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize((fileProgress / 100) * file.size)} / {formatFileSize(file.size)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
