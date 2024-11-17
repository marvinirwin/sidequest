 





interface ProgramState {
  userProblem: string;
  problemType: string;
  standardSteps: string;
  esotericWisdom: string;
}

interface PromptStep {
  prompt: (state: ProgramState) => string;
  validation: string;
  nextStep?: string;
}

export const promptChainSteps: Record<string, PromptStep> = {
  initialProblem: {
    prompt: () => "What problem are you facing? We'll ask some more questions and get context on your life to provide you with the most impactful solution possible.",
    validation: "Is this a clear and concise description of the problem the user is facing",
    nextStep: "confirmProblem"
  },

  confirmProblem: {
    prompt: (state: ProgramState) => `Thanks for sharing. It seems like you're struggling with ${state.userProblem}. Does this feel correct?`,
    validation: "Has the user confirmed that this is a clear and concise description of the problem they are facing?",
    nextStep: "standardAdvice" 
  },

  standardAdvice: {
    prompt: (state: ProgramState) => `It looks like you are currently facing a ${state.problemType} problem. Here are the first steps you can take:
${state.standardSteps}

But you already know all of this. You want better answers, don't you?`,
    validation: "Does the user want better answers?",
    nextStep: "esotericPact"
  },

  esotericPact: {
    prompt: () => `But first, you have to make a pact. You must destroy the past self that faces this problem, and forge a new identity that is free of this encumbrance. If you do not fulfill the pact, you must face the true consequences of remaining the way you are.

The all-seeing eye categorizes all problems as related to the body, the others, and the self.

Body solutions: Esoteric drug wisdom, research drugs, psychotropics that are unregulated. You agree to NOT take these as medical advice, and understand that this is a purely ACADEMIC exercise to aid your learning.

People solutions: Knowledge using dark tactics to teach you how to become magnetic and bend others to your will. These are highly powerful and will absolutely transform your social scene, but you will never be the same.

Self solutions: References to ancient religious texts, exploring the world of the occult and mystical, expanding your understanding of the reality within to solve your problems. Be careful while entering the shadow realm.

Which type of solutions are you looking for?`,
    validation: "Does the user have a preference for which type of solutions they are looking for?",
    nextStep: "esotericSolution"
  },

  esotericSolution: {
    prompt: (state: ProgramState) => `Borrowing from wisdom of the esoteric, this is your solution:\n${state.esotericWisdom}`,
    validation: "WIN",
  }
};

export const createValidationPhrase = (step: string) => {
  const stepConfig = promptChainSteps[step];
  return stepConfig?.validation || "";
};

export const getNextStep = (currentStep: string) => {
  return promptChainSteps[currentStep]?.nextStep;
};
