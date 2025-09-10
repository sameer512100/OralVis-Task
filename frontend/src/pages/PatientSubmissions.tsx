import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { submissionAPI } from '@/services/api';
import { Submission } from '@/types/submission';
import { toast } from 'sonner';
import { FileText, Download, Upload, Eye } from 'lucide-react';
import { format } from 'date-fns';

const PatientSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await submissionAPI.getMySubmissions();
      setSubmissions(data);
    } catch (error: any) {
      toast.error('Failed to fetch submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = (reportUrl: string) => {
    window.open(reportUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-medical-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medical-bg">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Submissions</h1>
            <p className="mt-2 text-muted-foreground">
              Track the status of your dental image submissions
            </p>
          </div>
          <Link to="/dashboard">
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              New Upload
            </Button>
          </Link>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Submission History
            </CardTitle>
            <CardDescription>
              View all your submitted dental images and their analysis status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No submissions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first dental image to get started
                </p>
                <Link to="/dashboard">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submission ID</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Report</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {format(new Date(submission.submissionDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={submission.status} />
                        </TableCell>
                        <TableCell>
                          {submission.reportUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReport(submission.reportUrl!)}
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download PDF
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {submission.status === 'pending' ? 'Waiting...' : 'Processing...'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(submission.imageUrl, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Image
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientSubmissions;