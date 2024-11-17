import { useState } from "react";

interface VerificationProps {
  goal: string;
}

interface EvidenceBox {
  id: string;
  type: "text" | "image";
  content: string;
}

export const Verification = ({ goal }: VerificationProps) => {
  const [evidenceBoxes, setEvidenceBoxes] = useState<EvidenceBox[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(
    null
  );

  const handleAddTextBox = () => {
    setEvidenceBoxes([
      ...evidenceBoxes,
      { id: crypto.randomUUID(), type: "text", content: "" },
    ]);
  };

  const handleAddImageBox = () => {
    setEvidenceBoxes([
      ...evidenceBoxes,
      { id: crypto.randomUUID(), type: "image", content: "" },
    ]);
  };

  const handleTextChange = (id: string, content: string) => {
    setEvidenceBoxes((boxes) =>
      boxes.map((box) => (box.id === id ? { ...box, content } : box))
    );
  };

  const handleImageUpload = async (id: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const imageUrl = data.imageUrl;

      setEvidenceBoxes((boxes) =>
        boxes.map((box) =>
          box.id === id ? { ...box, content: imageUrl } : box
        )
      );
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const evidence = evidenceBoxes
        .map((box) =>
          box.type === "image" ? `[Image: ${box.content}]` : box.content
        )
        .join("\n");

      const response = await fetch("/api/chat/isFulfilled", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: goal,
          evidence,
        }),
      });
      const data = await response.json();

      setVerificationResult(data.isFulfilled);
    } catch (error) {
      console.error("Error submitting verification:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Verify Goal Completion: {goal}</h2>

      <div className="space-y-4 mb-4">
        {evidenceBoxes.map((box) => (
          <div key={box.id} className="border p-4 rounded-lg">
            {box.type === "text" ? (
              <textarea
                className="w-full p-2 border rounded"
                placeholder="Describe your evidence..."
                value={box.content}
                onChange={(e) => handleTextChange(box.id, e.target.value)}
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    e.target.files?.[0] &&
                    handleImageUpload(box.id, e.target.files[0])
                  }
                  className="mb-2"
                />
                {box.content && (
                  <img
                    src={box.content}
                    alt="Uploaded evidence"
                    className="max-w-full h-auto"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleAddTextBox}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Text
        </button>
        <button
          onClick={handleAddImageBox}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add Image
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || evidenceBoxes.length === 0}
        className="w-full bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:opacity-50"
      >
        {isSubmitting ? "Verifying..." : "Submit for Verification"}
      </button>

      {verificationResult !== null && (
        <div
          className={`mt-4 p-3 rounded text-center ${
            verificationResult
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {verificationResult
            ? "Goal verified successfully!"
            : "Goal verification failed"}
        </div>
      )}
    </div>
  );
};
