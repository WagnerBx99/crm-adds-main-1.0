
import { cn } from '@/lib/utils';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  Settings, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { Metric } from '@/types';

interface StatCardProps {
  metric: Metric;
  className?: string;
}

export default function StatCard({ metric, className }: StatCardProps) {
  const getIcon = () => {
    switch (metric.icon) {
      case 'package':
        return <Package className="h-5 w-5 text-brand-blue" />;
      case 'check-circle':
        return <CheckCircle className="h-5 w-5 text-brand-blue" />;
      case 'clock':
        return <Clock className="h-5 w-5 text-brand-blue" />;
      case 'settings':
        return <Settings className="h-5 w-5 text-brand-blue" />;
      default:
        return <Package className="h-5 w-5 text-brand-blue" />;
    }
  };

  return (
    <div className={cn(
      "bg-white rounded-lg p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md",
      className
    )}>
      <div className="flex justify-between items-start">
        <div className="bg-blue-50 rounded-md p-2">
          {getIcon()}
        </div>
        
        {metric.change !== undefined && (
          <div className={cn(
            "flex items-center text-xs font-medium rounded-full px-2 py-0.5",
            metric.changeType === 'positive' 
              ? 'text-emerald-700 bg-emerald-50' 
              : metric.changeType === 'negative'
                ? 'text-rose-700 bg-rose-50'
                : 'text-gray-700 bg-gray-50'
          )}>
            {metric.changeType === 'positive' ? (
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
            )}
            {Math.abs(metric.change)}%
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <h3 className="text-gray-500 text-sm font-normal">{metric.title}</h3>
        <p className="text-xl font-semibold text-gray-900 mt-1">{metric.value}</p>
      </div>
    </div>
  );
}
