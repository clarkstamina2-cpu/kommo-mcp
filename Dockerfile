FROM node:20-alpine

WORKDIR /app

# Copiar os arquivos de dependência
COPY package.json package-lock.json* ./

# Instalar dependências (incluindo devDependencies para o build)
RUN npm install

# Copiar todo o código fonte
COPY tsconfig.json ./
COPY src/ ./src/

# Compilar de TypeScript para JavaScript na pasta dist/
RUN npm run build

# Remover devDependencies para deixar a imagem mais leve (opcional)
RUN npm prune --production

# Expor a porta 3000 do Express
EXPOSE 3000

# Iniciar o servidor
CMD ["npm", "start"]
