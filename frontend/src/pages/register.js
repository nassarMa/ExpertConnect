// pages/register.js
import dynamic from 'next/dynamic';

// Disable SSR for this component to fix AuthContext issues during build
const RegisterForm = dynamic(() => import('@/components/RegisterForm'), {
  ssr: false,
});

export default RegisterForm;
