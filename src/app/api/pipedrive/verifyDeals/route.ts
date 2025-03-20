import { NextResponse } from 'next/server';
import { verifyDeals } from '@/lib/pipedrive';

export async function POST(request: Request) {
  try {
    const { dealIds } = await request.json();
    
    if (!dealIds || !Array.isArray(dealIds) || dealIds.length === 0) {
      return NextResponse.json(
        { error: 'IDs de negócios inválidos' },
        { status: 400 }
      );
    }

    const deals = await verifyDeals(dealIds);
    
    // Verificar se todos os IDs foram encontrados
    const foundIds = deals.map(deal => deal.id);
    const missingIds = dealIds.filter(id => !foundIds.includes(Number(id)));
    
    if (missingIds.length > 0) {
      return NextResponse.json({
        success: false,
        message: `Os seguintes IDs não foram encontrados: ${missingIds.join(', ')}`,
        missingIds
      });
    }

    return NextResponse.json({
      success: true,
      deals
    });
  } catch (error) {
    console.error('Erro ao verificar negócios:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar negócios no Pipedrive' },
      { status: 500 }
    );
  }
} 