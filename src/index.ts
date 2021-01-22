import 'reflect-metadata'
import 'dotenv/config'
import express from 'express'
import Redis from 'ioredis'
import session from 'express-session'
import connectRedis from 'connect-redis'
import cors from 'cors'
import { createConnection } from 'typeorm'
import { Post } from './database/entities/Post'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { PostResolver } from './resolvers/post/Post'
import { HelloResolver } from './resolvers/Hello'
import { User } from './database/entities/Users'
import { UserResolver } from './resolvers/user/user'
import { COOKIE_NAME, _prod_ } from './constants'
import path from 'path'

createConnection({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  synchronize: true,
  logging: true,
  entities: [
    Post, User
  ],
  migrations: [path.join(__dirname, './database/migrations/*')]
}).then(async () => {
  const app = express()
  const RedisStore = connectRedis(session)
  const redis = new Redis()

  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
  }))
  app.use(session({
    name: COOKIE_NAME,
    store: new RedisStore({ client: redis, disableTouch: true }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
      httpOnly: true,
      sameSite: 'lax',
      secure: _prod_
    },
    saveUninitialized: false,
    secret: process.env.REDIS_SESSION_SECRET as string,
    resave: false
  }))
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver,PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }) => ({ req, res, redis })
  })

  apolloServer.applyMiddleware({
    app,
    cors: false
  })
  app.listen(4000, () => {
    console.log('server started on 4000')
  })
}).catch(error => console.log(error))
