
import { Arg, Int, Mutation, Query, Resolver } from 'type-graphql'
import { Post } from '../database/entity/Post'

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  async posts (): Promise<Post[]> {
    return Post.find()
  }

  @Query(() => Post, { nullable: true })
  async post (
    @Arg('id', () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne({ id })
  }

  @Mutation(() => Post)
  async createPost (
    @Arg('title', () => String) title: string): Promise<Post | undefined> {
    const newPost = new Post()
    newPost.title = title
    await Post.save(newPost)
    return Post.findOne({ id: newPost.id })
  }
}
