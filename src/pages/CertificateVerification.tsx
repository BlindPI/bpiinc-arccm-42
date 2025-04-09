
import { DashboardLayout } from "@/components/DashboardLayout";
import { CertificateVerifier } from "@/components/certificates/CertificateVerifier";

export default function CertificateVerification() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">Certificate Verification</h1>
        <p className="text-muted-foreground mb-6">
          Use this tool to verify the authenticity of certificates issued by our organization.
        </p>
        
        <div className="mt-6">
          <CertificateVerifier />
        </div>
      </div>
    </DashboardLayout>
  );
}
