import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Mail,
  Send,
  Users,
  TrendingUp,
  BarChart3,
  Calendar,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  Copy,
  Settings,
  Target,
  DollarSign,
  MousePointer,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmailCampaignService, EmailCampaign } from '@/services/crm/emailCampaignService';

interface CampaignMetric {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ComponentType<any>;
  color: string;
}

interface CampaignDashboardProps {
  className?: string;
}

export function CampaignDashboard({ className }: CampaignDashboardProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading, refetch } = useQuery({
    queryKey: ['email-campaigns', statusFilter, typeFilter],
    queryFn: () => EmailCampaignService.getEmailCampaigns({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      campaign_type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch performance summary
  const { data: performanceSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['campaign-performance-summary'],
    queryFn: () => EmailCampaignService.getCampaignPerformanceSummary(),
    refetchInterval: 60000, // Refresh every minute
  });

  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => EmailCampaignService.deleteEmailCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-performance-summary'] });
    },
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => EmailCampaignService.sendCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-performance-summary'] });
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ['campaign-performance-summary'] })
    ]);
    setRefreshing(false);
  };

  const handleDeleteCampaign = (campaignId: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaignMutation.mutate(campaignId);
    }
  };

  const handleSendCampaign = (campaignId: string) => {
    if (window.confirm('Are you sure you want to send this campaign?')) {
      sendCampaignMutation.mutate(campaignId);
    }
  };

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns?.filter(campaign =>
    campaign.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.subject_line.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const campaignMetrics: CampaignMetric[] = [
    {
      title: 'Total Campaigns',
      value: performanceSummary?.total_campaigns?.toString() || '0',
      change: 12.5,
      changeType: 'increase',
      icon: Mail,
      color: 'text-blue-600'
    },
    {
      title: 'Total Recipients',
      value: performanceSummary?.total_recipients?.toLocaleString() || '0',
      change: 8.3,
      changeType: 'increase',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Average Open Rate',
      value: `${performanceSummary?.avg_open_rate?.toFixed(1) || '0'}%`,
      change: 3.2,
      changeType: 'increase',
      icon: Eye,
      color: 'text-purple-600'
    },
    {
      title: 'Average Click Rate',
      value: `${performanceSummary?.avg_click_rate?.toFixed(1) || '0'}%`,
      change: 5.7,
      changeType: 'increase',
      icon: MousePointer,
      color: 'text-orange-600'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sending':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'scheduled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Edit className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const isLoading = campaignsLoading || summaryLoading;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Create, manage, and analyze your email marketing campaigns
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Campaign Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {campaignMetrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendingUp className={`h-3 w-3 mr-1 ${
                  metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                }`} />
                <span className={metric.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}>
                  {Math.abs(metric.change)}%
                </span>
                <span className="ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Management</CardTitle>
          <CardDescription>
            Manage your email campaigns and track their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="nurture">Nurture</SelectItem>
                <SelectItem value="promotional">Promotional</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaigns Table */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No campaigns match your search criteria.' : 'Get started by creating your first email campaign.'}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(campaign.status)}
                          <h3 className="text-lg font-semibold">{campaign.campaign_name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{campaign.subject_line}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Recipients:</span>
                            <span className="ml-1 font-medium">{campaign.total_recipients?.toLocaleString() || '0'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Delivered:</span>
                            <span className="ml-1 font-medium">{campaign.delivered_count?.toLocaleString() || '0'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Opened:</span>
                            <span className="ml-1 font-medium">{campaign.opened_count?.toLocaleString() || '0'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Clicked:</span>
                            <span className="ml-1 font-medium">{campaign.clicked_count?.toLocaleString() || '0'}</span>
                          </div>
                        </div>
                        
                        {campaign.scheduled_date && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 inline mr-1" />
                            Scheduled: {new Date(campaign.scheduled_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4" />
                        </Button>
                        
                        {campaign.status === 'draft' && (
                          <Button 
                            size="sm"
                            onClick={() => handleSendCampaign(campaign.id)}
                            disabled={sendCampaignMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          disabled={deleteCampaignMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}