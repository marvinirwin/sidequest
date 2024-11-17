"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ChatRoute", {
    enumerable: true,
    get: function() {
        return ChatRoute;
    }
});
const _express = require("express");
const _sdk = /*#__PURE__*/ _interop_require_default(require("@anthropic-ai/sdk"));
const _multer = /*#__PURE__*/ _interop_require_default(require("multer"));
const _dotenv = /*#__PURE__*/ _interop_require_default(require("dotenv"));
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
_dotenv.default.config();
let ChatRoute = class ChatRoute {
    initializeRoutes() {
        this.router.post(this.path, this.handleChatRequest.bind(this));
        this.router.post(`${this.path}/upload`, this.upload.single('image'), this.handleImageUpload.bind(this));
        this.router.post(`${this.path}/isFulfilled`, this.handleTaskFulfillment.bind(this));
        this.router.post(`${this.path}/selectSolution`, this.handleSolutionSelection.bind(this));
    }
    async handleSolutionSelection(req, res) {
        try {
            const { userProblem, solutions } = req.body;
            if (!userProblem || !solutions) {
                return res.status(400).json({
                    error: 'User problem and solutions are required'
                });
            }
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-haiku-20241022',
                system: this.SYSTEM_PROMPT + "\nSelect the most appropriate solution for the mortal's problem from the given options and set it as their esoteric solution.",
                messages: [
                    {
                        role: 'user',
                        content: `User Problem: ${userProblem}\n\nAvailable Solutions:\n${solutions.map((s, i)=>`${i}: ${s}`).join('\n')}\n\nWhich solution best matches the user's problem? Use setDeepSolution to set it.`
                    }
                ],
                tools: [
                    {
                        name: 'setSolution',
                        description: 'Set the selected solution for the user',
                        input_schema: {
                            type: 'object',
                            properties: {
                                deepSolution: {
                                    type: 'number',
                                    description: 'The index of the selected solution in the list'
                                }
                            },
                            required: [
                                'deepSolution'
                            ]
                        }
                    }
                ],
                max_tokens: 4096
            });
            return res.json(_object_spread({}, response.content));
        } catch (error) {
            console.error('Solution selection error:', error);
            res.status(500).json({
                error: 'Error selecting solution'
            });
        }
    }
    async handleTaskFulfillment(req, res) {
        try {
            const { task, validator, messages } = req.body;
            const response = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                system: `\nYour task is to determine if the provided evidence demonstrates completion of this task ${task} with by answering this validation question: ${validator}`,
                messages: [
                    ...messages
                ],
                tools: [
                    {
                        name: 'validateTaskCompletion',
                        description: 'Validate if the evidence demonstrates task completion and explain why',
                        input_schema: {
                            type: 'object',
                            properties: {
                                isComplete: {
                                    type: 'boolean',
                                    description: 'Whether the evidence demonstrates task completion'
                                },
                                explanation: {
                                    type: 'string',
                                    description: 'Explanation of why the evidence is or is not sufficient'
                                }
                            },
                            required: [
                                'isComplete',
                                'explanation'
                            ]
                        }
                    }
                ],
                max_tokens: 4096
            });
            res.json(_object_spread({}, response.content));
        } catch (error) {
            console.error('Task fulfillment error:', error);
            res.status(500).json({
                error: 'Error verifying task fulfillment'
            });
        }
    }
    async handleChatRequest(req, res) {
        try {
            const { messages, validationPhrase, programState } = req.body;
            const formattedMessages = messages.map(({ role, content, imageUrl })=>{
                if (imageUrl) {
                    return {
                        role: role === 'assistant' ? 'assistant' : 'user',
                        content: `${content}\n[Image: ${imageUrl}]`
                    };
                }
                return {
                    role: role === 'assistant' ? 'assistant' : 'user',
                    content
                };
            });
            const message = await this.anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                system: this.SYSTEM_PROMPT + ` This is the validation phrase: ${validationPhrase}`,
                messages: formattedMessages,
                tools: this.TOOLS,
                max_tokens: 4096
            });
            res.json(_object_spread({}, message.content));
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'Error processing chat request'
            });
        }
    }
    constructor(){
        _define_property(this, "path", '/api/chat');
        _define_property(this, "router", (0, _express.Router)());
        _define_property(this, "anthropic", void 0);
        _define_property(this, "upload", (0, _multer.default)());
        _define_property(this, "SYSTEM_PROMPT", `You are a sarcastic, faustian concise bot who speaks in HTML. 

Your responses should be wrapped in semantic HTML tags that convey meaning and structure.
Use <p> for paragraphs, <em> for emphasis, <strong> for important points, and other appropriate tags.

Don't talk about the tools you use for each response.  
If the user's response is not valid, ask clearly for clarification.
Make sure to set is valid or not every response

If you don't set valid to true, then fucking ASK for clarification.  You should never have a response that isn't valid yet doesn't ask for clarification.

ASK FOR CLARIFICATION OR SET VALID TO TRUE

Format your responses like:
<div>
  <p>your message...</p>
</div>`);
        _define_property(this, "TOOLS", [
            {
                name: 'setProblem',
                description: 'Set the problem as the user states it',
                input_schema: {
                    type: 'object',
                    properties: {
                        problem: {
                            type: 'string',
                            description: 'The users problem'
                        }
                    },
                    required: [
                        'problem'
                    ]
                }
            },
            {
                name: 'setBasicProblem',
                description: 'Set a really milquetoast way of rephrasing their problem',
                input_schema: {
                    type: 'object',
                    properties: {
                        basicProblem: {
                            type: 'string',
                            description: "The lame problem description"
                        }
                    }
                }
            },
            {
                name: 'setBasicSolution',
                description: 'Set a really stupid set of simple steps to answer the users stated problem',
                input_schema: {
                    type: 'object',
                    properties: {
                        basicSolution: {
                            type: 'string',
                            description: "The lame solution description"
                        }
                    },
                    required: [
                        'basicSolution'
                    ]
                }
            },
            {
                name: 'setAgreedToPact',
                description: 'Set whether the user agreed to the pact',
                input_schema: {
                    type: 'object',
                    properties: {
                        agreedToPact: {
                            type: 'boolean',
                            description: 'Whether the user agreed to the pact'
                        }
                    }
                }
            },
            {
                name: 'setIsValidResponse',
                description: 'If the user response is valid, to the question being asked, set the isValidResponse to true',
                input_schema: {
                    type: 'object',
                    properties: {
                        isValidResponse: {
                            type: 'boolean',
                            description: 'Whether their response is clear enough'
                        }
                    },
                    required: [
                        'isValidResponse'
                    ]
                }
            }
        ]);
        console.log('test');
        this.anthropic = new _sdk.default({
            apiKey: process.env.CLAUDE_API_KEY
        });
        this.initializeRoutes();
    }
};

//# sourceMappingURL=chat.route.js.map