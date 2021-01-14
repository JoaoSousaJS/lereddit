import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from 'type-graphql'
import argon2 from 'argon2'
import { User } from '../../database/entities/User'
import { Context } from '../../types'

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string

  @Field()
  password: string
}

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
    const userExists = await User.findOne({ username: options.username })

    if (userExists) {
      return {
        errors: [{
          field: 'username',
          message: 'This user already exists'
        }]
      }
    }
    if (options.username.length <= 2) {
      return {
        errors: [{
          field: 'username',
          message: 'length must be greater than 2'
        }]
      }
    }

    if (options.password.length <= 3) {
      return {
        errors: [{
          field: 'password',
          message: 'length must be greater than 3'
        }]
      }
    }
    const hashedPassword = await argon2.hash(options.password)
    const newUser = new User()
    newUser.username = options.username
    newUser.password = hashedPassword

    await User.save(newUser)
    // @ts-expect-error
    req.session.userId = newUser.id

    return {
      user: newUser
    }
  }

  @Mutation(() => UserResponse)
  async login (
    @Arg('options') options: UsernamePasswordInput,
      @Ctx() { req }: Context): Promise<UserResponse> {
    const user = await User.findOneOrFail({ username: options.username })

    if (!user) {
      return {
        errors: [
          {
            field: 'username',
            message: 'that username does not exist'
          }
        ]
      }
    }

    const valid = await argon2.verify(user.password, options.password)

    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect passwor'
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
}
