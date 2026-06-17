# CineGrafo NoSQL 🎬🕸️

Trabalho prático desenvolvido para a disciplina de **Bancos de Dados Não Relacionais** do curso de **Sistemas de Informação da UniAcademia**.

**Professor Orientador:** Prof. Dr. Tassio Sirqueira

**Objetivo:** Explorar conceitos, características e aplicações práticas de bancos de dados NoSQL utilizando o ecossistema **ArangoDB**, com foco em sistemas de recomendação baseados em grafos.

---

# 📖 Sobre o Projeto

O **CineGrafo NoSQL** é uma aplicação web que utiliza o poder dos grafos para recomendar filmes com base em características compartilhadas entre gêneros e interesses.

Diferentemente de sistemas tradicionais que dependem apenas de consultas relacionais, o projeto utiliza o modelo de grafos do ArangoDB para representar conexões entre filmes e categorias, permitindo consultas mais eficientes e escaláveis.

---

# 🧠 1. Fundamentação Teórica (Conceitos NoSQL)

## Tipo de Banco NoSQL

O projeto utiliza o **ArangoDB**, um banco de dados **Multimodelo Nativo**, que combina:

* Documentos JSON
* Grafos
* Chave-Valor

No CineGrafo, os documentos armazenam informações dos filmes e os grafos representam os relacionamentos entre filmes e gêneros.

---

## Classificação no Teorema CAP

O ArangoDB é geralmente classificado como **CP (Consistency + Partition Tolerance)**.

Características:

* Consistência dos dados distribuídos
* Tolerância a falhas de rede
* Controle de escrita através do protocolo Raft
* Integridade dos dados priorizada em ambientes distribuídos

---

## Casos de Uso

O modelo utilizado neste projeto é amplamente aplicado em:

* Sistemas de recomendação
* Redes sociais
* Knowledge Graphs
* Sistemas antifraude
* Motores de busca semântica
* Plataformas de streaming

---

## Ferramentas Utilizadas

* ArangoDB
* ArangoDB Web UI
* AQL (ArangoDB Query Language)
* Docker
* Docker Compose

---

# 🗺️ 2. Arquitetura e Modelagem do Grafo

O sistema utiliza uma arquitetura híbrida composta por documentos e grafos.

Para evitar problemas com caracteres especiais, espaços e acentuação, os identificadores dos gêneros são gerados utilizando **hash MD5**.

---

## Coleções de Vértices (Vertex Collections)

### Movies

Armazena os filmes cadastrados.

Exemplo:

```json
{
  "_key": "001",
  "titulo": "Interestelar",
  "ano": 2014,
  "duracao": 169,
  "tags": [
    "Ficção Científica",
    "Drama"
  ]
}
```

### Genres

Representa os gêneros cinematográficos.

```json
{
  "_key": "c4ca4238a0b923820dcc509a6f75849b",
  "nome": "Ficção Científica"
}
```

---

## Coleção de Arestas (Edge Collection)

### HasGenre

Responsável por conectar filmes aos seus gêneros.

```json
{
  "_from": "Movies/001",
  "_to": "Genres/c4ca4238a0b923820dcc509a6f75849b"
}
```

---

## Grafo Nomeado

### CineGrafo

Grafo registrado no ArangoDB contendo:

* Movies
* Genres
* HasGenre

Essa estrutura permite travessias nativas de alta performance.

---

# 🛠️ 3. Mapeamento de Métodos (MongoDB vs ArangoDB)

| MongoDB  | ArangoDB (AQL)     | Função          |
| -------- | ------------------ | --------------- |
| find()   | FOR doc IN         | Consulta básica |
| $match   | FILTER             | Filtragem       |
| $project | RETURN {}          | Projeção        |
| $lookup  | INBOUND / OUTBOUND | Relacionamentos |
| $group   | COLLECT            | Agrupamento     |
| Arrays   | FOR item IN array  | Iteração        |

