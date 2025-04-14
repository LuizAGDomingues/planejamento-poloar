import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import supabase from '@/lib/supabase';
import { verifyDeals, calculateTotalValue } from '@/lib/pipedrive';
import { Deal } from '@/lib/pipedrive';

type PlanningData = {
  id: string;
  nome: string;
  deal_count_close: number;
  deal_value_close: number;
  deal_count_followup: number;
  deal_value_followup: number;
  partners_count: number;
  deal_ids_close: number[];
  deal_ids_followup: number[];
  user_id: string;
  created_at: string;
};

export async function GET(request: NextRequest) {
  try {
    // Obter parâmetros de filtro de data da URL
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    // Consulta base para buscar planejamentos
    let query = supabase
      .from('plannings')
      .select(`
        id,
        user_id,
        deal_ids_close,
        deal_ids_followup,
        partners_count,
        created_at,
        users (
          id,
          nome
        )
      `);
    
    // Aplicar filtro de data se fornecido
    if (startDate && endDate) {
      // Formato ISO: YYYY-MM-DD
      query = query.gte('created_at', `${startDate}T00:00:00.000Z`)
                  .lte('created_at', `${endDate}T23:59:59.999Z`);
    }
    
    const { data: plannings, error } = await query;

    if (error) {
      console.error('Erro ao buscar planejamentos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar dados' },
        { status: 500 }
      );
    }

    if (!plannings || !plannings.length) {
      return NextResponse.json({ data: [], deals: {}, updated_at: new Date().toISOString() });
    }

    // Extrair todos os IDs de deals para buscar em lote
    const allDealIds: number[] = [];
    
    plannings.forEach((planning: any) => {
      if (planning.deal_ids_close && planning.deal_ids_close.length) {
        allDealIds.push(...planning.deal_ids_close);
      }
      if (planning.deal_ids_followup && planning.deal_ids_followup.length) {
        allDealIds.push(...planning.deal_ids_followup);
      }
    });

    // Buscar dados atualizados dos deals no Pipedrive
    let dealsMap: Record<number, Deal> = {};
    
    if (allDealIds.length > 0) {
      try {
        const deals = await verifyDeals(allDealIds);
        
        // Criar um mapa de ID para deal para acesso mais rápido
        dealsMap = deals.reduce((map, deal) => {
          map[deal.id] = deal;
          return map;
        }, {} as Record<number, Deal>);
      } catch (error) {
        console.error('Erro ao buscar deals do Pipedrive:', error);
        // Continuar com dados vazios se falhar
      }
    }

    // Processar e formatar os dados para o dashboard
    const dashboardData: PlanningData[] = plannings.map((planning: any) => {
      // Filtrar deals válidos
      const closeDeals = (planning.deal_ids_close || [])
        .map((id: number) => dealsMap[id])
        .filter(Boolean);
        
      const followupDeals = (planning.deal_ids_followup || [])
        .map((id: number) => dealsMap[id])
        .filter(Boolean);

      return {
        id: planning.id,
        nome: planning.users?.nome || 'Desconhecido',
        deal_count_close: closeDeals.length,
        deal_value_close: calculateTotalValue(closeDeals),
        deal_count_followup: followupDeals.length,
        deal_value_followup: calculateTotalValue(followupDeals),
        partners_count: planning.partners_count || 0,
        deal_ids_close: planning.deal_ids_close || [],
        deal_ids_followup: planning.deal_ids_followup || [],
        user_id: planning.user_id,
        created_at: planning.created_at || ''
      };
    });

    return NextResponse.json({ 
      data: dashboardData,
      deals: dealsMap,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 