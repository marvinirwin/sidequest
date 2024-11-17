import "./App.css";
import {
  promptChainSteps,
  createValidationPhrase,
  getNextStep,
} from "./BigPrompt";
import "./index.css";
import { PromptChain } from "./PromptChain";
import { useState, useEffect } from "react";
import { solutions as ananyaSolutions, Solution } from "./solutions/ananya.ts";
import { solutions as aminSolutions } from "./solutions/amin.ts";
import { solutions as nateSolutions } from "./solutions/nate.ts";
const solutions: Solution[] = [...ananyaSolutions, ...aminSolutions, ...nateSolutions];
import { Debug, useClearLocalStorageOn2, useDebugHotkey, useSetDebugContextKey } from "./DebugOverlay";
import { SolutionScreen } from "./SolutionScreen.tsx";
export interface Message {
  role: string;
  content: string;
}

export interface ProgramState {
  userProblem: string;
  problemType: string;
  standardSteps: string;
  esotericWisdom: string;
  esotericSolution: string;
}

const useLocalStorageState = <T,>(key: string, initialValue: T) => {
  // Original implementation loaded from localStorage:
  // const [state, setState] = useState<T>(() => {
  //   const stored = localStorage.getItem(key);
  //   return stored ? JSON.parse(stored) : initialValue;
  // });
  //
  // useEffect(() => {
  //   localStorage.setItem(key, JSON.stringify(state));
  // }, [key, state]);

  // Simplified version without localStorage:
  const [state, setState] = useState<T>(initialValue);
  return [state, setState] as const;
};
const useLocalStorageStateReal = <T,>(key: string, initialValue: T) => {
  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  
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
  
  const [selectedSolution, setSelectedSolution] = useLocalStorageStateReal<Solution | null>("selectedSolution", null);
  useSetDebugContextKey("Selected Solution", selectedSolution);
  
  const [programState, setProgramState] = useLocalStorageState<ProgramState>("programState", {
    userProblem: "",
    problemType: "",
    standardSteps: "",
    esotericWisdom: "",
    esotericSolution: "",
  });
  useSetDebugContextKey("Program State", programState);

  const getPromptForStep = (step: string, programState: ProgramState) => {
    const stepConfig = promptChainSteps[step];
    return stepConfig.prompt(programState);
  };

  const initialPrompt = getPromptForStep(currentStep, programState);
  const validationPhrase = createValidationPhrase(currentStep);

  const [messages, setMessages] = useLocalStorageState<Message[]>("messages", [
    { role: 'system', content: `You are helping guide a conversation. Your goal is to achieve this outcome: ${validationPhrase}` },
    { role: 'assistant', content: initialPrompt }
  ]);

/*   // Update messages when initialPrompt changes
  useEffect(() => {
    setMessages([
      { role: 'system', content: `You are helping guide a conversation. Your goal is to achieve this outcome: ${validationPhrase}` },
      { role: 'assistant', content: initialPrompt }
    ]);
  }, [initialPrompt, validationPhrase, setMessages]); */

  useSetDebugContextKey("Messages", messages);
  useClearLocalStorageOn2();

  const handleValidated = async (messages: any[], programState: ProgramState) => {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();

      setResponses((prev) => ({
        ...prev,
        [currentStep]: lastUserMessage.content,
      }));


      setCompletedSteps((prev) => [...prev, currentStep]);
      const nextStep = getNextStep(currentStep);
      if (nextStep) {
        setCurrentStep(nextStep);
        // This is the last step where we show them their solution
        if (nextStep === "esotericSolution") {
          try {
            const response = await fetch('/api/chat/selectSolution', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userProblem: programState.userProblem,
                solutions: solutions.map(s => s.shortDescription),
              }),
            });

            const responseData = await response.json();
            const selected = responseData.content.find((c: any) => c.type === 'tool_use');
            debugger;
            const deepSolution = selected?.tool_use.tool_call.input.deepSolution;
            setSelectedSolution(solutions[deepSolution] as Solution);
          } catch (error) {
            console.error('Error selecting solution:', error);
          }
        } else {
          // Keep prompting them
          const getNewPrompt = getPromptForStep(nextStep, programState);
          setMessages(messages => messages.concat([{role: "assistant", content: getNewPrompt}]));
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
      <SolutionScreen solution={selectedSolution} />
    );
  }

  return (
    <>
      <Debug isVisible={isDebugVisible} />
      <div className="min-h-screen flex items-center justify-center w-full">
        <div className={`p-4 w-full ${getBackgroundClass(currentStep)}`}>
          <PromptChain
            setProgramState={setProgramState}
            programState={programState}
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