---

# ⚡ 4. Query de Recomendação

A consulta abaixo percorre o grafo e encontra filmes relacionados aos gêneros selecionados pelo usuário.

```aql
FOR t IN @tags
  LET gKey = MD5(LOWER(TRIM(t)))
  
  FOR m IN 1..1 INBOUND CONCAT("Genres/", gKey) HasGenre
    
    COLLECT filmeId = m._id,
            titulo = m.titulo
    INTO grupo
    
    LET pesoConexoes = (LENGTH(grupo) * 5) + FLOOR(RAND() * 4)
    
    SORT pesoConexoes DESC
    LIMIT 10
    
    RETURN {
      id: filmeId,
      filme: titulo,
      votos_similares: pesoConexoes
    }
```

---

# 💻 5. Tecnologias Utilizadas

## Front-end

* React
* TypeScript
* Vite
* Tailwind CSS

## Back-end

* Node.js
* Express
* ArangoJS

## Banco de Dados

* ArangoDB 3.11

## Infraestrutura

* Docker
* Docker Compose

---

# 🚀 6. Como Executar o Projeto

## Pré-requisitos

Instale previamente:

* Git
* Node.js 20+
* npm
* Docker Desktop (opcional)

---

## Clonar o Repositório

```bash
git clone https://github.com/asapnyell/TrabalhoArangoDB.git
cd trabalhoarangodb
cd cine-grafo
```

---

# 🐳 Executando com Docker

### Derrubar containers antigos

```bash
docker compose down
```

### Construir e subir o ambiente

```bash
docker compose up -d --build
```

---

## URLs de Acesso

### Aplicação React

```text
http://localhost:5173
```

### Painel ArangoDB

```text
http://localhost:8529
```

---

## Credenciais do ArangoDB

```text
Usuário: root
Senha: root
Banco: _system
```

---

# 💻 Executando Localmente

## Instalar dependências do Front-end

Na raiz do projeto:

```bash
npm install
```

---

## Iniciar Front-end

```bash
npm run dev
```

A aplicação será iniciada em:

```text
http://localhost:5173
```

---

## Instalar dependências do Back-end

Abra outro terminal:

```bash
cd backend
npm install
```

---

## Iniciar Back-end

```bash
npm run dev
```

ou

```bash
npm start
```

---

# 📂 Estrutura do Projeto

```text
cine-grafo/
│
├── src/
├── public/
├── package.json
├── vite.config.ts
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

# 📜 Scripts Disponíveis

## Front-end

```bash
npm run dev
npm run build
npm run preview
```

## Back-end

```bash
npm run dev
npm start
```

---

# 🎨 Visualização do Grafo no ArangoDB

Para exibir os nomes reais dos filmes e gêneros:

1. Acesse o ArangoDB Web UI.
2. Vá em **Graphs → CineGrafo**.
3. Clique na engrenagem ⚙️.
4. Configure os rótulos:

### Genres

```text
nome
```

### Movies

```text
titulo
```

5. Clique em **Apply**.

---

# 🎯 Resultados Obtidos

O projeto demonstra:

* Uso prático de bancos NoSQL multimodelo;
* Modelagem baseada em grafos;
* Consultas avançadas utilizando AQL;
* Recomendação de filmes por relacionamentos;
* Integração entre React, Node.js e ArangoDB;
* Conteinerização completa com Docker.

---

# 📚 Referências

* Documentação Oficial do ArangoDB
* Documentação AQL
* Documentação React
* Documentação Vite
* Material da disciplina de Bancos de Dados Não Relacionais
* Teorema CAP (Brewer)

---

# 👨‍💻 Autores

**Danyel Henrique**,
**Lucas Cassiano**,
**Gabriel Damasceno**.

Sistemas de Informação – UniAcademia

Projeto desenvolvido para fins acadêmicos na disciplina de Bancos de Dados Não Relacionais.
