FROM node:18-slim

WORKDIR /app
COPY package*.json ./
RUN yarn --frozen-lockfile
COPY . .
RUN yarn build

ENV PORT=2628
EXPOSE 2628

CMD ["npm", "start"]
