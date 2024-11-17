interface Solution {
  title: string;
  body: string;
  validatorQuestion: string;
  tags: string[];
}

interface SolutionProps {
  solution: Solution;
}

export const Solution = ({ solution }: SolutionProps) => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{solution.title}</h1>
      
      <div 
        className="prose prose-invert"
        dangerouslySetInnerHTML={{ __html: solution.body }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {solution.tags.map((tag: string, index: number) => (
          <span 
            key={index}
            className="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

