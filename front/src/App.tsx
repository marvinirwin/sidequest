import "./App.css";
import { PromptChain } from "./PromptChain";
import { useState } from "react";

interface Message {
  role: string;
  content: string;
}

function App() {
  const [step, setStep] = useState(1);
  const [userProblem, setUserProblem] = useState("");
  const [wantsBetterAnswers, setWantsBetterAnswers] = useState(false);
  const [problemCategory, setProblemCategory] = useState<"body" | "others" | "self" | null>(null);

  const handleInitialProblem = (messages: Message[]) => {
    const lastUserMessage = messages.findLast(m => m.role === "user");
    if (lastUserMessage) {
      setUserProblem(lastUserMessage.content);
      setStep(2);
    }
  };

  const handleConfirmation = (messages: Message[]) => {
    const lastUserMessage = messages.findLast(m => m.role === "user");
    if (lastUserMessage?.content.toLowerCase().includes("yes")) {
      setStep(3);
    }
  };

  const handleWantsBetter = (messages: Message[]) => {
    const lastUserMessage = messages.findLast(m => m.role === "user");
    if (lastUserMessage?.content.toLowerCase().includes("yes")) {
      setWantsBetterAnswers(true);
      setStep(4);
    }
  };

  const handleCategory = (messages: Message[]) => {
    const lastUserMessage = messages.findLast(m => m.role === "user");
    const content = lastUserMessage?.content.toLowerCase();
    if (content?.includes("body")) {
      setProblemCategory("body");
      setStep(5);
    } else if (content?.includes("others") || content?.includes("people")) {
      setProblemCategory("others");
      setStep(5);
    } else if (content?.includes("self")) {
      setProblemCategory("self");
      setStep(5);
    }
  };

  return (
    <>
      {step === 1 && (
        <PromptChain
          initialPrompt="What problem are you facing? We'll ask some more questions and get context on your life to provide you with the most impactful solution possible."
          validationPhrase="The user has provided a clear description of their problem"
          onValidated={handleInitialProblem}
        />
      )}
      
      {step === 2 && (
        <PromptChain
          initialPrompt={`Thanks for sharing. It seems like you're struggling with ${userProblem}. Does this feel correct?`}
          validationPhrase="The user has confirmed or denied the problem summary"
          onValidated={handleConfirmation}
        />
      )}

      {step === 3 && (
        <PromptChain
          initialPrompt={`It looks like you are currently facing a ${userProblem} problem. Here are the first steps you can take: 1) Break the problem down into smaller parts 2) Address each part systematically 3) Seek support from others when needed. But you already know all of this. You want better answers, don't you?`}
          validationPhrase="The user has indicated whether they want deeper answers"
          onValidated={handleWantsBetter}
        />
      )}

      {step === 4 && (
        <PromptChain
          initialPrompt={`But first, you have to make a pact. You must destroy the past self that faces this problem, and forge a new identity that is free of this encumbrance. If you do not fulfill the pact, you must face the true consequences of remaining the way you are.

The all-seeing eye categorizes all problems as related to the body, the others and the self.

Which type of solution interests you? (Reply with: body, others, or self)`}
          validationPhrase="The user has selected a problem category"
          onValidated={handleCategory}
        />
      )}

      {step === 5 && (
        <PromptChain
          initialPrompt={`Based on your choice of ${problemCategory}, here is your esoteric solution...`}
          validationPhrase="The user has received their esoteric solution"
          onValidated={() => {}}
        />
      )}
    </>
  );
}

export default App;
