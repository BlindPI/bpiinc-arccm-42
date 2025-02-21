
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateForm } from "@/components/CertificateForm";

export default function Certifications() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <CertificateForm />
      </div>
    </DashboardLayout>
  );
}
