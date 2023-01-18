FROM node

# Create app directory
WORKDIR /usr/app

# Install app dependencies
COPY package.json ./
RUN npm install

# Install tsc
RUN npm install -g typescript

# Bundle app source
COPY . .

# Default command to start app
CMD [ "npm", "run", "start" ]
