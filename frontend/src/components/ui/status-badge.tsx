import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed';
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          className: 'bg-medical-warning/10 text-medical-warning border-medical-warning/20',
          text: 'Pending',
        };
      case 'processing':
        return {
          variant: 'secondary' as const,
          className: 'bg-medical-info/10 text-medical-info border-medical-info/20',
          text: 'Processing',
        };
      case 'completed':
        return {
          variant: 'secondary' as const,
          className: 'bg-medical-success/10 text-medical-success border-medical-success/20',
          text: 'Completed',
        };
      default:
        return {
          variant: 'secondary' as const,
          className: '',
          text: status,
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.text}
    </Badge>
  );
};