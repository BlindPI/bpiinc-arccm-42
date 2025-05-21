
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { columns } from "@/components/user-management/columns";
import { BulkActionsMenu } from "@/components/user-management/BulkActionsMenu";
import { toast } from "sonner";
import { UserRole } from "@/types/supabase-schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Upload, Download } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { InviteUserDialog } from "@/components/user-management/InviteUserDialog";
import { useProfile } from "@/hooks/useProfile";

// Use the same UserRole type from supabase-schema.ts
interface ExtendedUser {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  email_confirmed_at: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string;
  compliance_status: boolean;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { data: profile } = useProfile();
  
  // Check if user is an admin
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  // Filter users by search query
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.display_name?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  // Load users
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(profiles as ExtendedUser[]);
    } catch (error: any) {
      console.error("Error loading users:", error.message);
      toast.error("Error loading users: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on initial render
  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage users, assign roles, and track compliance.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <InviteUserDialog />}
          <Button variant="outline" className="flex items-center gap-1.5">
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-1.5">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="users" className="flex-1">
            All Users
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-1">
            Active
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">
            Pending
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex-1">
            Inactive
          </TabsTrigger>
        </TabsList>

        <div className="my-4 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users by name, email, or role..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <BulkActionsMenu
            selectedUsers={selectedUsers}
            onSuccess={loadUsers}
          />
        </div>

        <TabsContent value="users" className="m-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              data={filteredUsers}
              columns={columns}
              onRowSelectionChange={(selected) => setSelectedUsers(Object.keys(selected))}
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="m-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              data={filteredUsers.filter((u) => u.status === "ACTIVE")}
              columns={columns}
              onRowSelectionChange={(selected) => setSelectedUsers(Object.keys(selected))}
            />
          )}
        </TabsContent>

        <TabsContent value="pending" className="m-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              data={filteredUsers.filter((u) => u.status === "PENDING")}
              columns={columns}
              onRowSelectionChange={(selected) => setSelectedUsers(Object.keys(selected))}
            />
          )}
        </TabsContent>

        <TabsContent value="inactive" className="m-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              data={filteredUsers.filter((u) => u.status === "INACTIVE")}
              columns={columns}
              onRowSelectionChange={(selected) => setSelectedUsers(Object.keys(selected))}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
