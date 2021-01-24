import { Field, ObjectType } from 'type-graphql'
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm'
import { User } from './Users'

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number

  @Field()
  @Column()
  creatorId: number

  @ManyToOne(() => User, user => user.posts)
  creator: User

  @Field()
  @CreateDateColumn()
  createdAt: Date

  @Field()
  @UpdateDateColumn()
  updatedAt: Date

  @Field()
  @Column()
  title!: string

  @Field()
  @Column()
  text!: string

  @Field()
  @Column({ type: 'int', default: 0 })
  points!: number
}
