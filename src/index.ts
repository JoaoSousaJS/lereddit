import 'reflect-metadata'
import 'dotenv/config'
import express from 'express'
import redis from 'redis'
import session from 'express-session'
import connectRedis from 'connect-redis'
import { createConnection } from 'typeorm'
import { Post } from './database/entities/Post'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { PostResolver } from './resolvers/post/Post'
import { HelloResolver } from './resolvers/Hello'
import { User } from './database/entities/User'
import { UserResolver } from './resolvers/user/user'
import { _prod_ } from './constants'
import { Context } from './types'

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
  ]
}).then(async connection => {
  const app = express()
  const RedisStore = connectRedis(session)
  const redisClient = redis.createClient()

  app.use(session({
    name: 'qid',
    store: new RedisStore({ client: redisClient, disableTouch: true }),
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
    context: ({ req, res }): Context => ({ req, res })
  })

  console.log(connection)

  apolloServer.applyMiddleware({ app })
  app.listen(4000, () => {
    console.log('server started on 4000')
  })
}).catch(error => console.log(error))
