import { useState } from 'react';
import { solutions } from './solutions/ananya';

interface CompletionBox {
  id: number;
  isCompleted: boolean;
  evidence: {
    text: string;
    images: string[];
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || selectedBox === null) return;

    const formData = new FormData();
    formData.append('image', files[0]);

    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      setCompletionBoxes(boxes => boxes.map(box => 
        box.id === selectedBox 
          ? { ...box, evidence: { ...box.evidence, images: [...box.evidence.images, data.imageUrl] } }
          : box
      ));
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleSubmitEvidence = async () => {
    if (selectedBox === null) return;

    const currentBox = completionBoxes.find(box => box.id === selectedBox);
    if (!currentBox) return;

    try {
      const response = await fetch('/api/chat/isFulfilled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: solution.validatorQuestion,
          evidence: `Text evidence: ${evidenceText}\nImage evidence: ${currentBox.evidence.images.join(', ')}`
        })
      });

      const data = await response.json();
      const toolResponse = data.content.find((c: any) => c.type === 'tool_use');
      
      if (toolResponse?.tool_use?.tool_call?.input.isComplete) {
        setCompletionBoxes(boxes => boxes.map(box => 
          box.id === selectedBox 
            ? { ...box, isCompleted: true, evidence: { ...box.evidence, text: evidenceText } }
            : box
        ));
        setValidationMessage('Task completed successfully!');
        setSelectedBox(null);
        setEvidenceText('');
      } else {
        setValidationMessage(toolResponse?.tool_use?.tool_call?.input.explanation || 'Please try again with better evidence.');
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
                        <img key={i} src={img} alt={`Evidence ${i + 1}`} className="w-20 h-20 object-cover" />
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

