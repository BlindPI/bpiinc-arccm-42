
import { Button } from "@/components/ui/button";
import { FileCheck2, Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (email: string, password: string) => {
    await signIn(email, password);
    setShowAuthDialog(false);
    navigate('/');
  };

  const handleSignUp = async (email: string, password: string) => {
    await signUp(email, password);
    setShowAuthDialog(false);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      <div className="relative pt-16 pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8 mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Certification Compliance</span>
              <span className="block text-primary">Made Simple.</span>
              <span className="block text-2xl sm:text-3xl md:text-4xl mt-2">
                Stay Audit-Ready, Always.
              </span>
            </h1>
            <p className="mx-auto max-w-3xl text-base text-gray-500 sm:text-lg md:text-xl">
              Assured Response CCM automates compliance tracking, simplifies certification workflows, 
              and keeps your team prepared for inspections – so you can focus on what matters most.
            </p>
            <div className="flex flex-col items-center gap-3">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => setShowAuthDialog(true)}
              >
                Start Your Free Trial →
              </Button>
              <p className="text-sm text-gray-500">
                No credit card required. Get audit-ready in minutes.
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <FileCheck2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Instant Compliance Visibility</h3>
                    <p className="text-gray-500">
                      Track certifications, licenses, and training statuses in real-time across your entire organization.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Avoid Costly Audit Surprises</h3>
                    <p className="text-gray-500">
                      Automated alerts for expiring documents and actionable insights to close compliance gaps.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg sm:col-span-2 lg:col-span-1">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="rounded-full bg-primary/10 p-3">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Built for Teams</h3>
                    <p className="text-gray-500">
                      Collaborate seamlessly with APs, instructors, and auditors in one secure platform.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome</DialogTitle>
            <DialogDescription>
              Start managing your compliance certifications efficiently
            </DialogDescription>
          </DialogHeader>
          <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
