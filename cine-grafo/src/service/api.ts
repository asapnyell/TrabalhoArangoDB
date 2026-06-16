import type { Filme, Recomendacao } from '../types/cinema';

const API_URL = 'http://localhost:3000/api';

export const apiCineGrafo = {
  buscarTodosFilmes: async (): Promise<Filme[]> => {
    const res = await fetch(`${API_URL}/filmes`);
    return res.json();
  },

  buscarTagsDisponiveis: async (): Promise<string[]> => {
    const res = await fetch(`${API_URL}/tags`);
    return res.json();
  },

  buscarRecomendacoesPorGosto: async (tagsEscolhidas: string[]): Promise<Recomendacao[]> => {
    const res = await fetch(`${API_URL}/recomendacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: tagsEscolhidas }),
    });
    return res.json();
  },

  inserirFilme: async (filme: Omit<Filme, '_id' | '_key' | 'sinopse'>): Promise<Filme> => {
    const res = await fetch(`${API_URL}/filmes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filme),
    });
    return res.json();
  },

  deletarFilme: async (key: string): Promise<{ mensagem: string }> => {
    const res = await fetch(`${API_URL}/filmes/${key}`, {
      method: 'DELETE',
    });
    return res.json();
  }
};