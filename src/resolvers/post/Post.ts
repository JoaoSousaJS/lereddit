
import { Arg, Ctx, Field, InputType, Int, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql'
import { Post } from '../../database/entities/Post'
import { isAuth } from '../../middleware/isAuth'
import { Context } from '../../types'

@InputType()
class PostInput {
  @Field()
  title: string

  @Field()
  text: string
}

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
  @UseMiddleware(isAuth)
  async createPost (
    @Arg('input') input: PostInput,
      @Ctx() { req }: Context): Promise<Post | undefined> {
    return Post.create({
      ...input,
      creatorId: req.session.userId
    }).save()
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
      await Post.update({ id }, { title })
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
