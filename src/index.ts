import 'reflect-metadata'
import 'dotenv/config'
import express from 'express'
import { createConnection } from 'typeorm'
import { Post } from './database/entities/Post'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { PostResolver } from './resolvers/post/Post'
import { HelloResolver } from './resolvers/Hello'
import { User } from './database/entities/User'
import { UserResolver } from './resolvers/user/user'

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
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver,PostResolver, UserResolver],
      validate: false
    })
  })

  console.log(connection)

  apolloServer.applyMiddleware({ app })
  app.listen(4000, () => {
    console.log('server started on 4000')
  })
}).catch(error => console.log(error))
