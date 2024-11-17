import { useState } from 'react';

interface PromptChainProps {
  initialPrompt: string;
  validationPhrase: string;
  onValidated?: (messages: Message[]) => void;
}

interface Message {
  role: string;
  content: string;
}

export const PromptChain: React.FC<PromptChainProps> = ({ initialPrompt, validationPhrase, onValidated }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: `You are helping guide a conversation. Your goal is to achieve this outcome: ${validationPhrase}` },
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
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);

      // Check if validation criteria is met
      setIsComplete(data.isValid);
      
      // Call onValidated callback if validation criteria is met
      if (data.isValid && onValidated) {
        onValidated(finalMessages);
      }
      
    } catch (error) {
      console.error('Error chatting with AI:', error);
    }

    setUserInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.slice(1).map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[80%] rounded-lg p-4 ${
              message.role === 'assistant' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-emerald-500 text-white'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isComplete}
          autoFocus
          className="flex-1 p-4 text-lg rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={isComplete}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500"
        >
          Send
        </button>
      </form>

      {isComplete && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center">
          Validation criteria met! Conversation complete.
        </div>
      )}
    </div>
  );
};
