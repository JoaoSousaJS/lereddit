import { MiddlewareFn } from 'type-graphql'
import { Context } from '../types'

export const isAuth: MiddlewareFn<Context> = async ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error('not authenticated')
  }

  return next()
}