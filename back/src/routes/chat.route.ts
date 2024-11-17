import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();

export class ChatRoute implements Routes {
  public path = '/api/chat';
  public router = Router();
  private anthropic: Anthropic;
  private upload = multer();

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(this.path, this.handleChatRequest.bind(this));
    this.router.post(`${this.path}/upload`, this.upload.single('image'), this.handleImageUpload.bind(this));
    this.router.post(`${this.path}/isFulfilled`, this.handleTaskFulfillment.bind(this));
    this.router.post(`${this.path}/selectSolution`, this.handleSolutionSelection.bind(this));
  }

  private async handleSolutionSelection(req, res) {
    try {
      const { userProblem, solutions } = req.body;

      if (!userProblem || !solutions) {
        return res.status(400).json({ error: 'User problem and solutions are required' });
      }

      const messages = [
        {
          role: 'system',
          content: 'You are a solution matching assistant. Your task is to select the most appropriate solution for the user\'s problem from the given options. Return only the index number (0-based) of the best matching solution.',
        },
        {
          role: 'user',
          content: `User Problem: ${userProblem}\n\nAvailable Solutions:\n${solutions.map((s, i) => `${i}: ${s}`).join('\n')}\n\nWhich solution index best matches the user's problem?`,
        },
      ];

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        messages,
        max_tokens: 4096,
      });

      const selectedSolutionIndex = parseInt(response.content[0].text.trim());

      res.json({
        selectedSolutionIndex,
        userProblem,
      });
    } catch (error) {
      console.error('Solution selection error:', error);
      res.status(500).json({ error: 'Error selecting solution' });
    }
  }

  private async handleImageUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const formData = new FormData();
      formData.append('image', req.file.buffer.toString('base64'));

      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        params: {
          key: process.env.IMGBB_API_KEY,
        },
        headers: formData.getHeaders(),
      });

      res.json({ imageUrl: response.data.data.url });
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: 'Error uploading image' });
    }
  }

  private async handleTaskFulfillment(req, res) {
    try {
      const { task, evidence } = req.body;

      if (!task || !evidence) {
        return res.status(400).json({ error: 'Task and evidence are required' });
      }

      const messages = [
        {
          role: 'system',
          content:
            'You are a task verification assistant. Your job is to determine if the provided evidence demonstrates completion of the given task. Respond with true or false only.',
        },
        {
          role: 'user',
          content: `Task: ${task}\nEvidence: ${evidence}\nDoes this evidence demonstrate completion of the task?`,
        },
      ];

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        messages,
        max_tokens: 4096,
      });

      const isFulfilled = response.content[0].text.toLowerCase().includes('true');

      res.json({
        isFulfilled,
        task,
        evidence,
      });
    } catch (error) {
      console.error('Task fulfillment error:', error);
      res.status(500).json({ error: 'Error verifying task fulfillment' });
    }
  }

  private async handleChatRequest(req, res) {
    try {
      const { messages, validationPhrase } = req.body;

      const formattedMessages = messages.map(({ role, content, imageUrl }) => {
        if (imageUrl) {
          return {
            role: role === 'assistant' ? 'assistant' : 'user',
            content: `${content}\n[Image: ${imageUrl}]`,
          };
        }
        return {
          role: role === 'assistant' ? 'assistant' : 'user',
          content,
        };
      });

      // Add validation check as a system message
      const validationMessages = [
        ...formattedMessages,
        {
          role: 'user',
          content: `Based on the user's last response, determine if the following criteria is met: ${validationPhrase}. Respond with either "true" or "false".`,
        },
      ];

      const validationResponse = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        messages: validationMessages,
        max_tokens: 4096,
      });

      const isValid = validationResponse.content[0].text.toLowerCase().includes('true');

      // Get AI's response to continue the conversation
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        messages: formattedMessages,
        max_tokens: 4096,
      });

      const aiMessage = message.content[0].text;

      res.json({
        message: aiMessage,
        isValid,
        validationReason: isValid ? 'User response meets validation criteria' : 'User response does not meet validation criteria',
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error processing chat request' });
    }
  }
}
