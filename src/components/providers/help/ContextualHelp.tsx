
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  HelpCircle, BookOpen, Video, MessageCircle, 
  ExternalLink, ChevronRight, Lightbulb, Star 
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: 'getting_started' | 'team_management' | 'provider_setup' | 'troubleshooting';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  videoUrl?: string;
}

interface ContextualHelpProps {
  context: string;
  trigger?: React.ReactNode;
}

const helpArticles: HelpArticle[] = [
  {
    id: '1',
    title: 'Setting Up Your First Provider Team',
    content: 'Learn how to create and configure your first provider team with step-by-step guidance.',
    category: 'getting_started',
    difficulty: 'beginner',
    estimatedTime: '5 min',
    videoUrl: '/videos/team-setup.mp4'
  },
  {
    id: '2',
    title: 'Managing Location Assignments',
    content: 'Understand how to assign teams to locations and manage multi-location operations.',
    category: 'team_management',
    difficulty: 'intermediate',
    estimatedTime: '10 min'
  },
  {
    id: '3',
    title: 'Provider Performance Analytics',
    content: 'Deep dive into performance metrics and how to interpret your provider dashboard.',
    category: 'provider_setup',
    difficulty: 'advanced',
    estimatedTime: '15 min'
  }
];

export function ContextualHelp({ context, trigger }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const contextualArticles = helpArticles.filter(article => 
    context === 'team_creation' ? article.category === 'getting_started' :
    context === 'provider_dashboard' ? article.category === 'provider_setup' :
    article.category === 'team_management'
  );

  const getDifficultyColor = (difficulty: HelpArticle['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      ) : (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsOpen(true)}
          className="text-blue-600 hover:text-blue-800"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Help
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Help & Documentation
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Help Articles List */}
            <div className="md:col-span-1 space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Contextual Help
              </h3>
              
              {contextualArticles.map((article) => (
                <Card 
                  key={article.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedArticle?.id === article.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedArticle(article)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{article.title}</h4>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getDifficultyColor(article.difficulty)}>
                        {article.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {article.estimatedTime}
                      </span>
                    </div>
                    
                    {article.videoUrl && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Video className="h-3 w-3" />
                        Video tutorial
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <Card className="border-dashed">
                <CardContent className="p-4 text-center">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Need more help?
                  </p>
                  <Button size="sm" variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Article Content */}
            <div className="md:col-span-2">
              {selectedArticle ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{selectedArticle.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(selectedArticle.difficulty)}>
                          {selectedArticle.difficulty}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {selectedArticle.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {selectedArticle.videoUrl && (
                      <div className="bg-gray-100 rounded-lg p-4 text-center">
                        <Video className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                        <p className="text-sm text-gray-600 mb-2">Video Tutorial Available</p>
                        <Button size="sm">
                          <Video className="h-4 w-4 mr-2" />
                          Watch Video
                        </Button>
                      </div>
                    )}
                    
                    <div className="prose prose-sm max-w-none">
                      <p>{selectedArticle.content}</p>
                      
                      <div className="bg-blue-50 p-4 rounded-lg mt-4">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">Pro Tip</h4>
                            <p className="text-blue-800 text-sm">
                              Use keyboard shortcuts Ctrl+K to quickly access the command palette 
                              and navigate between sections faster.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Was this helpful?</span>
                        <Button size="sm" variant="ghost">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Full Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Select an Article</h3>
                    <p className="text-muted-foreground">
                      Choose a help article from the list to view detailed instructions and guidance.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
