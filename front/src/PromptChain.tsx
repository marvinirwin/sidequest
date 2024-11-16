import { useState } from 'react';

interface PromptChainProps {
  initialPrompt: string;
  validationPhrase: string;
}

interface Message {
  role: string;
  content: string;
}

export const PromptChain: React.FC<PromptChainProps> = ({ initialPrompt, validationPhrase }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialPrompt }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim()) return;

    // Add user message to chat
    const updatedMessages = [
      ...messages,
      { role: 'user', content: userInput }
    ];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          validationPhrase
        }),
      });

      const data = await response.json();
      
      // Add AI response to chat
      const aiResponse: Message = { role: 'assistant', content: data.message };
      setMessages([
        ...updatedMessages,
        aiResponse
      ]);

      // Check if validation criteria is met
      setIsComplete(data.isValid);
      
    } catch (error) {
      console.error('Error chatting with AI:', error);
    }

    setUserInput('');
  };

  return (
    <div className="prompt-chain">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.role}`}>
            {message.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isComplete}
        />
        <button type="submit" disabled={isComplete}>
          Send
        </button>
      </form>

      {isComplete && (
        <div className="completion-message">
          Validation criteria met! Conversation complete.
        </div>
      )}
    </div>
  );
};
