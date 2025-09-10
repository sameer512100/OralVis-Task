import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { AnnotationCanvas } from '@/components/admin/AnnotationCanvas';
import { submissionAPI } from '@/services/api';
import { Submission } from '@/types/submission';
import { toast } from 'sonner';
import { ArrowLeft, FileText, User, Mail, IdCard, Calendar, StickyNote } from 'lucide-react';
import { format } from 'date-fns';

const AdminSubmissionView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSubmission(id);
    }
  }, [id]);

  const fetchSubmission = async (submissionId: string) => {
    try {
      const data = await submissionAPI.getSubmission(submissionId);
      setSubmission(data);
    } catch (error: any) {
      toast.error('Failed to fetch submission details');
      navigate('/admin/submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAnnotation = async (annotationData: any, annotatedImage: Blob) => {
    if (!submission) return;

    try {
      const updatedSubmission = await submissionAPI.saveAnnotation(submission.id, {
        annotationData,
        annotatedImage,
      });
      setSubmission(updatedSubmission);
      toast.success('Annotation saved successfully!');
    } catch (error: any) {
      toast.error('Failed to save annotation');
    }
  };

  const handleGenerateReport = async () => {
    if (!submission) return;

    setIsGeneratingReport(true);
    try {
      const result = await submissionAPI.generateReport(submission.id);
      setSubmission(prev => prev ? { ...prev, reportUrl: result.reportUrl, status: 'completed' } : prev);
      toast.success('Report generated successfully!');
    } catch (error: any) {
      toast.error('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-medical-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-medical-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Submission Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested submission could not be found.</p>
          <Button onClick={() => navigate('/admin/submissions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medical-bg">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/submissions')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Submissions
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Patient Submission Details
            </h1>
            <p className="text-muted-foreground">
              Review and annotate patient submission
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>{submission.patientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Patient ID:</span>
                    <span>{submission.patientId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{submission.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Submitted:</span>
                    <span>{format(new Date(submission.submissionDate), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Status:</span>
                    <StatusBadge status={submission.status} />
                  </div>
                </div>

                {submission.notes && (
                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-2 text-sm">
                      <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium block mb-1">Notes:</span>
                        <p className="text-muted-foreground">{submission.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Generate reports and manage submission status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="w-full flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </Button>

                {submission.reportUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(submission.reportUrl, '_blank')}
                    className="w-full"
                  >
                    View Generated Report
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Annotation Canvas */}
          <div className="lg:col-span-2">
            <AnnotationCanvas
              imageUrl={submission.imageUrl}
              onSave={handleSaveAnnotation}
              existingAnnotations={submission.annotationData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSubmissionView;