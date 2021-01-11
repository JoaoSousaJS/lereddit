
import { Arg, Int, Mutation, Query, Resolver } from 'type-graphql'
import { Post } from '../../database/entities/Post'

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
    return newPost
  }

  @Mutation(() => Post, { nullable: true })
  async updatePost (
    @Arg('id') id: number,
      @Arg('title', () => String, { nullable: true }) title: string
  ): Promise<Post | undefined | null> {
    const post = await Post.findOne({ id })

    if (!post) {
      return null
    }

    if (typeof title !== 'undefined') {
      post.title = title
      await Post.save(post)
    }

    return post
  }

  @Mutation(() => Boolean)
  async deletePost (
    @Arg('id') id: number
  ): Promise<boolean | null> {
    const post = await Post.findOne({ id })

    if (!post) {
      return null
    }

    await Post.delete({ id: post.id })

    return true
  }
}
