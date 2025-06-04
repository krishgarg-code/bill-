import React from "react";
import { Save, RotateCcw, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const QuickActions = ({
  onSave,
  onReset,
  onGenerate,
  savedDrafts,
  onLoadDraft,
}) => {
  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            onClick={onSave}
            variant="outline"
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Save size={16} className="mr-2" />
            Save Draft (Ctrl+S)
          </Button>

          <Button
            onClick={onReset}
            variant="outline"
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
          >
            <RotateCcw size={16} className="mr-2" />
            Reset
          </Button>

          <Button
            onClick={onGenerate}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <FileText size={16} className="mr-2" />
            Generate Bill (Ctrl+Enter)
          </Button>

          {savedDrafts.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                >
                  <Download size={16} className="mr-2" />
                  Load Draft ({savedDrafts.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {savedDrafts.map((draft) => (
                  <DropdownMenuItem
                    key={draft.id}
                    onClick={() => onLoadDraft(draft)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{draft.name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(draft.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Keyboard shortcuts: Enter/↓/↑ for navigation • F2 to add item •
            Ctrl+Enter to generate • Ctrl+S to save
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
