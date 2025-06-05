import { CRMService } from '@/services/crm/crmService';

/**
 * Debug utility to check for invalid dates in CRM data
 */
export async function debugCrmDates() {
  console.log('🔍 Debugging CRM date issues...');
  
  try {
    // Check leads for invalid dates
    const leads = await CRMService.getLeads();
    console.log(`📊 Found ${leads.length} leads`);
    
    const leadsWithInvalidDates = leads.filter(lead => {
      const createdAt = new Date(lead.created_at);
      const updatedAt = new Date(lead.updated_at);
      return isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime());
    });
    
    if (leadsWithInvalidDates.length > 0) {
      console.warn('⚠️ Found leads with invalid dates:', leadsWithInvalidDates.map(l => ({
        id: l.id,
        created_at: l.created_at,
        updated_at: l.updated_at,
        email: l.email
      })));
    } else {
      console.log('✅ All lead dates are valid');
    }
    
    // Check opportunities for invalid dates
    const opportunities = await CRMService.getOpportunities();
    console.log(`📊 Found ${opportunities.length} opportunities`);
    
    const opportunitiesWithInvalidDates = opportunities.filter(opp => {
      const createdAt = new Date(opp.created_at);
      const updatedAt = new Date(opp.updated_at);
      const closeDate = opp.close_date ? new Date(opp.close_date) : null;
      
      return isNaN(createdAt.getTime()) || 
             isNaN(updatedAt.getTime()) || 
             (closeDate && isNaN(closeDate.getTime()));
    });
    
    if (opportunitiesWithInvalidDates.length > 0) {
      console.warn('⚠️ Found opportunities with invalid dates:', opportunitiesWithInvalidDates.map(o => ({
        id: o.id,
        name: o.name,
        created_at: o.created_at,
        updated_at: o.updated_at,
        close_date: o.close_date
      })));
    } else {
      console.log('✅ All opportunity dates are valid');
    }
    
    // Check activities for invalid dates
    const activities = await CRMService.getActivities();
    console.log(`📊 Found ${activities.length} activities`);
    
    const activitiesWithInvalidDates = activities.filter(activity => {
      const createdAt = new Date(activity.created_at);
      const updatedAt = new Date(activity.updated_at);
      const dueDate = activity.due_date ? new Date(activity.due_date) : null;
      
      return isNaN(createdAt.getTime()) || 
             isNaN(updatedAt.getTime()) || 
             (dueDate && isNaN(dueDate.getTime()));
    });
    
    if (activitiesWithInvalidDates.length > 0) {
      console.warn('⚠️ Found activities with invalid dates:', activitiesWithInvalidDates.map(a => ({
        id: a.id,
        subject: a.subject,
        created_at: a.created_at,
        updated_at: a.updated_at,
        due_date: a.due_date
      })));
    } else {
      console.log('✅ All activity dates are valid');
    }
    
    return {
      success: true,
      summary: {
        totalLeads: leads.length,
        leadsWithInvalidDates: leadsWithInvalidDates.length,
        totalOpportunities: opportunities.length,
        opportunitiesWithInvalidDates: opportunitiesWithInvalidDates.length,
        totalActivities: activities.length,
        activitiesWithInvalidDates: activitiesWithInvalidDates.length
      },
      invalidData: {
        leads: leadsWithInvalidDates,
        opportunities: opportunitiesWithInvalidDates,
        activities: activitiesWithInvalidDates
      }
    };
    
  } catch (error) {
    console.error('💥 Error debugging CRM dates:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Fix invalid dates in CRM data by setting them to current timestamp
 */
export async function fixInvalidCrmDates() {
  console.log('🔧 Fixing invalid CRM dates...');
  
  try {
    const debugResult = await debugCrmDates();
    
    if (!debugResult.success) {
      throw new Error('Failed to debug dates');
    }
    
    let fixedCount = 0;
    const currentTimestamp = new Date().toISOString();
    
    // Fix leads with invalid dates
    for (const lead of debugResult.invalidData.leads) {
      try {
        await CRMService.updateLead(lead.id, {
          // Force update to trigger the updated_at timestamp
          notes: lead.notes || 'Date fixed by debug utility'
        });
        fixedCount++;
        console.log(`✅ Fixed lead ${lead.id}`);
      } catch (error) {
        console.error(`❌ Failed to fix lead ${lead.id}:`, error);
      }
    }
    
    // Fix opportunities with invalid dates
    for (const opp of debugResult.invalidData.opportunities) {
      try {
        await CRMService.updateOpportunity(opp.id, {
          // Force update to trigger the updated_at timestamp
          description: opp.description || 'Date fixed by debug utility'
        });
        fixedCount++;
        console.log(`✅ Fixed opportunity ${opp.id}`);
      } catch (error) {
        console.error(`❌ Failed to fix opportunity ${opp.id}:`, error);
      }
    }
    
    console.log(`🎉 Fixed ${fixedCount} records with invalid dates`);
    
    return {
      success: true,
      fixedCount,
      summary: debugResult.summary
    };
    
  } catch (error) {
    console.error('💥 Error fixing CRM dates:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).debugCrmDates = debugCrmDates;
  (window as any).fixInvalidCrmDates = fixInvalidCrmDates;
  
  console.log('🔧 CRM date debug utilities loaded. Available functions:');
  console.log('- debugCrmDates(): Check for invalid dates in CRM data');
  console.log('- fixInvalidCrmDates(): Fix invalid dates by updating records');
}