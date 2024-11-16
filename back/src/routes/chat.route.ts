import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import OpenAI from 'openai';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';

export class ChatRoute implements Routes {
  public path = '/api/chat';
  public router = Router();
  private openai: OpenAI;
  private upload = multer();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(this.path, this.handleChatRequest.bind(this));
    this.router.post(`${this.path}/upload`, this.upload.single('image'), this.handleImageUpload.bind(this));
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

  private async handleChatRequest(req, res) {
    try {
      const { messages, validationPhrase } = req.body;

      const formattedMessages = messages.map(({ role, content, imageUrl }) => {
        if (imageUrl) {
          return {
            role,
            content: [
              { type: 'text', text: content },
              { type: 'image_url', image_url: imageUrl }
            ]
          };
        }
        return { role, content };
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: formattedMessages,
        max_tokens: 4096,
      });

      const aiMessage = completion.choices[0].message.content;

      // Check if validation phrase appears in AI response
      const isValid = aiMessage.toLowerCase().includes(validationPhrase.toLowerCase());

      res.json({
        message: aiMessage,
        isValid,
      });
    } catch (error) {
      res.status(500).json({ error: 'Error processing chat request' });
    }
  }
}
