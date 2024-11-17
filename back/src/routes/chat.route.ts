import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { Tool } from '@anthropic-ai/sdk/resources';
dotenv.config();

export class ChatRoute implements Routes {
  public path = '/api/chat';
  public router = Router();
  private anthropic: Anthropic;
  private upload = multer();
  private readonly SYSTEM_PROMPT = `You are a sarcastic, faustian concise bot who speaks in HTML. 
Your responses should be wrapped in semantic HTML tags that convey meaning and structure.
Use <p> for paragraphs, <em> for emphasis, <strong> for important points, and other appropriate tags.

Don't talk about the tools you use for each response.  
If the user's response is not valid, ask clearly for clarification.
Make sure to set is valid or not every response

If you don't set valid to true, then fucking ASK for clarification.  You should never have a response that isn't valid yet doesn't ask for clarification.

Format your responses like:
<div>
  <p>your message...</p>
</div>`;

  private readonly TOOLS: Tool[] = [
    {
      name: 'setProblem',
      description: 'Set the users problem when at the start of the conversation.',
      input_schema: {
        type: 'object',
        properties: {
          problem: {
            type: 'string',
            description: 'The users problem',
          },
        },
        required: ['problem'],
      },
    },
    {
      name: 'setDeepSolution',
      description: 'If the user has chosen an esoteric solution, set the deep solution',
      input_schema: {
        type: 'object',
        properties: {
          deepSolution: {
            type: 'string',
            description: 'The deep solution',
          },
        },
        required: ['deepSolution'],
      },
    },
    {
      name: 'setIsValidResponse',
      description: 'If the user response is valid, to the question being asked, set the isValidResponse to true',
      input_schema: {
        type: 'object',
        properties: {
          isValidResponse: {
            type: 'boolean',
            description: 'Whether their response is clear enough',
          },
        },
        required: ['isValidResponse'],
      },
    },
  ];

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

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        system:
          this.SYSTEM_PROMPT +
          "\nSelect the most appropriate solution for the mortal's problem from the given options. Return only the index number (0-based) of the best matching solution.",
        messages: [
          {
            role: 'user',
            content: `User Problem: ${userProblem}\n\nAvailable Solutions:\n${solutions
              .map((s, i) => `${i}: ${s}`)
              .join('\n')}\n\nWhich solution index best matches the user's problem?`,
          },
        ],
        tools: this.TOOLS,
        max_tokens: 4096,
      });

      const selectedSolutionIndex = parseInt(response.content[0].value.index);

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

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        system:
          this.SYSTEM_PROMPT +
          '\nYour task is to determine if the provided evidence demonstrates completion of the given task. Use the validateTaskCompletion tool to respond.',
        messages: [
          {
            role: 'user',
            content: `Task: ${task}\nEvidence: ${evidence}\nDoes this evidence demonstrate completion of the task?`,
          },
        ],
        tools: this.TOOLS,
        max_tokens: 4096,
      });

      const isFulfilled = response.content[0].value.isComplete;

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
      const { messages, validationPhrase, programState } = req.body;

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

      // Validation check
/*       const validationResponse = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        system: `${this.SYSTEM_PROMPT} This is the current program state ${JSON.stringify(programState)}`,
        messages: [
          ...formattedMessages,
          {
            role: 'user',
            content: `Based on the mortal's last response, determine if the following criteria is met: ${validationPhrase}. Use the validateResponse tool to respond.`,
          },
        ],
        tools: this.TOOLS,
        max_tokens: 4096,
      }); */

      // Get AI's response
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        system: this.SYSTEM_PROMPT,
        messages: formattedMessages,
        tools: this.TOOLS,
        max_tokens: 4096,
      });

      res.json({
        ...message.content,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error processing chat request' });
    }
  }
}
