import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import { v4 } from 'uuid'
import argon2 from 'argon2'
import { Context } from '../../types'
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../../constants'
import { User } from '../../database/entities/Users'
import { UsernamePasswordInput } from './UsernamePasswordInput'
import { validateRegister } from '../../utils/validateRegister'
import { sendEmail } from '../../utils/sendEmail'
import { getConnection } from 'typeorm'

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async changePassword (
    @Arg('token') token: string,
      @Arg('newPassword') newPassword: string,
      @Ctx() { redis, req }: Context
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [{
          field: 'newPassword',
          message: 'length must be greater than 2'
        }]
      }
    }
    const key = FORGET_PASSWORD_PREFIX + token
    const userId = await redis.get(key)

    if (!userId) {
      return {
        errors: [{
          field: 'token',
          message: 'token expired'
        }]
      }
    }

    const user = await User.findOne({ id: userId })

    if (!user) {
      return {
        errors: [{
          field: 'token',
          message: 'user no longer exists'
        }]
      }
    }

    const hashedPassword = await argon2.hash(newPassword)
    user.password = hashedPassword

    await User.save(user)

    await redis.del(key)
    // @ts-expect-error
    req.session.userId = user.id

    return { user }
  }

  @Mutation(() => Boolean)
  async forgotPassword (
  @Arg('email') email: string,
    @Ctx() { req, redis }: Context
  ) {
    const user = await User.findOne({ where: { email } })

    if (!user) {
      return true
    }

    const token = v4()

    await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 1000 * 60 * 60 * 24 * 3)

    await sendEmail(email, `<a href='http://localhost:3000/change-password/${token}'>reset password</a>`)

    return true
  }

  @Query(() => User, { nullable: true })
  async me (
  @Ctx() { req }: Context
  ) {
    // @ts-expect-error
    if (!req.session.userId) {
      return null
    }
    // @ts-expect-error
    return User.findOne({ id: req.session.userId })
  }

  @Mutation(() => UserResponse)
  async register (
    @Arg('options') options: UsernamePasswordInput,
      @Ctx() { req }: Context): Promise<UserResponse> {
    const errors = validateRegister(options)

    if (errors) {
      return errors
    }

    const hashedPassword = await argon2.hash(options.password)

    const result = await getConnection().createQueryBuilder().insert().into(User).values(
      {
        username: options.username,
        email: options.email,
        password: hashedPassword
      }
    ).returning('*').execute()
    const user = result.raw[0]
    // @ts-expect-error
    req.session.userId = user.id

    return {
      user
    }
  }

  @Mutation(() => UserResponse)
  async login (
    @Arg('usernameOrEmail') usernameOrEmail: string,
      @Arg('password') password: string,
      @Ctx() { req }: Context): Promise<UserResponse> {
    const user = await User.findOne(usernameOrEmail.includes('@') ? { email: usernameOrEmail } : { username: usernameOrEmail })

    if (!user) {
      return {
        errors: [
          {
            field: 'username or password',
            message: 'that username or password does not exist'
          }
        ]
      }
    }

    const isValid = await argon2.verify(user.password, password)

    if (!isValid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password'
          }
        ]
      }
    }

    // @ts-expect-error
    req.session.userId = user.id
    return {
      user
    }
  }

  @Mutation(() => Boolean)
  async logout (
  @Ctx() { req, res }: Context
  ) {
    return new Promise((resolve) => req.session.destroy((err) => {
      res.clearCookie(COOKIE_NAME)
      if (err) {
        console.log(err)
        resolve(false)
        return
      }

      resolve(true)
    }))
  }
}
