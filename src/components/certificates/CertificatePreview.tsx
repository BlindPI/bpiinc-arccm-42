import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Link, Share2 } from 'lucide-react';
import { format } from 'date-fns';

interface CertificatePreviewProps {
  recipientName: string;
  courseName: string;
  issueDate: string;
  expiryDate: string;
  verificationCode: string;
  certificateUrl?: string;
  onDownload?: () => void;
}

export function CertificatePreview({
  recipientName = 'John Smith',
  courseName = 'First Aid Level 3',
  issueDate = '2025-04-15',
  expiryDate = '2027-04-15',
  verificationCode = 'LVB-2025-04-15-789',
  certificateUrl,
  onDownload
}: CertificatePreviewProps) {
  const [verificationInput, setVerificationInput] = useState('');
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  const handleVerify = () => {
    // In a real app, this would call an API
    setIsVerified(verificationInput === verificationCode);
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM d, yyyy');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Certificate Preview */}
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary to-blue-600 p-4">
              <h2 className="text-white text-xl font-medium">Certificate Preview</h2>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              <div className="w-full aspect-[1.4/1] bg-gray-50 border-2 border-gray-200 rounded-lg flex items-center justify-center mb-6 relative">
                {/* Simulated certificate preview */}
                <div className="w-5/6 h-5/6 border-8 border-double border-blue-200 rounded-md flex flex-col items-center justify-center p-8 bg-white">
                  <div className="text-sm text-gray-500 mb-2">CERTIFICATE OF COMPLETION</div>
                  <div className="text-xl font-serif font-medium text-gray-800 mb-2">This certifies that</div>
                  <div className="text-3xl font-serif font-bold text-primary mb-2">{recipientName}</div>
                  <div className="text-xl font-serif font-medium text-gray-800 mb-2">has successfully completed</div>
                  <div className="text-2xl font-serif font-bold text-blue-700 mb-4">{courseName}</div>
                  <div className="text-sm text-gray-600 mb-1">Issue Date: {formatDate(issueDate)}</div>
                  <div className="text-sm text-gray-600 mb-4">Expiry Date: {formatDate(expiryDate)}</div>
                  <div className="text-sm text-gray-500">Verification Code: {verificationCode}</div>
                </div>
                
                {/* Certificate stamp/watermark */}
                <div className="absolute bottom-4 right-4 h-24 w-24 rounded-full border-2 border-red-300 flex items-center justify-center rotate-12">
                  <div className="text-red-500 text-xs font-bold text-center">
                    CERTIFIED<br />AUTHENTIC
                  </div>
                </div>
              </div>
              
              <div className="w-full flex flex-wrap justify-center gap-2">
                <Button onClick={onDownload} className="bg-primary hover:bg-primary/90">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Certificate
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Link className="w-4 h-4 mr-2" />
                  Copy Public Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Verification Panel */}
        <div>
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 p-4">
              <h2 className="text-white text-xl font-medium">Verify Certificate</h2>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Enter the verification code to confirm this certificate's authenticity
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationInput}
                    onChange={(e) => setVerificationInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="LVB-YYYY-MM-DD-XXX"
                  />
                </div>
                
                <Button 
                  onClick={handleVerify}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Verify Certificate
                </Button>
                
                {isVerified !== null && (
                  <div className={`mt-4 p-4 rounded-md ${isVerified ? 'bg-green-50' : 'bg-red-50'}`}>
                    {isVerified ? (
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                        <span className="text-green-700">Certificate verified! This is an authentic certificate.</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-red-700">Invalid verification code. Please check and try again.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-800 mb-2">Certificate Details</h3>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Recipient:</span>
                    <p className="text-sm text-gray-800">{recipientName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Course:</span>
                    <p className="text-sm text-gray-800">{courseName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Issued Date:</span>
                    <p className="text-sm text-gray-800">{formatDate(issueDate)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Expiry Date:</span>
                    <p className="text-sm text-gray-800">{formatDate(expiryDate)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status:</span>
                    <p className="text-sm text-green-600 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
