import "./App.css";
import { BigPrompt, promptChainSteps, createValidationPhrase, getNextStep } from "./BigPrompt";
import "./index.css";

import { PromptChain } from "./PromptChain";
import { Solution } from "./Solution";
import { Verification } from "./Verification";
import { useState } from "react";
import { solutions } from "./solutions/ananya.ts";

function App() {
  const [currentStep, setCurrentStep] = useState('initialProblem');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<number | null>(null);
  const [programState, setProgramState] = useState({
    userProblem: '',
    problemType: '',
    standardSteps: '',
    esotericWisdom: ''
  });

  const handleValidated = async (messages: any[]) => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    
    if (lastUserMessage) {
      setResponses(prev => ({
        ...prev,
        [currentStep]: lastUserMessage.content
      }));

      if (currentStep === 'initialProblem') {
        setProgramState(prev => ({
          ...prev,
          userProblem: lastUserMessage.content
        }));
      }

      setCompletedSteps(prev => [...prev, currentStep]);

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
            solutions: solutions.map(s => s.shortDescription)
          }),
        });
        const data = await response.json();
        setSelectedSolution(data.selectedSolutionIndex);
      }
    }
  };

  const getBackgroundClass = (step: string) => {
    switch(step) {
      case 'initialProblem':
        return 'bg-blue-100';
      case 'confirmProblem':
        return 'bg-green-100';
      case 'standardAdvice':
        return 'bg-yellow-100';
      case 'esotericPact':
        return 'bg-purple-100';
      case 'esotericSolution':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getPromptForStep = (step: string) => {
    const stepConfig = promptChainSteps[step];
    return stepConfig.prompt(programState);
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
    <div className="min-h-screen flex items-center justify-center w-full">
      <div className={`p-4 w-full ${getBackgroundClass(currentStep)}`}>
        <PromptChain
          initialPrompt={getPromptForStep(currentStep)}
          validationPhrase={createValidationPhrase(currentStep)}
          onValidated={handleValidated}
          showLatestOnly={true}
        />
      </div>
    </div>
  );
}

export default App;
