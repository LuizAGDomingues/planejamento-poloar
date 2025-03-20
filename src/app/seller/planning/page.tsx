'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { getUserId, getUserName, getUserRole } from '@/lib/cookies';

export default function SellerPlanningPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | undefined>();
  const [userName, setUserName] = useState<string | undefined>();
  const [dealIdsClose, setDealIdsClose] = useState('');
  const [dealIdsFollowup, setDealIdsFollowup] = useState('');
  const [partnersCount, setPartnersCount] = useState('0');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar se usuário está autenticado e tem permissão correta
    const id = getUserId();
    const name = getUserName();
    const role = getUserRole();

    if (!id || role !== 'vendedor') {
      router.push('/login');
      return;
    }

    setUserId(id);
    setUserName(name);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validações básicas
      if (!dealIdsClose && !dealIdsFollowup) {
        setError('Informe pelo menos um ID de negócio para fechamento ou acompanhamento');
        setLoading(false);
        return;
      }

      // Enviar planejamento para a API
      const response = await fetch('/api/planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          deal_ids_close: dealIdsClose,
          deal_ids_followup: dealIdsFollowup,
          partners_count: partnersCount,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao salvar planejamento');
      }

      setSuccess('Planejamento salvo com sucesso!');
      // Limpar formulário
      setDealIdsClose('');
      setDealIdsFollowup('');
      setPartnersCount('0');
    } catch (error: any) {
      setError(error.message || 'Erro ao salvar planejamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Planejamento de Vendas</h1>
          {userName && (
            <p className="text-gray-600 mt-1">Olá, {userName}!</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="IDs dos Negócios para Fechamento"
            name="dealIdsClose"
            value={dealIdsClose}
            onChange={(e) => setDealIdsClose(e.target.value)}
            placeholder="Ex: 123, 456, 789"
          />

          <Input
            label="IDs dos Negócios para Acompanhamento"
            name="dealIdsFollowup"
            value={dealIdsFollowup}
            onChange={(e) => setDealIdsFollowup(e.target.value)}
            placeholder="Ex: 123, 456, 789"
          />

          <Input
            label="Quantidade de Parceiros para Acionamento"
            type="number"
            name="partnersCount"
            value={partnersCount}
            onChange={(e) => setPartnersCount(e.target.value)}
            min="0"
          />

          <div className="mt-8 flex space-x-4">
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Planejamento'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDealIdsClose('');
                setDealIdsFollowup('');
                setPartnersCount('0');
              }}
              disabled={loading}
            >
              Limpar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 