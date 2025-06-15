
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

interface FunnelStage {
  stage: string;
  count: number;
  conversion_rate: number;
}

interface ConversionFunnelChartProps {
  data?: FunnelStage[];
}

export function ConversionFunnelChart({ data = [] }: ConversionFunnelChartProps) {
  const maxCount = Math.max(...data.map(stage => stage.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => {
            const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
            const isFirstStage = index === 0;
            
            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{stage.stage}</span>
                  <div className="text-right">
                    <span className="text-lg font-bold">{stage.count.toLocaleString()}</span>
                    {!isFirstStage && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({stage.conversion_rate.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`}
                    style={{ width: `${width}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {index < data.length - 1 && (
                  <div className="flex justify-center">
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
