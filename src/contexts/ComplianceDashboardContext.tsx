import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { ComplianceService, ComplianceSummary, ComplianceAction, UserComplianceRecord, ComplianceDocument } from '@/services/compliance/complianceService';
import { ComplianceTierService, ComplianceTierInfo } from '@/services/compliance/complianceTierService';
import { TeamMemberComplianceService, TeamMemberComplianceStatus, ProviderComplianceSummary } from '@/services/compliance/teamMemberComplianceService';

// Types for dashboard state
export interface ComplianceNotification {
  id: string;
  type: 'document_uploaded' | 'document_approved' | 'document_rejected' | 'action_due' | 'tier_changed';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface UploadItem {
  id: string;
  file: File;
  metricId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface FilterState {
  status: 'all' | 'compliant' | 'non_compliant' | 'warning' | 'pending';
  category: string;
  dateRange: {
    start?: string;
    end?: string;
  };
}

export interface ViewState {
  activeTab: string;
  layout: 'grid' | 'list';
  compactMode: boolean;
  showCompleted: boolean;
}

export interface ComplianceDashboardData {
  // Personal data (all roles)
  complianceSummary: ComplianceSummary | null;
  complianceRecords: UserComplianceRecord[];
  complianceActions: ComplianceAction[];
  complianceDocuments: ComplianceDocument[];
  tierInfo: ComplianceTierInfo | null;
  
  // Team data (AP role)
  teamMemberCompliance: TeamMemberComplianceStatus[];
  providerSummary: ProviderComplianceSummary | null;
  
  // Admin data (SA/AD roles)
  allComplianceRecords: UserComplianceRecord[];
  documentsForVerification: ComplianceDocument[];
  systemStatistics: any;
}

export interface ComplianceDashboardState {
  // User and role info
  userId: string;
  userRole: 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT';
  displayName: string;
  
  // Data state
  data: ComplianceDashboardData;
  loading: boolean;
  error: string | null;
  
  // UI state
  notifications: ComplianceNotification[];
  uploadQueue: UploadItem[];
  filters: FilterState;
  view: ViewState;
  
  // Modal states
  uploadModalOpen: boolean;
  selectedMetricId: string | null;
  
  // Dropdown states
  dropdowns: {
    notificationOpen: boolean;
    settingsOpen: boolean;
  };
}

// Action types
type ComplianceDashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER_INFO'; payload: { userId: string; userRole: string; displayName: string } }
  | { type: 'SET_COMPLIANCE_DATA'; payload: Partial<ComplianceDashboardData> }
  | { type: 'ADD_NOTIFICATION'; payload: ComplianceNotification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'ADD_UPLOAD_ITEM'; payload: UploadItem }
  | { type: 'UPDATE_UPLOAD_PROGRESS'; payload: { id: string; progress: number; status?: string } }
  | { type: 'REMOVE_UPLOAD_ITEM'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'SET_VIEW'; payload: Partial<ViewState> }
  | { type: 'OPEN_UPLOAD_MODAL'; payload: string }
  | { type: 'CLOSE_UPLOAD_MODAL' }
  | { type: 'TOGGLE_NOTIFICATION_DROPDOWN' }
  | { type: 'TOGGLE_SETTINGS_DROPDOWN' }
  | { type: 'CLOSE_ALL_DROPDOWNS' }
  | { type: 'REFRESH_DATA' };

// Initial state
const initialState: ComplianceDashboardState = {
  userId: '',
  userRole: 'IC',
  displayName: '',
  data: {
    complianceSummary: null,
    complianceRecords: [],
    complianceActions: [],
    complianceDocuments: [],
    tierInfo: null,
    teamMemberCompliance: [],
    providerSummary: null,
    allComplianceRecords: [],
    documentsForVerification: [],
    systemStatistics: null
  },
  loading: false,
  error: null,
  notifications: [],
  uploadQueue: [],
  filters: {
    status: 'all',
    category: '',
    dateRange: {}
  },
  view: {
    activeTab: 'overview',
    layout: 'grid',
    compactMode: false,
    showCompleted: true
  },
  uploadModalOpen: false,
  selectedMetricId: null,
  dropdowns: {
    notificationOpen: false,
    settingsOpen: false
  }
};

// Reducer
function complianceDashboardReducer(
  state: ComplianceDashboardState, 
  action: ComplianceDashboardAction
): ComplianceDashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_USER_INFO':
      return { 
        ...state, 
        userId: action.payload.userId,
        userRole: action.payload.userRole as any,
        displayName: action.payload.displayName
      };
    
    case 'SET_COMPLIANCE_DATA':
      return {
        ...state,
        data: { ...state.data, ...action.payload },
        loading: false,
        error: null
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      };
    
    case 'ADD_UPLOAD_ITEM':
      return {
        ...state,
        uploadQueue: [...state.uploadQueue, action.payload]
      };
    
    case 'UPDATE_UPLOAD_PROGRESS':
      return {
        ...state,
        uploadQueue: state.uploadQueue.map(item =>
          item.id === action.payload.id
            ? {
                ...item,
                progress: action.payload.progress,
                status: (action.payload.status as 'pending' | 'uploading' | 'completed' | 'failed') || item.status
              }
            : item
        )
      };
    
    case 'REMOVE_UPLOAD_ITEM':
      return {
        ...state,
        uploadQueue: state.uploadQueue.filter(item => item.id !== action.payload)
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
    
    case 'SET_VIEW':
      return {
        ...state,
        view: { ...state.view, ...action.payload }
      };
    
    case 'OPEN_UPLOAD_MODAL':
      return {
        ...state,
        uploadModalOpen: true,
        selectedMetricId: action.payload
      };
    
    case 'CLOSE_UPLOAD_MODAL':
      return {
        ...state,
        uploadModalOpen: false,
        selectedMetricId: null
      };
    
    case 'TOGGLE_NOTIFICATION_DROPDOWN':
      return {
        ...state,
        dropdowns: {
          ...state.dropdowns,
          notificationOpen: !state.dropdowns.notificationOpen,
          settingsOpen: false // Close settings when opening notifications
        }
      };
    
    case 'TOGGLE_SETTINGS_DROPDOWN':
      return {
        ...state,
        dropdowns: {
          ...state.dropdowns,
          settingsOpen: !state.dropdowns.settingsOpen,
          notificationOpen: false // Close notifications when opening settings
        }
      };
    
    case 'CLOSE_ALL_DROPDOWNS':
      return {
        ...state,
        dropdowns: {
          notificationOpen: false,
          settingsOpen: false
        }
      };
    
    case 'REFRESH_DATA':
      return {
        ...state,
        loading: true,
        error: null
      };
    
    default:
      return state;
  }
}

// Context
interface ComplianceDashboardContextType {
  state: ComplianceDashboardState;
  dispatch: React.Dispatch<ComplianceDashboardAction>;
  
