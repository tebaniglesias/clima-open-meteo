# Imagen base: servidor web nginx sobre Alpine Linux (liviana)
FROM nginx:alpine

# Copiar los archivos del sitio a la carpeta que nginx sirve por defecto
COPY index.html style.css app.js /usr/share/nginx/html/

# nginx escucha en el puerto 80 dentro del contenedor
EXPOSE 80

# Iniciar nginx en primer plano para que el contenedor siga corriendo
CMD ["nginx", "-g", "daemon off;"]
