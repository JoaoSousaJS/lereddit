
import { Query, Resolver } from 'type-graphql'
import { Post } from '../database/entity/Post'

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts (): Promise<Post[]> {
    return Post.find()
  }
}
