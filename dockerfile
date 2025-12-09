FROM node:18-alpine

WORKDIR /app

# Installation des dépendances
COPY package.json ./
RUN npm install

# Copie du code source
COPY . .

# Port exposé
EXPOSE 3000

# Démarrage
CMD ["node", "server.js"]