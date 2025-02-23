
import { FileCheck2, Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function HeroSection() {
  return (
    <div className="relative w-full">
      <div className="relative py-12 lg:py-16">
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
          </div>

          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-3">
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

              <Card className="border-0 shadow-lg xl:col-span-1 sm:col-span-2 lg:col-span-1">
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
    </div>
  );
}
