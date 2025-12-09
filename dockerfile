FROM node:18-alpine

WORKDIR /app

# Copie des fichiers de dépendances
COPY package.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du projet
COPY . .

# Exposition du port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "server.js"]