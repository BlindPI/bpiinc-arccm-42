
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CRMService } from '@/services/crm/crmService';
import { toast } from 'sonner';
import type { Contact } from '@/types/crm';

export function useCRMContacts() {
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['crm-contacts'],
    queryFn: () => CRMService.getContacts()
  });

  const createContactMutation = useMutation({
    mutationFn: (contactData: Partial<Contact>) => CRMService.createContact(contactData),
    onSuccess: () => {
      toast.success('Contact created successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
    onError: (error) => {
      toast.error('Failed to create contact: ' + error.message);
    }
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) => 
      CRMService.updateContact(id, data),
    onSuccess: () => {
      toast.success('Contact updated successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
    onError: (error) => {
      toast.error('Failed to update contact: ' + error.message);
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => CRMService.deleteContact(id),
    onSuccess: () => {
      toast.success('Contact deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['crm-contacts'] });
    },
    onError: (error) => {
      toast.error('Failed to delete contact: ' + error.message);
    }
  });

  const handleCreateContact = (contactData: Partial<Contact>) => {
    createContactMutation.mutate(contactData);
  };

  const handleUpdateContact = (id: string, contactData: Partial<Contact>) => {
    updateContactMutation.mutate({ id, data: contactData });
  };

  const handleDeleteContact = (id: string) => {
    deleteContactMutation.mutate(id);
  };

  return {
    contacts,
    isLoading,
    onCreateContact: handleCreateContact,
    onUpdateContact: handleUpdateContact,
    onDeleteContact: handleDeleteContact
  };
}