  // Action creators
  loadDashboardData: () => Promise<void>;
  refreshData: () => Promise<void>;
  uploadDocument: (file: File, metricId: string, expiryDate?: string) => Promise<void>;
  markActionComplete: (actionId: string) => Promise<void>;
  addNotification: (notification: Omit<ComplianceNotification, 'id' | 'timestamp'>) => void;
  markAllNotificationsRead: () => void;
}

const ComplianceDashboardContext = createContext<ComplianceDashboardContextType | undefined>(undefined);

// Provider component
interface ComplianceDashboardProviderProps {
  children: React.ReactNode;
  userId: string;
  userRole: string;
  displayName: string;
}

export function ComplianceDashboardProvider({ 
  children, 
  userId, 
  userRole, 
  displayName 
}: ComplianceDashboardProviderProps) {
  const [state, dispatch] = useReducer(complianceDashboardReducer, initialState);

  // Initialize user info
  useEffect(() => {
    dispatch({
      type: 'SET_USER_INFO',
      payload: { userId, userRole, displayName }
    });
  }, [userId, userRole, displayName]);

  // Load dashboard data based on role
  const loadDashboardData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Common data for all roles
      const [complianceSummary, complianceRecords, complianceActions, complianceDocuments] = 
        await Promise.all([
          ComplianceService.getUserComplianceSummary(userId),
          ComplianceService.getUserComplianceRecords(userId),
          ComplianceService.getUserComplianceActions(userId),
          ComplianceService.getUserComplianceDocuments(userId)
        ]);

      // Get tier information
      const tierInfo = await ComplianceTierService.getUserComplianceTierInfo(userId);

      let additionalData: Partial<ComplianceDashboardData> = {};

      // Role-specific data loading
      switch (userRole) {
        case 'SA':
        case 'AD':
          // Admin data
          const [allRecords, documentsForVerification] = await Promise.all([
            ComplianceService.getAllComplianceRecords(),
            ComplianceService.getDocumentsForVerification()
          ]);
          additionalData = {
            allComplianceRecords: allRecords,
            documentsForVerification: documentsForVerification
          };
          break;

        case 'AP':
          // Provider data
          const [teamMemberCompliance, providerSummary] = await Promise.all([
            TeamMemberComplianceService.getProviderTeamMemberCompliance(userId),
            TeamMemberComplianceService.getProviderComplianceSummary(userId)
          ]);
          additionalData = {
            teamMemberCompliance: teamMemberCompliance,
            providerSummary: providerSummary
          };
          break;

        default:
          // Individual contributor data is already loaded above
          break;
      }

      dispatch({
        type: 'SET_COMPLIANCE_DATA',
        payload: {
          complianceSummary,
          complianceRecords,
          complianceActions,
          complianceDocuments,
          tierInfo,
          ...additionalData
        }
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load dashboard data'
      });
    }
  }, [userId, userRole]);

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  // Upload document
  const uploadDocument = useCallback(async (file: File, metricId: string, expiryDate?: string) => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Add to upload queue
      dispatch({
        type: 'ADD_UPLOAD_ITEM',
        payload: {
          id: uploadId,
          file,
          metricId,
          progress: 0,
          status: 'uploading'
        }
      });

      // Upload document using real service
      await ComplianceService.uploadComplianceDocument(userId, metricId, file, expiryDate);

      // Complete upload
      dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        payload: { id: uploadId, progress: 100, status: 'completed' }
      });

      // Remove from queue after delay
      setTimeout(() => {
        dispatch({ type: 'REMOVE_UPLOAD_ITEM', payload: uploadId });
      }, 2000);

      // Add success notification
      addNotification({
        type: 'document_uploaded',
        title: 'Document Uploaded',
        message: `${file.name} has been uploaded successfully`,
        read: false
      });

      // Refresh data
      await refreshData();

    } catch (error) {
      console.error('Upload failed:', error);
      dispatch({
        type: 'UPDATE_UPLOAD_PROGRESS',
        payload: { 
          id: uploadId, 
          progress: 0, 
          status: 'failed'
        }
      });

      // Add error notification
      addNotification({
        type: 'document_uploaded',
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'Failed to upload document',
        read: false
      });
    }
  }, [userId, refreshData]);

  // Mark action complete
  const markActionComplete = useCallback(async (actionId: string) => {
    try {
      await ComplianceService.updateComplianceActionStatus(actionId, 'completed');
      
      addNotification({
        type: 'action_due',
        title: 'Action Completed',
        message: 'Compliance action marked as completed',
        read: false
      });

      await refreshData();
    } catch (error) {
      console.error('Failed to complete action:', error);
      addNotification({
        type: 'action_due',
        title: 'Action Failed',
        message: 'Failed to complete action',
        read: false
      });
    }
  }, [refreshData]);

  // Add notification
  const addNotification = useCallback((notification: Omit<ComplianceNotification, 'id' | 'timestamp'>) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      }
    });
  }, []);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
  }, []);

  // Load data on mount
  useEffect(() => {
    if (userId && userRole) {
      loadDashboardData();
    }
  }, [userId, userRole, loadDashboardData]);

  const contextValue: ComplianceDashboardContextType = {
    state,
    dispatch,
    loadDashboardData,
    refreshData,
    uploadDocument,
    markActionComplete,
    addNotification,
    markAllNotificationsRead
  };

  return (
    <ComplianceDashboardContext.Provider value={contextValue}>
      {children}
    </ComplianceDashboardContext.Provider>
  );
}

// Hook to use the context
export function useComplianceDashboard() {
  const context = useContext(ComplianceDashboardContext);
  if (context === undefined) {
    throw new Error('useComplianceDashboard must be used within a ComplianceDashboardProvider');
  }
  return context;
}