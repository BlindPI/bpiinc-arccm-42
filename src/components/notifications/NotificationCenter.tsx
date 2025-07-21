import React, { useState } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CheckIcon, 
  FilterIcon, 
  SlidersHorizontal, 
  Search, 
  X,
  BellOff,
  CircleDot,
  Bell,
  Clock,
  CalendarClock,
  UserCircle,
  ShieldCheck,
  Briefcase,
  FileText,
  AlertTriangle
} from "lucide-react";
import { NotificationList } from './NotificationList';
import { useNotificationCount, useMarkAllNotificationsAsRead, useNotificationTypes } from '@/hooks/useNotifications';
import { NotificationFilters, NotificationCategory } from '@/types/notifications';
import { NotificationPreferencesPanel } from './NotificationPreferencesPanel';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategory?: string;
  categoryFilter?: string;
}

export function NotificationCenter({
  open,
  onOpenChange,
  initialCategory = "all",
  categoryFilter
}: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<string>(initialCategory);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [showPrefs, setShowPrefs] = useState(false);

  const { data: counts = { total: 0, unread: 0, byCategoryAndPriority: {} } } = useNotificationCount();
  const { data: notificationTypes = [] } = useNotificationTypes();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (value === "unread") {
      setFilters(prev => ({ ...prev, read: false }));
    } else if (value === "all") {
      const { read, ...restFilters } = filters;
      setFilters(restFilters);
    } else {
      setFilters(prev => ({ ...prev, category: value }));
    }
  };

  const handlePriorityChange = (value: string) => {
    if (value === "all") {
      const { priority, ...restFilters } = filters;
      setFilters(restFilters);
    } else {
      setFilters(prev => ({ ...prev, priority: value }));
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);

    if (e.target.value) {
      setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
    } else {
      const { searchTerm, ...restFilters } = filters;
      setFilters(restFilters);
    }
  };

  const handleResetFilters = () => {
    setFilters({});
    setSearchTerm("");
    setActiveTab("all");
  };

  const handleMarkAllAsRead = () => {
    const categoryFilter = activeTab !== "all" && activeTab !== "unread" ? activeTab : undefined;
    markAllAsRead.mutate(categoryFilter);
  };

  // Get category icon
  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'GENERAL':
        return <Bell className="h-4 w-4" />;
      case 'CERTIFICATE':
        return <FileText className="h-4 w-4" />;
      case 'COURSE':
        return <CalendarClock className="h-4 w-4" />;
      case 'ACCOUNT':
        return <UserCircle className="h-4 w-4" />;
      case 'ROLE_MANAGEMENT':
        return <ShieldCheck className="h-4 w-4" />;
      case 'SUPERVISION':
        return <UserCircle className="h-4 w-4" />;
      case 'INSTRUCTOR':
        return <Briefcase className="h-4 w-4" />;
      case 'PROVIDER':
        return <Briefcase className="h-4 w-4" />;
      case 'SYSTEM':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  // Categories + unread count for visual indicator
  const categories = [
    { id: "GENERAL", label: "General", count: counts.byCategoryAndPriority?.GENERAL?.unread || 0, icon: <Bell className="h-4 w-4 mr-1" /> },
    { id: "CERTIFICATE", label: "Certificates", count: counts.byCategoryAndPriority?.CERTIFICATE?.unread || 0, icon: <FileText className="h-4 w-4 mr-1" /> },
    { id: "COURSE", label: "Courses", count: counts.byCategoryAndPriority?.COURSE?.unread || 0, icon: <CalendarClock className="h-4 w-4 mr-1" /> },
    { id: "ACCOUNT", label: "Account", count: counts.byCategoryAndPriority?.ACCOUNT?.unread || 0, icon: <UserCircle className="h-4 w-4 mr-1" /> },
    { id: "SUPERVISION", label: "Supervision", count: counts.byCategoryAndPriority?.SUPERVISION?.unread || 0, icon: <UserCircle className="h-4 w-4 mr-1" /> },
    { id: "ROLE_MANAGEMENT", label: "Roles", count: counts.byCategoryAndPriority?.ROLE_MANAGEMENT?.unread || 0, icon: <ShieldCheck className="h-4 w-4 mr-1" /> },
    { id: "INSTRUCTOR", label: "Instructor", count: counts.byCategoryAndPriority?.INSTRUCTOR?.unread || 0, icon: <Briefcase className="h-4 w-4 mr-1" /> },
    { id: "PROVIDER", label: "Provider", count: counts.byCategoryAndPriority?.PROVIDER?.unread || 0, icon: <Briefcase className="h-4 w-4 mr-1" /> },
    { id: "SYSTEM", label: "System", count: counts.byCategoryAndPriority?.SYSTEM?.unread || 0, icon: <AlertTriangle className="h-4 w-4 mr-1" /> }
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <SheetHeader className="pb-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <SheetTitle className="flex items-center gap-2 text-blue-700 text-xl font-semibold">
                <CircleDot className="h-6 w-6 text-primary" strokeWidth={2.4} />
                Notifications
              </SheetTitle>
              {counts.unread > 0 && (
                <Badge variant="destructive" className="ml-1 animate-pulse">{counts.unread}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Dialog open={showPrefs} onOpenChange={setShowPrefs}>
                      <DialogTrigger asChild>
                        <Button aria-label="Notification Preferences" variant="ghost" className="text-blue-600 hover:bg-blue-100" size="icon">
                          <SlidersHorizontal className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg w-full">
                        <DialogHeader>
                          <DialogTitle>Notification Preferences</DialogTitle>
                        </DialogHeader>
                        <NotificationPreferencesPanel />
                      </DialogContent>
                    </Dialog>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notification Preferences</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={showFilters ? "secondary" : "outline"} 
                      size="sm" 
                      onClick={() => setShowFilters(!showFilters)}
                      className={showFilters ? "bg-amber-50 border-amber-400 text-amber-700" : ""}
                      aria-label="Filter notifications"
                    >
                      <FilterIcon className="h-4 w-4 mr-1" />
                      Filters
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter Notifications</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleMarkAllAsRead}
                      disabled={counts.unread === 0 || markAllAsRead.isPending}
                      className="text-green-700 hover:text-green-900"
                      aria-label="Mark all as read"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Mark all as read
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mark All as Read</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 space-y-3 rounded-md border p-3 bg-muted/60">
              <div className="flex justify-between items-center mb-0.5">
                <h4 className="text-sm font-medium">Filters</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResetFilters}
                  className="text-red-700 hover:text-red-900"
                >
                  <X className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[170px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications"
                    className="pl-8"
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                <Select onValueChange={handlePriorityChange} defaultValue="all">
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </SheetHeader>

        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full h-auto flex flex-wrap mb-4 overflow-x-auto rounded-lg border bg-white/70 shadow">
            <TabsTrigger value="all" className="px-2 aria-[active=true]:text-blue-800">
              All 
              <Badge variant="secondary" className="ml-1">{counts.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="px-2 aria-[active=true]:text-green-800">
              Unread 
              <Badge variant="destructive" className="ml-1">{counts.unread}</Badge>
            </TabsTrigger>
            <Separator className="mx-2 h-6 self-center" orientation="vertical" />
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="px-2 aria-[active=true]:text-blue-600 flex items-center">
                {cat.icon}
                {cat.label}
                {cat.count > 0 && (
                  <Badge variant="outline" className="ml-1 border-blue-400 text-blue-800">
                    {cat.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <NotificationList 
              filters={filters} 
              onNotificationClick={() => onOpenChange(false)} 
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
