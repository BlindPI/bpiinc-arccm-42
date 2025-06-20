
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useLocationData } from '@/hooks/useLocationData';
import { UnifiedTeamService } from '@/services/team/unifiedTeamService';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Location } from '@/types/supabase-schema';

const teamFormSchema = z.object({
  name: z.string().min(2, {
    message: "Team name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  team_type: z.string().optional(),
  status: z.string().optional(),
  primaryLocationId: z.string().optional(),
  assigned_ap_user_id: z.string().optional(), // NEW: AP user assignment
  auto_assign: z.boolean().default(false).optional(),
  assignment_strategy: z.string().optional(),
});

interface AdminTeamCreationWizardProps {
  onTeamCreated: () => void;
  onCancel: () => void;
}

export function AdminTeamCreationWizard({ onTeamCreated, onCancel }: AdminTeamCreationWizardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { locations } = useLocationData({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team_type: '',
    status: 'active',
    primaryLocationId: '',
    assigned_ap_user_id: '', // NEW: AP user assignment
    auto_assign: false,
    assignment_strategy: 'round_robin'
  });

  // Fetch available AP users (corrected architecture)
  const { data: apUsers = [] } = useQuery({
    queryKey: ['ap-users-admin-create'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, organization')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      description: "",
      team_type: "sales",
      status: "active",
      primaryLocationId: "",
      assigned_ap_user_id: "",
      auto_assign: false,
      assignment_strategy: "round_robin",
    },
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (values: z.infer<typeof teamFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Create the team using UnifiedTeamService with corrected architecture
      const teamData = {
        name: values.name,
        description: values.description,
        team_type: values.team_type || 'standard',
        status: (values.status as 'active' | 'inactive' | 'archived') || 'active',
        location_id: values.primaryLocationId || undefined,
        assigned_ap_user_id: values.assigned_ap_user_id || undefined,
        created_by_ap_user_id: values.assigned_ap_user_id || undefined // Same user creates and is assigned
      };
      
      const newTeam = await UnifiedTeamService.createTeam(teamData);
      
      toast({
        title: "Team created successfully!",
        description: `Team "${newTeam.name}" has been created with the corrected AP user architecture.`,
      });
      
      onTeamCreated();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to create team",
        description: error.message || "There was a problem creating the team.",
      })
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input placeholder="Sales Team" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description of the team"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="team_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="primaryLocationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Location</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {locations?.map((location) => (
                    <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="assigned_ap_user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign AP User (Authorized Provider)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select AP user (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="">No AP user assigned</SelectItem>
                  {apUsers?.map((apUser) => (
                    <SelectItem key={apUser.id} value={apUser.id}>
                      {apUser.display_name} {apUser.organization && `(${apUser.organization})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The AP user assigned to this team serves as the Authorized Provider.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="auto_assign"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
              <div className="space-y-0.5">
                <FormLabel>Auto Assign</FormLabel>
                <FormDescription>
                  Automatically assign users to this team.
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {formData.auto_assign && (
          <FormField
            control={form.control}
            name="assignment_strategy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignment Strategy</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an assignment strategy" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="round_robin">Round Robin</SelectItem>
                    <SelectItem value="load_balanced">Load Balanced</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Team"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
