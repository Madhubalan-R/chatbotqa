import { Request, Response } from "express";
import { AppDataSource } from "../dbconfig";
import { BotQa } from "../models/botQa";
import natural from "natural";

export const createQa = async (req: Request, res: Response) => {
  try {
    const { SchemeName, question, answer, nextQuestions } = req.body;

    if (!SchemeName) {
      return res.status(400).json({
        Success: false,
        message: "Enter your Scheme Name",
      });
    }
    if (!question) {
      return res.status(400).json({
        Success: false,
        message: "Enter question",
      });
    }
    if (!answer) {
      return res.status(400).json({
        Success: false,
        message: "Enter valid answer",
      });
    }
    if (!nextQuestions || !Array.isArray(nextQuestions)) {
      return res.status(400).json({
        Success: false,
        message: "Enter the next Questions you want ?",
      });
    }

    const qaRepo = AppDataSource.getRepository(BotQa);
    const newQa = qaRepo.create({
      SchemeName,
      question,
      answer,
      nextQuestions: JSON.stringify(nextQuestions),
    });
    await qaRepo.save(newQa);

    return res.json({
      success: true,
      message: "Created Successfully",
      data: newQa,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getAllQa = async (req: Request, res: Response) => {
  try {
    const qaRepo = AppDataSource.getRepository(BotQa);
    const newQa = await qaRepo.find();

    return res.status(200).json({
      success: true,
      data: newQa,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error,
    });
  }
};

export const getQaByScheme = async (req: Request, res: Response) => {
  const { SchemeName } = req.body;
  const qaRepo = AppDataSource.getRepository(BotQa);
  const getQa = await qaRepo.find({ where: { SchemeName } });

  if (getQa.length > 0) {
    return res.status(201).json({
      success: true,
      data: getQa,
    });
  } else {
    return res.json({
      message: "Scheme name not found",
    });
  }
};

export const getQuestionsByScheme = async (req: Request, res: Response) => {
  const { SchemeName } = req.body;
  const qaRepo = AppDataSource.getRepository(BotQa);
  const getQa = await qaRepo.find({ where: { SchemeName } });

  if (getQa.length > 0) {
    const questions = getQa.map((item) => item.question);
    return res.status(201).json({
      success: true,
      questions: questions,
    });
  } else {
    return res.json({
      message: "Scheme name not found",
    });
  }
};
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

const normalizeText = (text: string): string => {
  return tokenizer
    .tokenize(text.toLowerCase().replace(/[^\w\s]/g, ""))
    .map((word) => stemmer.stem(word))
    .join(" ");
};

const similarityScore = (text1: string, text2: string): number => {
  return natural.JaroWinklerDistance(text1, text2);
};

export const getAnswerByQuestion = async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const qaRepo = AppDataSource.getRepository(BotQa);
    const allQa = await qaRepo.find();

    const normalizedUserQ = normalizeText(question);

    let bestMatch: any = null;
    let highestScore = 0;

    allQa.forEach((qa) => {
      const normalizedStoredQ = normalizeText(qa.question);
      const score = similarityScore(normalizedUserQ, normalizedStoredQ);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = qa;
      }
    });

    if (highestScore < 0.7 || !bestMatch) {
      return res.status(200).json({
        success: false,
        message: "No relevant answer found. Talk to an Agent.",
        nextQuestions: [],
      });
    }

    let nextQuestions: string[] = [];
    if (bestMatch.nextQuestions) {
      if (typeof bestMatch.nextQuestions === "string") {
        nextQuestions = bestMatch.nextQuestions
          .split(",")
          .map((q: string) => q.trim());
      } else if (Array.isArray(bestMatch.nextQuestions)) {
        nextQuestions = bestMatch.nextQuestions;
      }
    }

    return res.status(200).json({
      success: true,
      answer: bestMatch.answer,
      nextQuestions,
      confidence: highestScore,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};