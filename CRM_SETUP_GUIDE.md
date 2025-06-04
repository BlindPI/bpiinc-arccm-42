# CRM System Setup Guide

## 🚀 Quick Setup Instructions

### 1. Database Setup (SQL Migration)

**Run this SQL migration in your Supabase SQL Editor:**

```sql
-- Copy and paste the entire contents of: supabase/migrations/20241204_create_crm_tables.sql
```

The migration file creates:
- ✅ All CRM tables (leads, opportunities, activities, tasks, revenue, etc.)
- ✅ Default pipeline stages (Qualified Lead → Closed Won/Lost)
- ✅ Sample lead scoring rules
- ✅ Default assignment rules
- ✅ Proper indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Automatic timestamp triggers

### 2. Navigation Visibility Fix

The CRM navigation should now be visible in the sidebar as "Sales CRM" under the "Sales & CRM" group. If it's not visible:

**Option A: Automatic (Recommended)**
- The system will use emergency defaults that include CRM access for SA users
- Simply refresh the page after running the SQL migration

**Option B: Manual Configuration**
1. Go to Settings → System Administration
2. Navigate to Navigation Visibility settings
3. Ensure "Sales & CRM" group is enabled
4. Ensure "Sales CRM" item is enabled for your role

### 3. Verification Steps

After running the SQL migration:

1. **Check Database Tables:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name LIKE 'crm_%';
   ```
   Should return 10 CRM tables.

2. **Check Navigation:**
   - Refresh the application at arccm.netlify.app
   - Look for "Sales CRM" in the sidebar under "Sales & CRM"
   - Click to access the CRM dashboard

3. **Test CRM Functionality:**
   - Navigate to `/crm` - should show the CRM dashboard
   - Try creating a test lead
   - Check that all modules are accessible (Leads, Opportunities, Activities, etc.)

## 📊 CRM Module Overview

Once set up, you'll have access to:

### Core Modules
- **📈 Dashboard** - Overview metrics and quick actions
- **👥 Leads** - Lead management with scoring and assignment
- **🎯 Opportunities** - Sales pipeline with drag-and-drop stages
- **📅 Activities** - Task management and activity tracking
- **📧 Email Campaigns** - Campaign creation and analytics
- **💰 Revenue Tracking** - Financial performance and commissions
- **⚙️ Settings** - Pipeline, scoring, and assignment configuration

### Key Features
- **Real-time data integration** with Supabase
- **Automated lead scoring** based on configurable rules
- **Intelligent lead assignment** with multiple strategies
- **Comprehensive revenue tracking** with AP performance analytics
- **Email campaign management** with template library
- **Advanced analytics** with performance insights

## 🔧 Troubleshooting

### CRM Not Visible in Navigation
1. Check that you're logged in as an SA user
2. Verify the SQL migration ran successfully
3. Clear browser cache and refresh
4. Check browser console for any JavaScript errors

### Database Connection Issues
1. Verify Supabase connection is working
2. Check that RLS policies allow your user access
3. Ensure all tables were created successfully

### Performance Issues
1. All necessary indexes are created by the migration
2. Consider adding more specific indexes based on usage patterns
3. Monitor query performance in Supabase dashboard

## 📝 Next Steps

After successful setup:

1. **Configure Pipeline Stages** - Customize stages to match your sales process
2. **Set Up Lead Scoring Rules** - Define rules that match your lead qualification criteria
3. **Configure Assignment Rules** - Set up automatic lead assignment based on territory, skills, etc.
4. **Import Existing Data** - Use the lead import wizard to bring in existing leads
5. **Train Users** - Familiarize your team with the CRM interface and workflows

## 🆘 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify all SQL tables were created successfully
3. Ensure proper user permissions in Supabase
4. Contact support with specific error messages and steps to reproduce

---

**The CRM system is now ready for use! 🎉**