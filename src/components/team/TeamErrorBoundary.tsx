
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface TeamErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface TeamErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class TeamErrorBoundary extends React.Component<TeamErrorBoundaryProps, TeamErrorBoundaryState> {
  constructor(props: TeamErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TeamErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Team management error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              There was an error loading the team management interface. This might be due to:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Database connectivity issues</li>
              <li>Missing permissions</li>
              <li>Data formatting problems</li>
            </ul>
            {this.state.error && (
              <details className="text-xs bg-muted p-2 rounded">
                <summary>Error details</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button onClick={this.handleRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
