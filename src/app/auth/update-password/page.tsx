import { Suspense } from 'react';
import UpdatePasswordForm from './components/update-password-form';

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <UpdatePasswordForm />
    </Suspense>
  );
}