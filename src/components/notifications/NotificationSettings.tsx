
import { NotificationProcessor } from "./NotificationProcessor";
import { NotificationTester } from "./NotificationTester";
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
      
      <Tabs defaultValue="test">
        <TabsList className="mb-4">
          <TabsTrigger value="test">Test Notifications</TabsTrigger>
          <TabsTrigger value="queue">Queue Processing</TabsTrigger>
        </TabsList>
        
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
      </Tabs>
    </div>
  );
}
