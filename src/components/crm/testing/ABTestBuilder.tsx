
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Plus,
  Trash2,
  TestTube,
  Users,
  Target
} from 'lucide-react';

interface TestVariant {
  id: string;
  name: string;
  content: string;
  traffic_split: number;
}

interface ABTestBuilderProps {
  test?: any;
  onSave: (test: any) => void;
  onCancel: () => void;
}

type TestType = 'email_subject' | 'email_content' | 'landing_page' | 'call_to_action';

export function ABTestBuilder({ test, onSave, onCancel }: ABTestBuilderProps) {
  const [name, setName] = useState(test?.name || '');
  const [description, setDescription] = useState(test?.description || '');
  const [testType, setTestType] = useState<TestType>(test?.type || 'email_subject');
  const [duration, setDuration] = useState(test?.duration_days || 7);
  const [confidenceLevel, setConfidenceLevel] = useState(test?.confidence_level || 95);
  const [variants, setVariants] = useState<TestVariant[]>(
    test?.variants?.map((variant: any, index: number) => ({
      id: variant.id || `variant-${index}`,
      name: variant.name || `Variant ${String.fromCharCode(65 + index)}`,
      content: variant.content || '',
      traffic_split: variant.traffic_split || (100 / (test?.variants?.length || 2))
    })) || [
      { id: 'a', name: 'Variant A', content: '', traffic_split: 50 },
      { id: 'b', name: 'Variant B', content: '', traffic_split: 50 }
    ]
  );

  const addVariant = () => {
    const newVariant: TestVariant = {
      id: `variant-${Date.now()}`,
      name: `Variant ${String.fromCharCode(65 + variants.length)}`,
      content: '',
      traffic_split: 0
    };
    
    // Redistribute traffic splits evenly
    const newVariants = [...variants, newVariant];
    const evenSplit = Math.floor(100 / newVariants.length);
    const redistributed = newVariants.map((variant, index) => ({
      ...variant,
      traffic_split: index === newVariants.length - 1 
        ? 100 - (evenSplit * (newVariants.length - 1))
        : evenSplit
    }));
    
    setVariants(redistributed);
  };

  const removeVariant = (variantId: string) => {
    if (variants.length <= 2) return; // Must have at least 2 variants
    
    const newVariants = variants.filter(v => v.id !== variantId);
    // Redistribute traffic splits evenly
    const evenSplit = Math.floor(100 / newVariants.length);
    const redistributed = newVariants.map((variant, index) => ({
      ...variant,
      traffic_split: index === newVariants.length - 1 
        ? 100 - (evenSplit * (newVariants.length - 1))
        : evenSplit
    }));
    
    setVariants(redistributed);
  };

  const updateVariant = (variantId: string, updates: Partial<TestVariant>) => {
    setVariants(variants.map(variant => 
      variant.id === variantId ? { ...variant, ...updates } : variant
    ));
  };

  const updateTrafficSplit = (variantId: string, newSplit: number) => {
    const totalOtherSplits = variants
      .filter(v => v.id !== variantId)
      .reduce((sum, v) => sum + v.traffic_split, 0);
    
    if (newSplit + totalOtherSplits <= 100) {
      updateVariant(variantId, { traffic_split: newSplit });
    }
  };

  const handleSave = () => {
    const testData = {
      id: test?.id || `test-${Date.now()}`,
      name,
      description,
      type: testType,
      variants: variants.map(({ id, ...variant }) => variant),
      duration_days: duration,
      confidence_level: confidenceLevel,
      status: 'draft'
    };
    onSave(testData);
  };

  const handleTestTypeChange = (value: string) => {
    setTestType(value as TestType);
  };

  const totalTrafficSplit = variants.reduce((sum, v) => sum + v.traffic_split, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tests
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {test ? 'Edit A/B Test' : 'Create A/B Test'}
          </h2>
          <p className="text-muted-foreground">
            Set up statistical testing for your campaigns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Configuration */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Test Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter test name"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you're testing"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Test Type</Label>
              <Select value={testType} onValueChange={handleTestTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email_subject">Email Subject Line</SelectItem>
                  <SelectItem value="email_content">Email Content</SelectItem>
                  <SelectItem value="landing_page">Landing Page</SelectItem>
                  <SelectItem value="call_to_action">Call to Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min="1"
                max="30"
              />
            </div>
            
            <div>
              <Label htmlFor="confidence">Confidence Level (%)</Label>
              <Select 
                value={confidenceLevel.toString()} 
                onValueChange={(value) => setConfidenceLevel(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="95">95%</SelectItem>
                  <SelectItem value="99">99%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <Label>Traffic Split</Label>
                <Badge variant={totalTrafficSplit === 100 ? "default" : "destructive"}>
                  {totalTrafficSplit}%
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {totalTrafficSplit === 100 
                  ? "Traffic split is balanced" 
                  : `Adjust splits to equal 100% (currently ${totalTrafficSplit}%)`
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Variants */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Variants</CardTitle>
              <Button
                variant="outline"
                onClick={addVariant}
                disabled={variants.length >= 5}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <Card key={variant.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50">
                          <TestTube className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">
                            Variant {String.fromCharCode(65 + index)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {variant.traffic_split}% of traffic
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={variant.traffic_split}
                            onChange={(e) => updateTrafficSplit(variant.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center"
                            min="0"
                            max="100"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                        
                        {variants.length > 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeVariant(variant.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Variant Name</Label>
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                          placeholder="Enter variant name"
                        />
                      </div>
                      
                      <div>
                        <Label>
                          {testType === 'email_subject' ? 'Subject Line' :
                           testType === 'email_content' ? 'Email Content' :
                           testType === 'landing_page' ? 'Page URL' :
                           'Content'}
                        </Label>
                        <Textarea
                          value={variant.content}
                          onChange={(e) => updateVariant(variant.id, { content: e.target.value })}
                          placeholder={
                            testType === 'email_subject' ? 'Enter subject line...' :
                            testType === 'email_content' ? 'Enter email content...' :
                            testType === 'landing_page' ? 'Enter page URL...' :
                            'Enter content...'
                          }
                          rows={testType === 'email_content' ? 6 : 2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!name || totalTrafficSplit !== 100 || variants.some(v => !v.content)}
        >
          Save A/B Test
        </Button>
      </div>
    </div>
  );
}
