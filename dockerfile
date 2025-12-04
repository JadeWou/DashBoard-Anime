# On utilise une image légère de serveur web (Nginx)
FROM nginx:alpine

# On copie tous les fichiers du dossier actuel vers le dossier du serveur dans le conteneur
COPY . /usr/share/nginx/html