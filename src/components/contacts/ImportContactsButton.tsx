import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ImportContactsModal } from "./ImportContactsModal";

export function ImportContactsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(true)}
        className="bg-white hover:bg-gray-100 text-[#0b4269] border-[#0b4269] hover:text-[#21add6]"
      >
        <Upload className="mr-2 h-4 w-4" />
        Importar Contatos
      </Button>

      <ImportContactsModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
} 