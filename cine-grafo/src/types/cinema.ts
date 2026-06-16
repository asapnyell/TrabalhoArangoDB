// Vértice do Filme
export interface Filme {
  _id: string;      // Ex: 'Movies/inception'
  _key: string;     // Ex: 'inception'
  titulo: string;
  ano: number;
  tags: string[];
  duracao: number;
  sinopse: string;
}

// Vértice do Usuário
export interface Usuario {
  _id: string;
  _key: string;
  nome: string;
  email: string;
}

// Retorno da Query de Sugestão (Filtragem Colaborativa)
export interface Recomendacao {
  filme: string;
  votos_similares: number;
  tagsCompartilhadas: string[];
}