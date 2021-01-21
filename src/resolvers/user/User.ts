import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import argon2 from 'argon2'
import { Context } from '../../types'
import { COOKIE_NAME } from '../../constants'
import { User } from '../../database/entities/Users'
import { UsernamePasswordInput } from './UsernamePasswordInput'
import { validateRegister } from '../../utils/validateRegister'

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
  // @Mutation(() => Boolean)
  // async forgotPassword (
  // @Arg('email') email: string,
  //   @Ctx() { req }: Context
  // ) {
  //   // const user = await User.findOne({ email })

  //   return true
  // }

  @Query(() => User, { nullable: true })
  async me (
  @Ctx() { req }: Context
  ) {
    // @ts-expect-error
    if (!req.session.userId) {
      return null
    }
    // @ts-expect-error
    const user = await User.findOne({ id: req.session.userId })
    return user
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
    const newUser = new User()
    newUser.username = options.username
    newUser.password = hashedPassword
    newUser.email = options.email
    newUser.createdAt = new Date()
    newUser.updatedAt = new Date()

    await User.save(newUser)
    // @ts-expect-error
    req.session.userId = newUser.id

    return {
      user: newUser
    }
  }

  @Mutation(() => UserResponse)
  async login (
    @Arg('usernameOrEmail') usernameOrEmail: string,
      @Arg('password') password: string,
      @Ctx() { req }: Context): Promise<UserResponse> {
    const user = await User.findOneOrFail(usernameOrEmail.includes('@') ? { email: usernameOrEmail } : { username: usernameOrEmail })

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
