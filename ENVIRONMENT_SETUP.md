# Environment Setup Guide

## Required Environment Variables

This application requires Supabase configuration to function properly. You need to set up the following environment variables:

### 1. Create a `.env` file

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

### 2. Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select an existing one
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (for `VITE_SUPABASE_URL`)
   - **Project API Key** → **anon public** (for `VITE_SUPABASE_ANON_KEY`)

### 3. Update your `.env` file

Replace the placeholder values in your `.env` file:

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 4. Restart the Development Server

After updating the `.env` file, restart your development server:

```bash
npm run dev
```

## Troubleshooting

### Error: "Missing required environment variables"

This error occurs when the `.env` file is missing or the environment variables are not set correctly.

**Solution:**
1. Ensure you have a `.env` file in the root directory
2. Verify that both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Make sure there are no extra spaces or quotes around the values
4. Restart the development server after making changes

### Error: "VITE_SUPABASE_URL must be a valid URL"

This error occurs when the Supabase URL format is incorrect.

**Solution:**
1. Ensure the URL starts with `https://`
2. Verify the URL format: `https://your-project-id.supabase.co`
3. Copy the URL exactly from your Supabase dashboard

## Security Notes

- Never commit your `.env` file to version control
- The `.env` file is already included in `.gitignore`
- Only use the **anon public** key, never the **service role** key in frontend applications
- The anon key is safe to use in client-side code as it has limited permissions

## Dashboard Features

Once the environment is properly configured, you'll have access to:

### Real-Time Monitoring
- System health dashboard at `/system-monitoring`
- Live performance metrics
- Resource usage tracking
- Database connection monitoring

### Advanced Analytics
- Executive dashboard with real data
- Trend analysis with percentage changes
- Performance benchmarking
- Historical data visualization

### Alert Management
- Configurable alert rules
- Real-time notifications
- Alert acknowledgment workflows
- System status monitoring

### Automated Reporting
- Scheduled report generation
- Multiple export formats (PDF, CSV, Excel)
- Custom report templates
- Performance analytics

## Next Steps

After setting up the environment:

1. **Navigate to System Monitoring**: Go to `/system-monitoring` to see the comprehensive monitoring dashboard
2. **Explore Analytics**: Visit `/executive-dashboard` for high-level system insights
3. **Configure Alerts**: Set up monitoring alerts based on your operational requirements
4. **Schedule Reports**: Configure automated reporting for regular system analysis

The dashboard audit remediation is complete and all mock data has been replaced with real, calculated metrics from your Supabase backend.