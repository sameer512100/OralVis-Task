export interface Submission {
  id: string;
  patientName: string;
  patientId: string;
  email: string;
  notes: string;
  imageUrl: string;
  status: 'pending' | 'processing' | 'completed';
  submissionDate: string;
  reportUrl?: string;
  annotationData?: string;
  annotatedImageUrl?: string;
}

export interface SubmissionFormData {
  name: string;
  patientId: string;
  email: string;
  notes: string;
  image: File;
}

export interface AnnotationData {
  objects: Array<{
    type: string;
    left: number;
    top: number;
    width?: number;
    height?: number;
    radius?: number;
    stroke: string;
    fill: string;
    strokeWidth: number;
  }>;
}