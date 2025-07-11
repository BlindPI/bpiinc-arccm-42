import { ScoreThresholds } from '@/types/supabase-schema';

interface ScoreProgressBarProps {
  score: number | null;
  maxScore: number;
  threshold: number;
  label: string;
  showThreshold?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

const sizeConfig = {
  sm: {
    height: 'h-2',
    text: 'text-xs',
    spacing: 'space-y-1'
  },
  md: {
    height: 'h-3',
    text: 'text-sm',
    spacing: 'space-y-2'
  },
  lg: {
    height: 'h-4',
    text: 'text-base',
    spacing: 'space-y-3'
  }
};

export function ScoreProgressBar({
  score,
  maxScore,
  threshold,
  label,
  showThreshold = true,
  size = 'md',
  variant = 'default'
}: ScoreProgressBarProps) {
  const styles = sizeConfig[size];
  const percentage = score !== null ? Math.min((score / maxScore) * 100, 100) : 0;
  const thresholdPercentage = (threshold / maxScore) * 100;
  const isPassing = score !== null && score >= threshold;
  const hasScore = score !== null;

  // Determine color based on score relative to threshold
  const getProgressColor = () => {
    if (!hasScore) return 'bg-gray-200';
    if (isPassing) return 'bg-green-500';
    if (score! >= threshold * 0.8) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreDisplay = () => {
    if (score === null) return 'Not recorded';
    return `${score}/${maxScore}`;
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <span className={`${styles.text} font-medium min-w-16`}>{label}:</span>
        <div className="flex-1 relative">
          <div className={`w-full ${styles.height} bg-gray-200 rounded-full overflow-hidden`}>
            <div 
              className={`${styles.height} ${getProgressColor()} transition-all duration-300 rounded-full`}
              style={{ width: `${percentage}%` }}
            />
            {showThreshold && (
              <div 
                className="absolute top-0 w-0.5 h-full bg-gray-600 opacity-60"
                style={{ left: `${thresholdPercentage}%` }}
              />
            )}
          </div>
        </div>
        <span className={`${styles.text} min-w-16 text-right ${isPassing ? 'text-green-700' : hasScore ? 'text-red-700' : 'text-gray-500'}`}>
          {getScoreDisplay()}
        </span>
      </div>
    );
  }

  return (
    <div className={`${styles.spacing}`}>
      <div className="flex justify-between items-center">
        <span className={`${styles.text} font-medium text-gray-700`}>{label}</span>
        <span className={`${styles.text} ${isPassing ? 'text-green-700 font-semibold' : hasScore ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
          {getScoreDisplay()}
          {hasScore && (
            <span className="ml-1 text-gray-500">
              ({percentage.toFixed(0)}%)
            </span>
          )}
        </span>
      </div>
      
      <div className="relative">
        <div className={`w-full ${styles.height} bg-gray-200 rounded-full overflow-hidden`}>
          <div 
            className={`${styles.height} ${getProgressColor()} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${percentage}%` }}
          />
          {showThreshold && (
            <div 
              className="absolute top-0 w-0.5 h-full bg-gray-600 opacity-70 z-10"
              style={{ left: `${thresholdPercentage}%` }}
            />
          )}
        </div>
        
        {showThreshold && (
          <div 
            className="absolute -bottom-5 transform -translate-x-1/2 text-xs text-gray-500"
            style={{ left: `${thresholdPercentage}%` }}
          >
            Pass: {threshold}
          </div>
        )}
      </div>
    </div>
  );
}

interface ScoreBreakdownProps {
  practicalScore: number | null;
  writtenScore: number | null;
  totalScore: number | null;
  thresholds: ScoreThresholds;
  maxScores?: {
    practical: number;
    written: number;
    total: number;
  };
  variant?: 'default' | 'compact';
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBreakdown({
  practicalScore,
  writtenScore,
  totalScore,
  thresholds,
  maxScores = { practical: 100, written: 100, total: 100 },
  variant = 'default',
  size = 'md'
}: ScoreBreakdownProps) {
  const styles = sizeConfig[size];

  return (
    <div className={`${styles.spacing} p-4 bg-gray-50 rounded-lg border`}>
      <h4 className={`${styles.text} font-semibold text-gray-800 mb-3`}>Score Breakdown</h4>
      
      <div className={`${styles.spacing}`}>
        <ScoreProgressBar
          score={practicalScore}
          maxScore={maxScores.practical}
          threshold={thresholds.passThreshold}
          label="Practical Assessment"
          variant={variant}
          size={size}
        />
        
        <ScoreProgressBar
          score={writtenScore}
          maxScore={maxScores.written}
          threshold={thresholds.passThreshold}
          label="Written Assessment"
          variant={variant}
          size={size}
        />
        
        <div className="border-t pt-2 mt-2">
          <ScoreProgressBar
            score={totalScore}
            maxScore={maxScores.total}
            threshold={thresholds.passThreshold}
            label="Total Score"
            variant={variant}
            size={size}
          />
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Required Threshold:</span>
          <span>
            {thresholds.passThreshold}% (Practical: {Math.round(thresholds.practicalWeight * 100)}%, Written: {Math.round(thresholds.writtenWeight * 100)}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// Quick score summary for compact displays
export function ScoreSummaryIndicator({
  totalScore,
  threshold,
  maxScore = 100,
  size = 'sm'
}: {
  totalScore: number | null;
  threshold: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const percentage = totalScore !== null ? Math.min((totalScore / maxScore) * 100, 100) : 0;
  const isPassing = totalScore !== null && totalScore >= threshold;
  const hasScore = totalScore !== null;

  const getColor = () => {
    if (!hasScore) return 'text-gray-500';
    return isPassing ? 'text-green-600' : 'text-red-600';
  };

  const getScoreText = () => {
    if (!hasScore) return 'No Score';
    return `${totalScore}%`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
        isPassing ? 'border-green-500 bg-green-50 text-green-700' : 
        hasScore ? 'border-red-500 bg-red-50 text-red-700' : 
        'border-gray-300 bg-gray-50 text-gray-500'
      }`}>
        {hasScore ? `${Math.round(percentage)}` : '?'}
      </div>
      <span className={`text-sm font-medium ${getColor()}`}>
        {getScoreText()}
      </span>
    </div>
  );
}