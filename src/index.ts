import 'reflect-metadata'
import 'dotenv/config'
import express from 'express'
import { createConnection } from 'typeorm'
import { Post } from './database/entity/Post'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from 'type-graphql'
import { PostResolver } from './resolvers/post'
import { HelloResolver } from './resolvers/Hello'

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
    Post
  ]
}).then(async connection => {
  const app = express()
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver,PostResolver],
      validate: false
    })
  })

  console.log(connection)

  apolloServer.applyMiddleware({ app })
  app.listen(4000, () => {
    console.log('server started on 4000')
  })
}).catch(error => console.log(error))
