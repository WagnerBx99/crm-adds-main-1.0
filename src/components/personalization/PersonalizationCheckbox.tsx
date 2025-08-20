import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { Info, LucideIcon } from 'lucide-react';

interface PersonalizationCheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: LucideIcon;
  label: string;
  description?: string;
  tooltip?: string;
  iconColor?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function PersonalizationCheckbox({
  id,
  checked,
  onCheckedChange,
  icon: Icon,
  label,
  description,
  tooltip,
  iconColor = 'text-blue-600',
  disabled = false,
  children
}: PersonalizationCheckboxProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 transition-all duration-200 ${
        checked 
          ? 'border-blue-500 bg-blue-50 shadow-sm' 
          : 'border-gray-200 hover:border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !disabled && onCheckedChange(!checked)}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="mt-1"
        />
        
        <div className="flex-1 space-y-2">
          <Label 
            htmlFor={id} 
            className={`flex items-center gap-2 cursor-pointer ${
              disabled ? 'cursor-not-allowed' : ''
            }`}
          >
            <Icon className={`h-4 w-4 ${iconColor}`} />
            <span className="font-medium">{label}</span>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </Label>
          
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
          
          {/* Conteúdo adicional (campos de input) */}
          {checked && children && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 