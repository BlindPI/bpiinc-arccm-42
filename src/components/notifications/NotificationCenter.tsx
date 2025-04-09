
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
  BellOff
} from "lucide-react";

import { NotificationList } from './NotificationList';
import { useNotificationCount, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import { NotificationFilters } from '@/types/notifications';

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: counts = { total: 0, unread: 0, byCategoryAndPriority: {} } } = useNotificationCount();
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
  
  // Calculate counts for each category
  const categories = [
    { id: "GENERAL", label: "General", count: counts.byCategoryAndPriority?.GENERAL?.unread || 0 },
    { id: "CERTIFICATE", label: "Certificates", count: counts.byCategoryAndPriority?.CERTIFICATE?.unread || 0 },
    { id: "COURSE", label: "Courses", count: counts.byCategoryAndPriority?.COURSE?.unread || 0 },
    { id: "ACCOUNT", label: "Account", count: counts.byCategoryAndPriority?.ACCOUNT?.unread || 0 },
    { id: "SUPERVISION", label: "Supervision", count: counts.byCategoryAndPriority?.SUPERVISION?.unread || 0 },
    { id: "ROLE_MANAGEMENT", label: "Roles", count: counts.byCategoryAndPriority?.ROLE_MANAGEMENT?.unread || 0 },
    { id: "SYSTEM", label: "System", count: counts.byCategoryAndPriority?.SYSTEM?.unread || 0 }
  ];
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <FilterIcon className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={counts.unread === 0 || markAllAsRead.isPending}
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Mark all as read
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 space-y-3 rounded-md border p-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Filters</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResetFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]">
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
          <TabsList className="w-full h-auto flex flex-wrap mb-4 overflow-x-auto">
            <TabsTrigger value="all" className="flex-grow">
              All 
              <Badge variant="secondary" className="ml-1">
                {counts.total}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-grow">
              Unread 
              <Badge variant="destructive" className="ml-1">
                {counts.unread}
              </Badge>
            </TabsTrigger>
            <Separator />
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="flex-grow">
                {cat.label}
                {cat.count > 0 && (
                  <Badge variant="outline" className="ml-1">
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
