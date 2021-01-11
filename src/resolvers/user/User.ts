import { Arg, Field, InputType, Mutation, Resolver } from 'type-graphql'
import argon2 from 'argon2'
import { User } from '../../database/entities/User'

@InputType()
class UsernamePasswordInput {
  @Field()
  username: string

  @Field()
  password: string
}

@Resolver()
export class UserResolver {
  @Mutation(() => User)
  async register (
  @Arg('options') options: UsernamePasswordInput) {
    const hashedPassword = await argon2.hash(options.password)
    const newUser = new User()
    newUser.username = options.username
    newUser.password = hashedPassword

    await User.save(newUser)

    return newUser
  }
}
