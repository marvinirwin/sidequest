import { useState } from "react";
import { solutions as ananyaSolutions, Solution } from "./solutions/ananya.ts";
import { solutions as aminSolutions } from "./solutions/amin.ts";
import { solutions as nateSolutions } from "./solutions/nate.ts";
import { PactLossComponent } from "./PactLossComponent.tsx";
import { PactWinComponent } from "./PactWinComponent.tsx";

const solutions: Solution[] = [
  ...ananyaSolutions,
  ...aminSolutions,
  ...nateSolutions,
];

interface Evidence {
  text: string;
  images: Array<{
    data: string;
    mediaType: string;
  }>;
}

interface SolutionScreenProps {
  solutionIndex: number;
}

export function SolutionScreen({ solutionIndex }: SolutionScreenProps) {
  const solution = solutions[solutionIndex];
  const [evidence, setEvidence] = useState<Evidence>({ text: "", images: [] });
  const [evidenceText, setEvidenceText] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = 500;
          canvas.height = 500;

          if (ctx) {
            const scale = Math.min(500 / img.width, 500 / img.height);
            const width = img.width * scale;
            const height = img.height * scale;
            const x = (500 - width) / 2;
            const y = (500 - height) / 2;

            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, 500, 500);
            ctx.drawImage(img, x, y, width, height);
          }

          const base64Data = canvas.toDataURL(file.type).split(",")[1];
          resolve(base64Data);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const file = files[0];
    const compressedBase64 = await compressImage(file);

    setEvidence({
      ...evidence,
      images: [
        ...evidence.images,
        {
          data: compressedBase64,
          mediaType: file.type,
        },
      ],
    });
  };

  const handleSubmitEvidence = async () => {
    try {
      const content = [
        ...evidence.images.map((img) => ({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mediaType,
            data: img.data,
          },
        })),
        {
          type: "text",
          text: evidenceText,
        },
      ];

      const response = await fetch("/api/chat/isFulfilled", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: solution.shortDescription,
          validator: solution.validatorQuestion,
          messages: [
            {
              role: "user",
              content,
            },
          ],
        }),
      });

      const data = Object.values(await response.json());
      const toolResponse = data.find((c: any) => c.type === "tool_use");

      if (toolResponse?.input.isComplete) {
        setSucceeded(true);
        setIsComplete(true);
        localStorage.clear();
      } else {
        setSucceeded(false);
        setIsComplete(true);
        localStorage.clear();
      }
    } catch (error) {
      console.error("Error validating evidence:", error);
      setValidationMessage("Error validating your submission. Please try again.");
    }
  };

  if (isComplete) {
    return succeeded ? <PactWinComponent /> : <PactLossComponent />;
  }

  return (
    <div className="flex h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/images/Pact_LIght_Awake.png)' }}>
      <div className="w-full flex justify-center items-center h-full bg-black bg-opacity-50">
        <div className="w-1/2 p-8 overflow-y-auto text-white">
          <h1 className="text-3xl font-bold mb-6">{solution.title}</h1>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: solution.body }}
          />
        </div>

        <div className="w-1/2 p-8 bg-white text-black rounded-lg">
          <h2 className="text-2xl font-semibold mb-6">Prove Your Completion</h2>
          {validationMessage && (
            <div className="p-4 mb-4 rounded bg-red-100">{validationMessage}</div>
          )}
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <textarea
                className="w-full p-2 border rounded"
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Describe how you completed this task..."
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full mt-4"
              />
              {evidence.images.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-4">
                  {evidence.images.map((img, i) => (
                    <img
                      key={i}
                      src={`data:${img.mediaType};base64,${img.data}`}
                      alt={`Evidence ${i + 1}`}
                      className="w-20 h-20 object-cover"
                    />
                  ))}
                </div>
              )}
              <button
                onClick={handleSubmitEvidence}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mt-4"
              >
                Submit Evidence
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
