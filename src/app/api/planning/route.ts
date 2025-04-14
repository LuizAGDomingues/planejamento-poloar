import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { verifyDeals } from '@/lib/pipedrive';

export async function POST(request: Request) {
  try {
    const { 
      user_id, 
      deal_ids_close, 
      deal_ids_followup, 
      partners_count 
    } = await request.json();
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Converter strings de IDs em arrays de números
    const closeIds = deal_ids_close 
      ? deal_ids_close.split(',').map((id: string) => Number(id.trim())).filter(Boolean)
      : [];
      
    const followupIds = deal_ids_followup 
      ? deal_ids_followup.split(',').map((id: string) => Number(id.trim())).filter(Boolean)
      : [];

    // Validar IDs dos negócios no Pipedrive
    const allIds = [...closeIds, ...followupIds];
    
    if (allIds.length > 0) {
      try {
        const deals = await verifyDeals(allIds);
        
        // Verificar se todos os IDs foram encontrados
        const foundIds = deals.map(deal => deal.id);
        const missingIds = allIds.filter(id => !foundIds.includes(id));
        
        if (missingIds.length > 0) {
          return NextResponse.json({
            success: false,
            message: `Os seguintes IDs não foram encontrados: ${missingIds.join(', ')}`,
          }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: 'Erro ao verificar negócios no Pipedrive',
        }, { status: 500 });
      }
    }

    // Salvar planejamento no Supabase
    const { data, error } = await supabase
      .from('plannings')
      .insert({
        user_id,
        data: new Date().toISOString(),
        deal_ids_close: closeIds,
        deal_ids_followup: followupIds,
        partners_count: parseInt(partners_count) || 0
      });

    if (error) {
      console.error('Erro ao salvar planejamento:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar planejamento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Planejamento salvo com sucesso'
    });
  } catch (error) {
    console.error('Erro no planejamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 