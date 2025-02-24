
import type { Team } from "@/types/user-management";

export const transformTeamData = (rawData: any): Team => {
  return {
    id: rawData.id,
    name: rawData.name,
    description: rawData.description || null,
    metadata: rawData.metadata || { visibility: 'private' },
    created_at: rawData.created_at,
    updated_at: rawData.updated_at,
    parent_id: rawData.parent_id,
  };
};
