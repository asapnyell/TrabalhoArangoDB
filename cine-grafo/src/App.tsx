import { useState, useEffect } from 'react';
import { apiCineGrafo } from './service/api';
import type { Filme, Recomendacao } from './types/cinema';
import { Film, Network, Sparkles, Check, BookmarkCheck, PlusCircle, Trash2 } from 'lucide-react';

// Lista fixa de gêneros para garantir a integridade dos dados no banco (evita erros de digitação)
const GENEROS_PREDEFINIDOS = [
  'Ação', 'Animação', 'Aventura', 'Comédia', 'Complexo', 'Documentário',
  'Drama', 'Espaço', 'Fantasia', 'Ficção Científica', 'Histórico',
  'Mistério', 'Psicológico', 'Romance', 'Suspense', 'Terror'
].sort();

export default function App() {
  const [filmes, setFilmes] = useState<Filme[]>([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState<string[]>([]); // Tags que realmente existem no banco
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]); // Tags para filtro
  const [recomendacoes, setRecomendacoes] = useState<Recomendacao[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Estados do Formulário de Cadastro (aceitam número ou string vazia para melhor UX)
  const [titulo, setTitulo] = useState('');
  const [ano, setAno] = useState<number | ''>(new Date().getFullYear());
  const [duracao, setDuracao] = useState<number | ''>(120);
  const [tagsNovoFilme, setTagsNovoFilme] = useState<string[]>([]); // Tags selecionadas para o novo filme

  // 1. Carregamento Inicial (Padrão Oficial do React para Fetch em useEffect)
  useEffect(() => {
    let montado = true;

    const inicializarDados = async () => {
      try {
        const listaFilmes = await apiCineGrafo.buscarTodosFilmes();
        const listaTags = await apiCineGrafo.buscarTagsDisponiveis();
        
        if (montado) {
          setFilmes(listaFilmes);
          setTagsDisponiveis(listaTags);
        }
      } catch (err) {
        console.error("Erro ao carregar dados do ArangoDB:", err);
      }
    };

    inicializarDados();

    return () => {
      montado = false;
    };
  }, []);

  // 2. Função manual para recarregar o banco após um CRUD (Inserir/Deletar)
  const recarregarCatalogo = async () => {
    try {
      const listaFilmes = await apiCineGrafo.buscarTodosFilmes();
      setFilmes(listaFilmes);
      const listaTags = await apiCineGrafo.buscarTagsDisponiveis();
      setTagsDisponiveis(listaTags);
    } catch (err) {
      console.error("Erro ao recarregar dados do ArangoDB:", err);
    }
  };

  // Monitora seleção de gostos
  useEffect(() => {
    let montado = true;

    const atualizarSugestoes = async () => {
      if (tagsSelecionadas.length === 0) {
        setRecomendacoes([]);
        return;
      }
      
      setCarregando(true);
      try {
        const resultado = await apiCineGrafo.buscarRecomendacoesPorGosto(tagsSelecionadas);
        if (montado) setRecomendacoes(resultado);
      } catch (err) {
        console.error("Erro ao calcular recomendações:", err);
      } finally {
        if (montado) setCarregando(false);
      }
    };

    atualizarSugestoes();

    return () => {
      montado = false;
    };
  }, [tagsSelecionadas]);

  const alternarTagFiltro = (tag: string) => {
    if (tagsSelecionadas.includes(tag)) {
      setTagsSelecionadas(tagsSelecionadas.filter(t => t !== tag));
    } else {
      setTagsSelecionadas([...tagsSelecionadas, tag]);
    }
  };

  const alternarTagNovoFilme = (tag: string) => {
    if (tagsNovoFilme.includes(tag)) {
      setTagsNovoFilme(tagsNovoFilme.filter(t => t !== tag));
    } else {
      setTagsNovoFilme([...tagsNovoFilme, tag]);
    }
  };

  // Handler para Inserção (Create)
  const handleInserirFilme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return alert("Preencha o título do filme!");
    if (ano === '') return alert("Preencha o ano do filme!");
    if (duracao === '') return alert("Preencha a duração do filme!");
    if (tagsNovoFilme.length === 0) return alert("Selecione pelo menos um gênero para o filme!");

    try {
      await apiCineGrafo.inserirFilme({ 
        titulo, 
        ano: Number(ano), 
        duracao: Number(duracao), 
        tags: tagsNovoFilme 
      });
      
      setTitulo('');
      setAno(new Date().getFullYear());
      setDuracao(120);
      setTagsNovoFilme([]); 
      recarregarCatalogo(); 
      alert("Sucesso: Novo vértice adicionado ao ArangoDB!");
    } catch (err) {
      console.error("Erro detalhado ao inserir:", err);
      alert("Erro ao cadastrar novo filme no ArangoDB.");
    }
  };

  // Handler para Remoção (Delete)
  const handleDeletarFilme = async (key: string) => {
    if (!confirm("Tem certeza que deseja deletar este vértice do ArangoDB?")) return;

    try {
      await apiCineGrafo.deletarFilme(key);
      recarregarCatalogo(); 
      setTagsSelecionadas([]); 
    } catch (err) {
      console.error("Erro detalhado ao deletar:", err);
      alert("Erro ao remover o filme do banco.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 selection:bg-cyan-500 selection:text-slate-900">
      
      {/* Cabeçalho Acadêmico */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
        <div>
          <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Trabalho Prático • UniAcademia</span>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2 mt-1">
            <Network className="text-cyan-400 animate-pulse" size={32} /> CineGrafo NoSQL
          </h1>
          <p className="text-sm text-slate-400 mt-1">Sistema de Recomendação Inteligente Baseado em Interesses de Grafos</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-right md:block hidden">
          <p className="text-xs text-slate-400 font-semibold">Prof. Dr. Tassio Sirqueira</p>
          <p className="text-xs text-slate-500">Bancos de Dados Não Relacionais</p>
        </div>
      </header>

      {/* Grid Principal da Aplicação */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Painel Esquerdo (4 Colunas) - Agora visível em todos os tamanhos */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Caixa de Seleção de Gosto */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <BookmarkCheck size={16} className="text-cyan-400" /> Selecione Seus Gostos
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Escolha categorias coletadas dinamicamente do ArangoDB.
            </p>
            
            {tagsDisponiveis.length === 0 ? (
              <div className="text-xs text-amber-500/80 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 font-medium">
                O banco está vazio. Cadastre filmes abaixo para gerar a rede de gêneros!
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tagsDisponiveis.map((tag) => {
                  const ativa = tagsSelecionadas.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => alternarTagFiltro(tag)}
                      className={`text-xs px-3 py-2 rounded-xl font-medium border flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                        ativa 
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {ativa && <Check size={12} strokeWidth={3} />}
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}

            {tagsSelecionadas.length > 0 && (
              <button 
                onClick={() => setTagsSelecionadas([])}
                className="mt-5 w-full text-center text-xs text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
              >
                Limpar filtros de interesse
              </button>
            )}
          </div>

          {/* Formulário de Inserção de Vértices */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <PlusCircle size={16} className="text-emerald-400" /> Inserir Novo Filme
            </h2>
            <form onSubmit={handleInserirFilme} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1.5">Título do Filme</label>
                <input 
                  type="text"
                  placeholder="Ex: Matrix Resurrections" 
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1.5">Ano</label>
                  <input 
                    type="number" 
                    value={ano}
                    onChange={e => setAno(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1.5">Duração (min)</label>
                  <input 
                    type="number" 
                    value={duracao}
                    onChange={e => setDuracao(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Selector de Gêneros Pré-definidos */}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-2">Gêneros do Filme (Tags)</label>
                <div className="flex flex-wrap gap-1.5">
                  {GENEROS_PREDEFINIDOS.map(genero => {
                    const isSelected = tagsNovoFilme.includes(genero);
                    return (
                      <button
                        type="button"
                        key={genero}
                        onClick={() => alternarTagNovoFilme(genero)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {genero}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                className="mt-2 w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(6,182,212,0.15)]"
              >
                Criar Vértice no ArangoDB
              </button>
            </form>
          </div>

          {/* Amostra do Catálogo Geral com Remoção CORRIGIDO (hidden lg:block REMOVIDO) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl block">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Film size={14} /> Amostra do Catálogo ({filmes.length})
            </h2>
            
            {filmes.length === 0 ? (
              <p className="text-xs text-slate-500 italic mt-2">Nenhum filme inserido. O grafo está vazio.</p>
            ) : (
              <div className="text-[11px] text-slate-500 font-mono space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                {filmes.map(f => (
                  <div key={f._key} className="flex items-center justify-between group border-b border-slate-800/50 pb-1.5 last:border-0">
                    <div className="truncate text-slate-300 pr-2">
                      ✓ {f.titulo} <span className="text-slate-600">({f.ano})</span>
                    </div>
                    <button 
                      onClick={() => handleDeletarFilme(f._key)}
                      className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                      title="Remover este filme do ArangoDB"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Painel Direito (8 Colunas) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-400 animate-pulse" size={20} />
                <h3 className="font-bold text-white text-lg">Filmes Sugeridos para Você</h3>
              </div>
              <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800 font-mono">
                AQL: INTERSECTION & SORT
              </span>
            </div>

            {carregando ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-mono tracking-wide">ArangoDB calculando conexões de rede...</p>
              </div>
            ) : recomendacoes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {recomendacoes.map((rec, index) => (
                  <div 
                    key={index} 
                    className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-bold text-white text-base leading-tight">{rec.filme}</h4>
                        <span className="text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-900/40 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                          <Network size={12} /> {rec.votos_similares} pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Este nó obteve alta pontuação com base nos seus interesses cruzados via AQL.
                      </p>
                    </div>
                    
                    <div className="mt-5 pt-3 border-t border-slate-900 flex flex-wrap gap-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mr-1 self-center">Matches:</span>
                      {rec.tagsCompartilhadas.map(tag => (
                        <span key={tag} className="text-[9px] font-bold px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-md border border-cyan-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Network size={44} className="text-slate-700 mb-3 animate-bounce" />
                <p className="text-base text-slate-300 font-medium">
                  {filmes.length === 0 ? "Adicione filmes para começar" : "O seu motor de sugestões está aguardando"}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  {filmes.length === 0 
                    ? "Como o banco ArangoDB está vazio, preencha o formulário ao lado para criar o primeiro vértice no grafo!"
                    : "Selecione os seus gostos na barra lateral para ver o grafo NoSQL cruzar as conexões em tempo real."}
                </p>
              </div>
            )}
          </div>

        </section>
      </main>
    </div>
  );
}