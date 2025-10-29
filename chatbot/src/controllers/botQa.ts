import { Request, Response } from "express";
import { AppDataSource } from "../dbconfig";
import { BotQa } from "../models/botQa";

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

export const getAnswerByQuestion = async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        message: "Question is required",
      });
    }

    const getQusetion = AppDataSource.getRepository(BotQa);
    const getAnswer = await getQusetion.findOne({ where: { question } });

    if (!getAnswer) {
      return res.status(400).json({
        message: "No answers found!, Talk to an Agent",
      });
    }
    return res.status(200).json({
      success: true,
      answer: getAnswer.answer,
      nextQuestions: getAnswer.nextQuestions,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
