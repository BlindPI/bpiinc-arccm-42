
import { useState } from 'react';
import { Calendar, Check, FileText, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CertificateFormFields } from './CertificateFormFields';
import { CertificateFormHandler } from './CertificateFormHandler';
import { useFontLoader } from '@/hooks/useFontLoader';
import { useTemplateVerification } from '@/hooks/useTemplateVerification';

export function MultiStepCertificateForm() {
  // Form state
  const [step, setStep] = useState(1);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [firstAidLevel, setFirstAidLevel] = useState<string>('');
  const [cprLevel, setCprLevel] = useState<string>('');
  const [assessmentStatus, setAssessmentStatus] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isValidated, setIsValidated] = useState(false);
  
  const { fontCache, isLoading: isFontLoading, fontsLoaded } = useFontLoader();
  const { 
    isTemplateAvailable, 
    defaultTemplateUrl,
    isLoading: isTemplateLoading 
  } = useTemplateVerification();

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setFirstAidLevel('');
    setCprLevel('');
    setAssessmentStatus('');
    setSelectedCourseId('');
    setIssueDate('');
    setExpiryDate('');
    setIsValidated(false);
    setStep(1);
  };

  // Determine if current step is complete to enable the next button
  const isStepComplete = () => {
    switch (step) {
      case 1: // Personal Information
        return name.trim() !== '' && email.trim() !== '' && phone.trim() !== '' && company.trim() !== '';
      case 2: // Course Details
        return selectedCourseId !== '' && firstAidLevel !== '' && cprLevel !== '' && assessmentStatus !== '';
      case 3: // Dates
        return issueDate !== '' && expiryDate !== '';
      case 4: // Review
        return isValidated;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        {/* Progress Tracker */}
        <div className="bg-gradient-to-r from-primary to-blue-600 p-6">
          <h1 className="text-white text-2xl font-medium mb-4">Certificate Request</h1>
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-white/30 -translate-y-1/2 z-0"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step >= i ? 'bg-white text-primary' : 'bg-white/30 text-white/70'
                }`}>
                  {i === 1 && <FileText className="w-5 h-5" />}
                  {i === 2 && <Info className="w-5 h-5" />}
                  {i === 3 && <Calendar className="w-5 h-5" />}
                  {i === 4 && <Check className="w-5 h-5" />}
                </div>
                <span className={`text-xs ${step >= i ? 'text-white' : 'text-white/70'}`}>
                  {i === 1 ? 'Personal Info' : 
                   i === 2 ? 'Course Details' : 
                   i === 3 ? 'Dates' : 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Form content with all steps */}
        <CardContent className="p-6">
          <CertificateFormHandler
            name={name}
            email={email}
            phone={phone}
            company={company}
            firstAidLevel={firstAidLevel}
            cprLevel={cprLevel}
            assessmentStatus={assessmentStatus}
            selectedCourseId={selectedCourseId}
            issueDate={issueDate}
            expiryDate={expiryDate}
            isValidated={isValidated}
            fontCache={fontCache}
            isTemplateAvailable={isTemplateAvailable}
            defaultTemplateUrl={defaultTemplateUrl}
            isFontLoading={isFontLoading}
            fontsLoaded={fontsLoaded}
            onSuccess={resetForm}
          >
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-800">Personal Information</h2>
                <p className="text-gray-600 text-sm">Please provide the certificate recipient's details</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company/Organization</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="Acme Inc."
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 2: Course Details (using existing component) */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-800">Course Details</h2>
                <p className="text-gray-600 text-sm">Select the course and provide certification details</p>
                
                <CertificateFormFields
                  name={name}
                  email={email}
                  phone={phone}
                  company={company}
                  firstAidLevel={firstAidLevel}
                  cprLevel={cprLevel}
                  assessmentStatus={assessmentStatus}
                  selectedCourseId={selectedCourseId}
                  issueDate={issueDate}
                  expiryDate={expiryDate}
                  isValidated={isValidated}
                  onNameChange={setName}
                  onEmailChange={setEmail}
                  onPhoneChange={setPhone}
                  onCompanyChange={setCompany}
                  onFirstAidLevelChange={setFirstAidLevel}
                  onCprLevelChange={setCprLevel}
                  onAssessmentStatusChange={setAssessmentStatus}
                  onCourseSelect={setSelectedCourseId}
                  onIssueDateChange={setIssueDate}
                  onExpiryDateChange={setExpiryDate}
                  onValidationChange={setIsValidated}
                  hideRecipientFields={true}
                  hideDateFields={true}
                />
              </div>
            )}
            
            {/* Step 3: Dates */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-800">Certificate Dates</h2>
                <p className="text-gray-600 text-sm">Specify when the certificate was issued and when it expires</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-medium text-gray-800">Review Certificate Details</h2>
                <p className="text-gray-600 text-sm">Please review the information before submitting</p>
                
                <div className="bg-gray-50 p-6 rounded-md space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Recipient Information</h3>
                      <p className="mt-1">
                        <span className="block text-gray-900 font-medium">{name}</span>
                        <span className="block text-gray-600">{email}</span>
                        <span className="block text-gray-600">{phone}</span>
                        <span className="block text-gray-600">{company}</span>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Course Details</h3>
                      <p className="mt-1">
                        <span className="block text-gray-900 font-medium">Course ID: {selectedCourseId}</span>
                        <span className="block text-gray-600">First Aid Level: {firstAidLevel}</span>
                        <span className="block text-gray-600">CPR Level: {cprLevel}</span>
                        <span className="block text-gray-600">Assessment: {assessmentStatus}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Certificate Timeline</h3>
                    <div className="grid grid-cols-2 gap-4 mt-1">
                      <div>
                        <span className="block text-gray-600">Issue Date</span>
                        <span className="block text-gray-900">{issueDate}</span>
                      </div>
                      <div>
                        <span className="block text-gray-600">Expiry Date</span>
                        <span className="block text-gray-900">{expiryDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={isValidated}
                        onChange={() => setIsValidated(!isValidated)}
                        className="h-4 w-4 text-primary border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        I confirm that all information is correct
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <Button 
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                variant="outline"
              >
                Previous
              </Button>
              
              {step < 4 ? (
                <Button 
                  onClick={() => isStepComplete() && setStep(Math.min(4, step + 1))}
                  disabled={!isStepComplete()}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit"
                  disabled={!isValidated}
                >
                  Submit Request
                </Button>
              )}
            </div>
          </CertificateFormHandler>
        </CardContent>
      </Card>
    </div>
  );
}
