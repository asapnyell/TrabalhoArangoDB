FROM node:20-alpine

WORKDIR /app

# Copia os ficheiros de dependências primeiro (aproveita a cache do Docker)
COPY package*.json ./

# Instala as dependências de produção
RUN npm install

# Copia o resto do código da API
COPY . .

# Expõe a porta que a API vai rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "server.js"]