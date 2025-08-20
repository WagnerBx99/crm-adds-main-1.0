import React from 'react';
import AuthWorkflow from '@/components/auth/AuthWorkflow';

export default function PublicFormPage() {
  return <AuthWorkflow initialStep="welcome" />;
} 