import { useState, useEffect, useRef } from "react";
import { Message, ProgramState } from "./App";

interface PromptChainProps {
  initialPrompt: string;
  validationPhrase: string;
  onValidated?: (messages: Message[], programState: ProgramState) => void;
  showLatestOnly?: boolean;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  programState: ProgramState;
  setProgramState: (programState: ProgramState) => void;
}

export const PromptChain: React.FC<PromptChainProps> = ({
  initialPrompt,
  validationPhrase,
  onValidated,
  showLatestOnly = false,
  messages,
  setMessages,
  programState,
  setProgramState,
}) => {
  const [userInput, setUserInput] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsComplete(false);
  }, [initialPrompt, validationPhrase]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    if (!isComplete && !isLoading) {
      inputRef.current?.focus();
    }
  }, [messages, isComplete, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userInput.trim()) return;

    setIsLoading(true);

    // Add user message to chat
    const updatedMessages = [...messages, { role: "user", content: userInput }];

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          programState,
          validationPhrase,
        }),
      });

      let newProgramState = { ...programState };
      const responseJson = Object.values(await response.json());
      for (let i = 0; i < responseJson.length; i++) {
        const data = responseJson[i];
        if (data.type === "text") {
          const aiResponse: Message = {
            role: "assistant",
            content: data.text,
          };
          updatedMessages.push(aiResponse);
          setMessages([...updatedMessages]);
        }
        if (data.type === "tool_use") {
          if (data.name === "setProblem" && data.input.problem) {
            newProgramState = {
              ...programState,
              userProblem: data.input.problem,
            };
            setProgramState(newProgramState);
          } else if (
            data.name === "setDeepSolution" &&
            data.input.deepSolution
          ) {
            newProgramState = {
              ...newProgramState,
              esotericSolution: data.input.esotericSolution,
            };
            setProgramState(newProgramState);
          } else if (data.name === "setIsValidResponse") {
            setIsComplete(data.input.isValidResponse);
            if (data.input.isValidResponse && onValidated) {
              onValidated(updatedMessages, newProgramState);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error chatting with AI:", error);
    } finally {
      setIsLoading(false);
    }

    setUserInput("");
  };

  const displayMessages = showLatestOnly
    ? messages.slice(-1)
    : messages.slice(1);

  if (showLatestOnly) {
    const latestMessage = displayMessages[0];
    return (
      <div className="w-full max-w-2xl mx-auto rounded-lg shadow-md">
        <div
          className="bg-black text-white p-6 rounded-t-lg text-left"
          dangerouslySetInnerHTML={{ __html: latestMessage?.content }}
        />

        <div className="p-4 bg-black rounded-b-lg">
          <form
            onSubmit={handleSubmit}
            className="flex items-center w-full max-w-2xl mx-auto"
          >
            <div className="flex items-center w-full rounded-full border border-gray-600 bg-black overflow-hidden shadow-sm">
              {/* Input Field */}
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50 bg-black"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={isComplete || isLoading}
                className="bg-transparent flex items-center justify-center hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-transparent"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10.75L21 3l-7.75 18L10.5 13.5 3 10.75z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {displayMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "assistant" ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 text-left ${
                message.role === "assistant"
                  ? "bg-indigo-600 text-white"
                  : "bg-emerald-500 text-white"
              }`}
              dangerouslySetInnerHTML={{ __html: message.content }}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isComplete}
          autoFocus
          className="flex-1 px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 bg-black text-white"
        />
        <button
          type="submit"
          disabled={isComplete || isLoading}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 relative"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mx-auto" />
          ) : (
            <>
              {"Send "}
              <span className="inline-block bg-transparent text-white">
                {"✈️"}
              </span>{" "}
              {/* Paper airplane emoji with no background */}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
