
import { NotificationProcessor } from "./NotificationProcessor";
import { NotificationTester } from "./NotificationTester";
import { NotificationPreferencesPanel } from "./NotificationPreferencesPanel";
import { EmailDiagnosticTool } from "./EmailDiagnosticTool";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { hasRequiredRole } from "@/utils/roleUtils";
import { UserRole } from "@/types/auth";

export function NotificationSettings() {
  const { user } = useAuth();
  const isAdmin = user && hasRequiredRole(user.role as UserRole, 'AD');
  
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to access notification settings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      
      <Tabs defaultValue="preferences">
        <TabsList className="mb-4">
          <TabsTrigger value="preferences">Notification Preferences</TabsTrigger>
          <TabsTrigger value="test">Test Notifications</TabsTrigger>
          <TabsTrigger value="queue">Queue Processing</TabsTrigger>
          <TabsTrigger value="diagnostics">Email Diagnostics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preferences" className="space-y-4">
          <NotificationPreferencesPanel />
        </TabsContent>
        
        <TabsContent value="test" className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Use this tool to send test notifications to yourself for debugging and verification purposes.
          </p>
          <NotificationTester />
        </TabsContent>
        
        <TabsContent value="queue" className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Manually process the notification queue to send pending email notifications.
          </p>
          <NotificationProcessor />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>About Notification Queue</CardTitle>
              <CardDescription>
                How the notification system works
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <p>
                  The notification system uses a queue to handle email delivery in the background, 
                  allowing the application to continue functioning without waiting for emails to be sent.
                </p>
                
                <h3 className="font-medium text-base">Process Flow:</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>When a notification is created with email delivery enabled, it's added to the notification queue.</li>
                  <li>The queue processor periodically checks for pending notifications.</li>
                  <li>Emails are sent for each pending notification in the queue.</li>
                  <li>The notification status is updated to reflect delivery success or failure.</li>
                </ol>
                
                <p>
                  In production, the queue processor would typically run automatically on a schedule.
                  For testing purposes, you can manually trigger the processor using the controls above.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="diagnostics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Use this tool to directly test the email sending functionality with Resend.
                This helps isolate whether the issue is with the notification system or the email provider.
              </p>
              <EmailDiagnosticTool />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Common Email Issues</CardTitle>
                <CardDescription>
                  Troubleshooting guide for email notification problems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-base">Domain Verification</h3>
                  <p className="text-sm mt-1">
                    Ensure the domain <code>mail.bpiincworks.com</code> is properly verified in Resend's dashboard.
                    Check that all DNS records (SPF, DKIM, DMARC) are correctly configured.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-base">API Key Issues</h3>
                  <p className="text-sm mt-1">
                    Verify that the Resend API key is valid and has sufficient permissions.
                    The API key should be properly configured in Supabase secrets as <code>RESEND_API_KEY</code>.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-base">Email Limits</h3>
                  <p className="text-sm mt-1">
                    Check if you've reached any sending limits with Resend.
                    New accounts often have lower limits that may need to be increased.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-base">Edge Function Logs</h3>
                  <p className="text-sm mt-1">
                    Review the logs for <code>send-notification</code> edge function to see detailed error messages.
                    The Supabase dashboard provides logs for edge functions that can help diagnose issues.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
