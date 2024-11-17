import { useState } from 'react';
import { solutions } from './solutions/ananya';

interface CompletionBox {
  id: number;
  isCompleted: boolean;
  evidence: {
    text: string;
    images: Array<{
      data: string;
      mediaType: string;
    }>;
  };
}

interface SolutionScreenProps {
  solution: typeof solutions[0];
}

export function SolutionScreen({ solution }: SolutionScreenProps) {
  const [completionBoxes, setCompletionBoxes] = useState<CompletionBox[]>([
    { id: 1, isCompleted: false, evidence: { text: '', images: [] } },
    { id: 2, isCompleted: false, evidence: { text: '', images: [] } },
    { id: 3, isCompleted: false, evidence: { text: '', images: [] } }
  ]);
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [evidenceText, setEvidenceText] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 500;
          canvas.height = 500;

          if (ctx) {
            // Maintain aspect ratio while fitting within 500x500
            const scale = Math.min(500 / img.width, 500 / img.height);
            const width = img.width * scale;
            const height = img.height * scale;
            const x = (500 - width) / 2;
            const y = (500 - height) / 2;

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 500, 500);
            ctx.drawImage(img, x, y, width, height);
          }

          const base64Data = canvas.toDataURL(file.type).split(',')[1];
          resolve(base64Data);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || selectedBox === null) return;

    const file = files[0];
    const compressedBase64 = await compressImage(file);
    
    setCompletionBoxes(boxes => boxes.map(box => 
      box.id === selectedBox 
        ? { 
            ...box, 
            evidence: { 
              ...box.evidence, 
              images: [...box.evidence.images, {
                data: compressedBase64,
                mediaType: file.type
              }]
            } 
          }
        : box
    ));
  };

  const handleSubmitEvidence = async () => {
    if (selectedBox === null) return;

    const currentBox = completionBoxes.find(box => box.id === selectedBox);
    if (!currentBox) return;

    try {
      const content = [
        ...currentBox.evidence.images.map(img => ({
          type: "image", 
          source: {
            type: "base64",
            media_type: img.mediaType,
            data: img.data
          }
        })),
        {
          type: "text",
          text: evidenceText
        }
      ];

      debugger;
      const response = await fetch('/api/chat/isFulfilled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: solution.shortDescription,
          validator: solution.validatorQuestion,
          messages: [
            {
                role: "user",
                content
            }
          ]
        })
      });

      const data = Object.values(await response.json());
      debugger;
      const toolResponse = data.find((c: any) => c.type === 'tool_use');
      
      if (toolResponse?.input.isComplete) {
        setCompletionBoxes(boxes => boxes.map(box => 
          box.id === selectedBox 
            ? { ...box, isCompleted: true, evidence: { ...box.evidence, text: evidenceText } }
            : box
        ));
        setValidationMessage('Task completed successfully!');
        setSelectedBox(null);
        setEvidenceText('');
      } else {
        setValidationMessage(toolResponse?.input.explanation || 'Please try again with better evidence.');
      }
    } catch (error) {
      console.error('Error validating evidence:', error);
      setValidationMessage('Error validating your submission. Please try again.');
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 p-8 overflow-y-auto border-r">
        <h1 className="text-3xl font-bold mb-6">{solution.title}</h1>
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: solution.body }} />
      </div>

      <div className="w-1/2 p-8">
        <h2 className="text-2xl font-semibold mb-6">Track Your Progress</h2>
        {validationMessage && (
          <div className={`p-4 mb-4 rounded ${validationMessage.includes('successfully') ? 'bg-green-100' : 'bg-red-100'}`}>
            {validationMessage}
          </div>
        )}
        <div className="space-y-4">
          {completionBoxes.map(box => (
            <div 
              key={box.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors
                ${box.isCompleted ? 'bg-green-100' : 'hover:bg-gray-50'}
                ${selectedBox === box.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => !box.isCompleted && setSelectedBox(box.id)}
            >
              <h3 className="font-medium">Step {box.id}</h3>
              {selectedBox === box.id && (
                <div className="mt-4 space-y-4">
                  <textarea
                    className="w-full p-2 border rounded"
                    value={evidenceText}
                    onChange={(e) => setEvidenceText(e.target.value)}
                    placeholder="Describe how you completed this step..."
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full"
                  />
                  {box.evidence.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {box.evidence.images.map((img, i) => (
                        <img key={i} src={`data:${img.mediaType};base64,${img.data}`} alt={`Evidence ${i + 1}`} className="w-20 h-20 object-cover" />
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleSubmitEvidence}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Submit Evidence
                  </button>
                </div>
              )}
              {box.isCompleted && (
                <div className="mt-2 text-green-600">✓ Completed</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
