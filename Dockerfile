FROM node:6

# To Create nodejsapp directory
WORKDIR /jsoxy

# To Install All dependencies

COPY package*.json ./

RUN npm install

# To copy all application packages 
COPY . .

# Expose port 3000 and Run the server.js file to start node js application
EXPOSE 8008
CMD [ "node", "jsoxy.js" ]
