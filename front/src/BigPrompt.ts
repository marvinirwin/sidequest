 

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
    prompt: () =>
      "What problem are you facing? We'll ask some more questions and get context on your life to provide you with the most impactful solution possible.",
    validation: "Is this a clear and concise description of the problem the user is facing?",
    nextStep: "confirmProblem",
  },

  confirmProblem: {
    prompt: (state: ProgramState) =>
      `Thanks for sharing. It seems like you're struggling with ${state.userProblem}. Does this feel correct?`,
    validation:
      "Has the user confirmed that this is a clear and concise description of the problem they are facing?",
    nextStep: "complexSelection",
  },

  complexSelection: {
    prompt: () =>
      `Your challenge likely relates to one of the six core complexes of the human experience. Reflect on these categories:
1. Identity: Issues of self-esteem or authenticity.
2. Control: Struggles with helplessness or power.
3. Connection: Feelings of loneliness or relational challenges.
4. Purpose: Dissatisfaction with direction or existential concerns.
5. Safety: Fear or a sense of instability.
6. Change: Anxiety or resistance around transitions.

Which of these resonates most with your current problem?`,
    validation:
      "Has the user identified the core complex most relevant to their problem?",
    nextStep: "standardAdvice",
  },

  standardAdvice: {
    prompt: (state: ProgramState) =>
      `It seems your problem relates to the ${state.problemType} complex. Here are some steps to consider:
${state.standardSteps}

But you already know all of this. You want better answers, don't you?`,
    validation: "Does the user want better answers?",
    nextStep: "esotericPact",
  },

  esotericPact: {
    prompt: () =>
      `To dive deeper, you must make a pact. You must confront this complex head-on, leaving behind the parts of you that are entangled in its grip. The solutions are not easy and may transform you permanently.

The six core complexes have esoteric dimensions:
- Identity: Embrace the profound question of "Who am I?" through ancient philosophical or psychological insights.
- Control: Explore transformative strategies to reclaim agency or relinquish toxic control.
- Connection: Learn unconventional ways to build meaningful bonds or master social magnetism.
- Purpose: Delve into existential wisdom, exploring the meaning of your actions and existence.
- Safety: Understand and navigate the roots of fear, drawing from hidden sources of resilience.
- Change: Discover powerful rituals and practices for embracing transformation.

Which dimension are you willing to explore?`,
    validation:
      "Has the user selected the esoteric dimension they wish to explore?",
    nextStep: "esotericSolution",
  },

  esotericSolution: {
    prompt: (state: ProgramState) =>
      `Drawing from the deep well of esoteric wisdom for the ${state.problemType} complex, here is your solution:
${state.esotericWisdom}`,
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
