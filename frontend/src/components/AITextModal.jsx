import { useState } from "react";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";

// Reusable AI text generation modal (summaries + email drafts)
export default function AITextModal({ open, onOpenChange, title, description, endpoint, body }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setLoading(true);
    setText("");
    try {
      const { data } = await api.post(endpoint, body);
      setText(data.text || "No content generated.");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#0A0A0A] border-white/10 text-white max-w-2xl"
        data-testid="ai-text-modal"
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 ai-tracing" aria-hidden="true" />
        <DialogHeader>
          <DialogTitle className="font-display font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#0055FF]" /> {title}
          </DialogTitle>
          <p className="text-sm text-zinc-500">{description}</p>
        </DialogHeader>

        {!text && !loading && (
          <div className="py-8 text-center">
            <Button
              onClick={run}
              data-testid="ai-generate-btn"
              className="bg-[#0055FF] hover:bg-[#0044CC] text-white rounded-sm shadow-[0_0_20px_rgba(0,85,255,0.35)]"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Generate with Gemini
            </Button>
          </div>
        )}

        {loading && (
          <div className="py-14 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#0055FF]" />
            <p className="text-sm text-zinc-500">Gemini is thinking…</p>
          </div>
        )}

        {text && !loading && (
          <div className="space-y-4">
            <div
              data-testid="ai-result-text"
              className="bg-[#050505] border border-white/10 rounded-sm p-4 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap max-h-[50vh] overflow-y-auto"
            >
              {text}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={copy}
                className="border-white/10 hover:bg-white/5 rounded-sm"
                data-testid="ai-copy-btn"
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy
              </Button>
              <Button
                onClick={run}
                className="bg-[#0055FF] hover:bg-[#0044CC] text-white rounded-sm"
                data-testid="ai-regenerate-btn"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Regenerate
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
