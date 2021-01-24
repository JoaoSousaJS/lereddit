import { Field, ObjectType } from 'type-graphql'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { Post } from './Post'

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number

  @OneToMany(() => Post, post => post.creator)
  posts: Post[]

  @Field()
  @CreateDateColumn()
  createdAt: Date

  @Field()
  @UpdateDateColumn()
  updatedAt: Date

  @Field()
  @Column({ type: 'text', unique: true })
  username!: string

  @Column({ type: 'text' })
  password!: string

  @Field()
  @Column({ type: 'text', unique: true, nullable: true })
  email!: string
}
