
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateForm } from "@/components/CertificateForm";
import { CertificateRequests } from "@/components/CertificateRequests";

export default function Certifications() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto">
          <CertificateForm />
          <CertificateRequests />
        </div>
      </div>
    </DashboardLayout>
  );
}
