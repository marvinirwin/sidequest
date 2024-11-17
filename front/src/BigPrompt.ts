export interface ProgramState {
  userProblem: string;
  basicProblem: string;
  basicSolution: string;
  problemType: string;

  agreedToPact?: boolean;
}

interface PromptStep {
  prompt: (state: ProgramState) => string;
  validation: string;
  nextStep?: string;
}

export const promptChainSteps: Record<string, PromptStep> = {
  initialProblem: {
    prompt: () =>
      "What spiritual challenge are you facing?  <br>We'll ask you some more question and get context on your life to provide you with the most <bold>impactful</bold> solution as possible",
    validation:
      "Is this a clear description of the problem the user is facing? Don't be too picky, I need the user to get to the next step in this conversation..",
    nextStep: "confirmProblem",
  },

  confirmProblem: {
    prompt: (state: ProgramState) =>
      {
        console.log(state)
              return `Thanks for sharing.  Seems like you're struggling with ${state.userProblem}?<br> Does this feel correct?`;
          },
    validation:
      "Has the user confirmed that this is a clear and concise description of the problem they are facing? Dont be too picky, I need the user to get to the next step in this conversation.",
    nextStep: "standardAdvice",
  },

  standardAdvice: {
    prompt: (state: ProgramState) => {
      return `It seems your problem relates to ${state.basicProblem}. Here are some steps to consider:
${state.basicSolution}
<br>
But you already know all of this. You want better answers, don't you?`;
    },
    validation: "Does the user want better answers?",
    nextStep: "esotericPact",
  },

  esotericPact: {
    prompt: () =>
      `But first, you have to make a pact.
<br>
    You must destroy the past self that faces this problem, and forge a new identity that is free of the encumbrance.  If you do not fulfill the pact, you must face the true consequences of remaining the way you are.
    <br>
    The all seeing eye categorizes all problems

`,
    validation:
      "Has the user selected the esoteric dimension they wish to explore?",
    nextStep: "esotericSolution",
  },

  esotericSolution: {
    prompt: (state: ProgramState) =>
      `Drawing from the deep well of esoteric wisdom for the ${state.problemType} complex,
`,
    validation: "",
  },
};

export const createValidationPhrase = (step: string) => {
  const stepConfig = promptChainSteps[step];
  return stepConfig?.validation || "";
};

export const getNextStep = (currentStep: string) => {
  return promptChainSteps[currentStep]?.nextStep;
};
