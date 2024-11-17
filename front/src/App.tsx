import "./App.css";
import {
  promptChainSteps,
  createValidationPhrase,
  getNextStep,
} from "./BigPrompt";
import "./index.css";
import { PromptChain } from "./PromptChain";
import { Solution } from "./Solution";
import { Verification } from "./Verification";
import { useState, useEffect } from "react";
import { solutions as ananyaSolutions } from "./solutions/ananya.ts";
import { solutions as aminSolutions } from "./solutions/amin.ts";
import { solutions as nateSolutions } from "./solutions/nate.ts";
const solutions = [...ananyaSolutions, ...aminSolutions, ...nateSolutions];
import { Debug, useClearLocalStorageOn2, useDebugHotkey, useSetDebugContextKey } from "./DebugOverlay";
export interface Message {
  role: string;
  content: string;
}

const useLocalStorageState = <T,>(key: string, initialValue: T) => {
  // Get stored value from localStorage or use initial value
  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
};

function App() {
  const isDebugVisible = useDebugHotkey();
  const [currentStep, setCurrentStep] = useLocalStorageState("currentStep", "initialProblem");
  useSetDebugContextKey("Current Step", currentStep);
  
  const [responses, setResponses] = useLocalStorageState<Record<string, string>>("responses", {});
  useSetDebugContextKey("Responses", responses);
  
  const [completedSteps, setCompletedSteps] = useLocalStorageState<string[]>("completedSteps", []);
  useSetDebugContextKey("Completed Steps", completedSteps);
  
  const [selectedSolution, setSelectedSolution] = useLocalStorageState<number | null>("selectedSolution", null);
  useSetDebugContextKey("Selected Solution", selectedSolution);
  
  const [programState, setProgramState] = useLocalStorageState("programState", {
    userProblem: "",
    problemType: "",
    standardSteps: "",
    esotericWisdom: "",
  });
  useSetDebugContextKey("Program State", programState);

  const getPromptForStep = (step: string) => {
    const stepConfig = promptChainSteps[step];
    return stepConfig.prompt(programState);
  };

  const initialPrompt = getPromptForStep(currentStep);
  const validationPhrase = createValidationPhrase(currentStep);

  const [messages, setMessages] = useLocalStorageState<Message[]>("messages", [
    { role: 'system', content: `You are helping guide a conversation. Your goal is to achieve this outcome: ${validationPhrase}` },
    { role: 'assistant', content: initialPrompt }
  ]);
  useSetDebugContextKey("Messages", messages);
  useClearLocalStorageOn2();

  const handleValidated = async (messages: any[]) => {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();

    if (lastUserMessage) {
      setResponses((prev) => ({
        ...prev,
        [currentStep]: lastUserMessage.content,
      }));

      if (currentStep === "initialProblem") {
        setProgramState((prev) => ({
          ...prev,
          userProblem: lastUserMessage.content,
        }));
      }

      setCompletedSteps((prev) => [...prev, currentStep]);

      const nextStep = getNextStep(currentStep);
      if (nextStep) {
        setCurrentStep(nextStep);
      } else {
        // When flow is complete, ask Claude to select best solution
        const response = await fetch("/api/chat/selectSolution", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userProblem: programState.userProblem,
            solutions: solutions.map((s) => s.shortDescription),
          }),
        });
        const data = await response.json();
        setSelectedSolution(data.selectedSolutionIndex);
      }
    }
  };

  const getBackgroundClass = (step: string) => {
    switch (step) {
      case "initialProblem":
        return "bg-blue-100";
      case "confirmProblem":
        return "bg-green-100";
      case "standardAdvice":
        return "bg-yellow-100";
      case "esotericPact":
        return "bg-purple-100";
      case "esotericSolution":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };


  if (selectedSolution !== null) {
    return (
      <div className="flex min-h-screen w-full">
        <div className="w-1/2 border-r border-gray-200">
          <Solution solution={solutions[selectedSolution]} />
        </div>
        <div className="w-1/2">
          <Verification goal={solutions[selectedSolution].validatorQuestion} />
        </div>
      </div>
    );
  }

  return (
    <>
      <Debug isVisible={isDebugVisible} />
      <div className="min-h-screen flex items-center justify-center w-full">
        <div className={`p-4 w-full ${getBackgroundClass(currentStep)}`}>
          <PromptChain
            setMessages={setMessages}
            initialPrompt={initialPrompt}
            validationPhrase={validationPhrase}
            onValidated={handleValidated}
            showLatestOnly={true}
            messages={messages}
          />
        </div>
      </div>
    </>
  );
}

export default App;
