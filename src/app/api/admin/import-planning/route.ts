import supabase from '@/lib/supabase';
import { NextResponse } from 'next/server';

// Definir interface para usuário
interface User {
  id: string;
  pipe_name: string | null;
  [key: string]: any;
}

export async function POST(req: Request) {
  try {
    const { planning } = await req.json();

    if (!planning || !Array.isArray(planning)) {
      return NextResponse.json(
        { success: false, message: 'Dados da planilha inválidos' },
        { status: 400 }
      );
    }

    // Obter todos usuários (consultores) do banco para fazer o mapeamento
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, pipe_name');

    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
      return NextResponse.json(
        { success: false, message: 'Erro ao consultar usuários' },
        { status: 500 }
      );
    }

    // Criar mapa de nomes para IDs
    const userMap = new Map();
    (usersData as User[])?.forEach(user => {
      if (user.pipe_name) {
        userMap.set(user.pipe_name.toLowerCase().trim(), user.id);
      }
    });

    // Processar e salvar cada linha da planilha
    let importedCount = 0;
    const today = new Date().toISOString();

    const planningsToInsert = planning
      .filter((item: any) => {
        // Verificar se o consultor existe no banco
        const userId = userMap.get(item.consultor.toLowerCase().trim());
        return userId && (item.ftas.length > 0 || item.acompanhamento.length > 0);
      })
      .map((item: any) => {
        const userId = userMap.get(item.consultor.toLowerCase().trim());
        
        // Converter strings para números
        const dealIdsClose = item.ftas
          .map((id: string) => parseInt(id.trim()))
          .filter((id: number) => !isNaN(id));
          
        const dealIdsFollowup = item.acompanhamento
          .map((id: string) => parseInt(id.trim()))
          .filter((id: number) => !isNaN(id));

        return {
          user_id: userId,
          deal_ids_close: dealIdsClose,
          deal_ids_followup: dealIdsFollowup,
          partners_count: 0, // Valor padrão se não tiver na planilha
          created_at: today
        };
      });

    if (planningsToInsert.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Nenhum registro válido encontrado na planilha' },
        { status: 400 }
      );
    }

    // Inserir no banco de dados
    const { data, error } = await supabase
      .from('plannings')
      .insert(planningsToInsert)
      .select();

    if (error) {
      console.error('Erro ao salvar planejamentos:', error);
      return NextResponse.json(
        { success: false, message: 'Erro ao salvar dados no banco' },
        { status: 500 }
      );
    }

    importedCount = data?.length || 0;

    return NextResponse.json({
      success: true,
      imported: importedCount,
      message: `${importedCount} planejamentos importados com sucesso`
    });
  } catch (error) {
    console.error('Erro na importação:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno ao processar a requisição' },
      { status: 500 }
    );
  }
} 