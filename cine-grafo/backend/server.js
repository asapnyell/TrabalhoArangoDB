import express from 'express';
import cors from 'cors';
import { Database, aql } from 'arangojs';

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database({
  url: "http://arangodb_server:8529",
  databaseName: "_system",
  auth: { username: "root", password: "root" },
});

// Função que garante a infraestrutura de Grafos e sincroniza sem conflitos
async function inicializarBanco() {
  const collectionName = 'Movies';
  console.log('🔄 Verificando conexão e inicializando infraestrutura de Grafo...');
  
  while (true) {
    try {
      const moviesColl = db.collection(collectionName);
      if (!(await moviesColl.exists())) await moviesColl.create();

      const genresColl = db.collection('Genres');
      if (!(await genresColl.exists())) await genresColl.create();

      const yearsColl = db.collection('Years');
      if (!(await yearsColl.exists())) await yearsColl.create();

      const hasGenreColl = db.collection('HasGenre');
      if (!(await hasGenreColl.exists())) await db.createEdgeCollection('HasGenre');

      const releasedInColl = db.collection('ReleasedIn');
      if (!(await releasedInColl.exists())) await db.createEdgeCollection('ReleasedIn');

      try {
        const graph = db.graph('CineGrafo');
        if (!(await graph.exists())) {
          await graph.create([
            { collection: 'HasGenre', from: ['Movies'], to: ['Genres'] },
            { collection: 'ReleasedIn', from: ['Movies'], to: ['Years'] }
          ]);
          console.log("📊 Grafo Nomeado 'CineGrafo' registado com sucesso!");
        }
      } catch (graphErr) {
        console.error("❌ Erro ao registar o grafo visual:", graphErr.message);
      }

      console.log("🌱 Sincronizando nós antigos do banco com o formato de Grafo padronizado...");
      
      // 1. Sincronizar Géneros (Usando COLLECT para garantir que atualiza cada género uma única vez)
      await db.query(aql`
        FOR f IN Movies
          FILTER IS_ARRAY(f.tags)
          FOR tag IN f.tags
            COLLECT tagUnica = tag
            LET gKey = MD5(LOWER(TRIM(tagUnica)))
            UPSERT { _key: gKey }
            INSERT { _key: gKey, titulo: tagUnica } 
            UPDATE { titulo: tagUnica }
            IN Genres
      `);

      // 2. Sincronizar Arestas de Géneros
      await db.query(aql`
        FOR f IN Movies
          FILTER IS_ARRAY(f.tags)
          FOR tag IN f.tags
            LET gKey = MD5(LOWER(TRIM(tag)))
            LET edgeKey = MD5(CONCAT(f._key, "_links_", gKey))
            UPSERT { _key: edgeKey }
            INSERT { _key: edgeKey, _from: f._id, _to: CONCAT("Genres/", gKey) }
            UPDATE {}
            IN HasGenre
      `);

      // 3. Sincronizar Anos de Lançamento (Usando COLLECT para cada ano ser atualizado uma única vez)
      await db.query(aql`
        FOR f IN Movies
          FILTER f.ano != null
          COLLECT anoUnico = f.ano
          LET yKey = TO_STRING(anoUnico)
          UPSERT { _key: yKey }
          INSERT { _key: yKey, ano: anoUnico, titulo: TO_STRING(anoUnico) }
          UPDATE { titulo: TO_STRING(anoUnico) }
          IN Years
      `);

      // 4. Sincronizar Arestas de Anos
      await db.query(aql`
        FOR f IN Movies
          FILTER f.ano != null
          LET yKey = TO_STRING(f.ano)
          LET edgeYearKey = MD5(CONCAT(f._key, "_releasedin_", yKey))
          UPSERT { _key: edgeYearKey }
          INSERT { _key: edgeYearKey, _from: f._id, _to: CONCAT("Years/", yKey) }
          UPDATE {}
          IN ReleasedIn
      `);

      console.log("✅ O Grafo foi sincronizado (Géneros e Anos) com sucesso!");
      console.log(`✅ Estruturas e conexões prontas para uso!`);
      break; 
      
    } catch (error) {
      console.log('⏳ Ocorreu um problema na inicialização:', error.message);
      console.log('⏳ Tentando novamente em 3 segundos...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}

// READ: Buscar Catálogo Inicial
app.get('/api/filmes', async (req, res) => {
  try {
    const cursor = await db.query(aql`FOR f IN Movies SORT f.titulo ASC RETURN f`);
    const filmes = await cursor.all();
    res.json(filmes);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// AGGREGATE: Buscar todas as tags únicas
app.get('/api/tags', async (req, res) => {
  try {
    const cursor = await db.query(aql`
      FOR f IN Movies 
        FOR tag IN f.tags 
        RETURN DISTINCT tag
    `);
    const tags = await cursor.all();
    res.json(tags.sort());
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// CREATE: Inserir Vértice do Filme E criar as Arestas do Grafo (Géneros e Ano)
app.post('/api/filmes', async (req, res) => {
  try {
    const { titulo, ano, tags, duracao } = req.body;
    const movieKey = titulo.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    const moviesColl = db.collection('Movies');

    const novoDocumento = { 
      _key: movieKey, 
      titulo, 
      ano, 
      tags, 
      duracao, 
      sinopse: "Adicionado via painel de controlo." 
    };
    await moviesColl.save(novoDocumento);

    // 1. Criar Ligações de Género
    for (const tag of tags) {
      await db.query(aql`
        LET gKey = MD5(LOWER(TRIM(${tag})))
        UPSERT { _key: gKey }
        INSERT { _key: gKey, titulo: ${tag} }
        UPDATE { titulo: ${tag} }
        IN Genres
      `);

      await db.query(aql`
        LET gKey = MD5(LOWER(TRIM(${tag})))
        LET edgeKey = MD5(CONCAT(${movieKey}, "_links_", gKey))
        UPSERT { _key: edgeKey }
        INSERT { _key: edgeKey, _from: ${`Movies/${movieKey}`}, _to: CONCAT("Genres/", gKey) }
        UPDATE {}
        IN HasGenre
      `);
    }

    // 2. Criar Ligações de Ano
    const yKey = String(ano);
    await db.query(aql`
      UPSERT { _key: ${yKey} }
      INSERT { _key: ${yKey}, ano: ${ano}, titulo: TO_STRING(${ano}) }
      UPDATE { titulo: TO_STRING(${ano}) }
      IN Years
    `);

    await db.query(aql`
      LET edgeYearKey = MD5(CONCAT(${movieKey}, "_releasedin_", ${yKey}))
      UPSERT { _key: edgeYearKey }
      INSERT { _key: edgeYearKey, _from: ${`Movies/${movieKey}`}, _to: CONCAT("Years/", ${yKey}) }
      UPDATE {}
      IN ReleasedIn
    `);

    res.status(201).json(novoDocumento);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// DELETE: Remover Filme e limpar as arestas (Géneros e Anos)
app.delete('/api/filmes/:key', async (req, res) => {
  try {
    const movieKey = req.params.key;
    const moviesColl = db.collection('Movies');
    
    await moviesColl.remove(movieKey);

    await db.query(aql`
      FOR edge IN HasGenre
        FILTER edge._from == ${`Movies/${movieKey}`}
        REMOVE edge IN HasGenre
    `);

    await db.query(aql`
      FOR edge IN ReleasedIn
        FILTER edge._from == ${`Movies/${movieKey}`}
        REMOVE edge IN ReleasedIn
    `);

    res.json({ mensagem: `Vértice e arestas do filme apagados.` });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// RECOMENDAÇÃO: Motor AQL 
app.post('/api/recomendacoes', async (req, res) => {
  try {
    const { tags } = req.body;
    if (!tags || tags.length === 0) return res.json([]);

    const query = aql`
      FOR t IN ${tags}
        LET gKey = MD5(LOWER(TRIM(t)))
        FOR m IN 1..1 INBOUND CONCAT("Genres/", gKey) HasGenre
          COLLECT filmeId = m._id, titulo = m.titulo INTO grupo
          LET tagsCompartilhadas = (FOR item IN grupo RETURN item.t)
          LET pesoConexoes = (LENGTH(tagsCompartilhadas) * 5) + FLOOR(RAND() * 4)
          SORT pesoConexoes DESC
          RETURN {
            filme: titulo,
            votos_similares: pesoConexoes,
            tagsCompartilhadas: tagsCompartilhadas
          }
    `;

    const cursor = await db.query(query);
    const recomendacoes = await cursor.all();
    res.json(recomendacoes);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`🚀 API do CineGrafo a rodar na porta ${PORT}`);
  await inicializarBanco();
});