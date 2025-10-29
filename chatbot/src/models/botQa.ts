import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class BotQa {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  SchemeName!: string;

  @Column()
  question!: string;

  @Column("text")
  answer!: string;

  @Column("text", { nullable: true })
  nextQuestions!: string;
}