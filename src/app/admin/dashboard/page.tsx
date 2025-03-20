'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { getUserRole } from '@/lib/cookies';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type PlanningData = {
  id: string;
  nome: string;
  deal_count_close: number;
  deal_value_close: number;
  deal_count_followup: number;
  deal_value_followup: number;
  partners_count: number;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminDashboardPage() {
  const router = useRouter();
  const [totalCloseValue, setTotalCloseValue] = useState(0);
  const [totalFollowupValue, setTotalFollowupValue] = useState(0);
  const [totalPartnersCount, setTotalPartnersCount] = useState(0);

  // Verificar se usuário tem permissão para acessar o dashboard
  useEffect(() => {
    const role = getUserRole();

    if (!role || role !== 'adm') {
      router.push('/login');
    }
  }, [router]);

  // Buscar dados do dashboard com SWR para cache
  const { data, error, isLoading } = useSWR('/api/admin/plannings', fetcher, {
    refreshInterval: 300000, // Atualizar a cada 5 minutos
    revalidateOnFocus: false,
  });

  // Calcular totais para gráficos quando os dados forem carregados
  useEffect(() => {
    if (data?.data) {
      const plannings = data.data as PlanningData[];
      
      const closeValue = plannings.reduce((total, item) => total + item.deal_value_close, 0);
      const followupValue = plannings.reduce((total, item) => total + item.deal_value_followup, 0);
      const partnersCount = plannings.reduce((total, item) => total + item.partners_count, 0);
      
      setTotalCloseValue(closeValue);
      setTotalFollowupValue(followupValue);
      setTotalPartnersCount(partnersCount);
    }
  }, [data]);

  // Dados para gráfico de barras
  const barChartData = {
    labels: data?.data ? (data.data as PlanningData[]).map(item => item.nome) : [],
    datasets: [
      {
        label: 'Valor para Fechamento',
        data: data?.data ? (data.data as PlanningData[]).map(item => item.deal_value_close) : [],
        backgroundColor: 'rgba(255, 0, 0, 0.7)',
      },
      {
        label: 'Valor para Acompanhamento',
        data: data?.data ? (data.data as PlanningData[]).map(item => item.deal_value_followup) : [],
        backgroundColor: 'rgba(0, 0, 255, 0.7)',
      },
    ],
  };

  // Dados para gráfico de pizza
  const pieChartData = {
    labels: ['Valor para Fechamento', 'Valor para Acompanhamento'],
    datasets: [
      {
        data: [totalCloseValue, totalFollowupValue],
        backgroundColor: [
          'rgba(255, 0, 0, 0.7)',
          'rgba(0, 0, 255, 0.7)',
        ],
        borderColor: [
          'rgba(255, 0, 0, 1)',
          'rgba(0, 0, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Opções dos gráficos
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Valores por Vendedor',
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Distribuição de Valores',
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-xl">Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">Erro ao carregar dados do dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  const plannings = data?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1">
            Última atualização: {data?.updated_at ? new Date(data.updated_at).toLocaleString('pt-BR') : 'N/A'}
          </p>
        </div>

        {/* Totais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Fechamento</h3>
            <p className="text-3xl font-bold">R$ {totalCloseValue.toLocaleString('pt-BR')}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-blue-600 mb-2">Acompanhamento</h3>
            <p className="text-3xl font-bold">R$ {totalFollowupValue.toLocaleString('pt-BR')}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Total de Parceiros</h3>
            <p className="text-3xl font-bold">{totalPartnersCount}</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <Bar data={barChartData} options={barOptions} />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <Pie data={pieChartData} options={pieOptions} />
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Negócios Fechamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Fechamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Negócios Acompanhamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Acompanhamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parceiros
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plannings.map((planning: PlanningData) => (
                <tr key={planning.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{planning.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{planning.deal_count_close}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">R$ {planning.deal_value_close.toLocaleString('pt-BR')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{planning.deal_count_followup}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">R$ {planning.deal_value_followup.toLocaleString('pt-BR')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{planning.partners_count}</div>
                  </td>
                </tr>
              ))}
              
              {plannings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-500">Nenhum planejamento encontrado</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 