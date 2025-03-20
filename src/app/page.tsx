'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole } from '@/lib/cookies';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = getUserRole();
    
    if (!role) {
      router.push('/login');
      return;
    }
    
    // Redirecionar com base no papel do usuário
    if (role === 'vendedor') {
      router.push('/seller/planning');
    } else if (role === 'adm') {
      router.push('/admin/dashboard');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">POLOAR</h1>
        <p className="mb-4">Redirecionando...</p>
      </div>
    </div>
  );
}
