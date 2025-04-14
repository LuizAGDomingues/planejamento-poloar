import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { nome, senha } = await request.json();

    if (!nome || !senha) {
      return NextResponse.json(
        { error: 'Nome e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Consultar usuário no Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('nome', nome)
      .eq('senha', senha) // Em produção, use hash e compare
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Retorna dados do usuário para configurar cookies no cliente
    return NextResponse.json({
      id: data.id,
      nome: data.nome,
      role: data.role
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 