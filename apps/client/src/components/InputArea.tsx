"use client";

import {
  BarChart2Icon,
  BotIcon,
  ChevronDownIcon,
  LogInIcon,
  LogOutIcon,
  PaperclipIcon,
  SendIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "../../../../src/components/components/ui/textarea";
import { LoginModal } from "./LoginModal";
import { CharacterActivity } from "./OperationLog";

const leftCharacters = [
  { id: "sage", name: "AI Sage" },
  { id: "mentor", name: "AI Mentor" },
  { id: "analyst", name: "AI Analyst" },
];

const rightCharacters = [
  { id: "rand", name: "Rand Godin" },
  { id: "gary", name: "Gary Patel" },
  { id: "mirch", name: "Mirch Benes" },
];

interface InputAreaProps {
  onSubmitAction: (text: string) => void;
  onAttach?: () => void;
  onShowDashboard?: () => void;
  threadId: string;
}

export function InputArea({
  onSubmitAction,
  onAttach,
  onShowDashboard,
  threadId,
}: InputAreaProps) {
  const characters = threadId === "thread1" ? leftCharacters : rightCharacters;
  const [text, setText] = useState("");
  const [selectedChar, setSelectedChar] = useState(characters[0]);
  const [isCharMenuOpen, setIsCharMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsCharMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSelectedChar(characters[0]);
  }, [characters]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmitAction(text);
    setText("");
  };

  const handleLoginClick = () => {
    if (isLoggedIn) {
      setIsLoggedIn(false);
    } else {
      setIsLoginOpen(true);
    }
  };

  return (
    <div className="relative w-full">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Type a message..."
        className="min-h-[40px] max-h-[200px] pr-16 py-2 bg-white w-full text-[6pt]"
      />
      <div className="absolute right-3 top-2.5 flex items-center gap-2">
        <BarChart2Icon
          className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
          onClick={onShowDashboard}
        />
        <PaperclipIcon
          className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-primary transition-colors"
          style={{ opacity: text.trim() ? 0.5 : 1 }}
          onClick={onAttach}
        />
        <SendIcon
          onClick={handleSubmit}
          className="h-4 w-4 cursor-pointer text-primary hover:text-primary/80 transition-colors"
          style={{ opacity: text.trim() ? 1 : 0.5 }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-1">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsCharMenuOpen(!isCharMenuOpen)}
            className="flex items-center gap-1 text-[6pt] text-muted-foreground hover:text-foreground px-1 py-0.5 rounded bg-muted/40"
          >
            {selectedChar.name}
            <ChevronDownIcon className="h-3 w-3" />
          </button>
          {isCharMenuOpen && (
            <div className="absolute top-full left-0 mt-1 w-24 bg-white rounded shadow-lg border text-[6pt] py-1 z-10">
              {characters.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  className="w-full px-2 py-1 text-left hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSelectedChar(char);
                    setIsCharMenuOpen(false);
                  }}
                >
                  {char.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setIsActivityOpen(true)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <BotIcon className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-[6pt] text-muted-foreground hover:text-foreground px-1 py-0.5 rounded bg-muted/40"
          onClick={handleLoginClick}
        >
          {isLoggedIn ? (
            <>
              <LogOutIcon className="h-3 w-3" />
              Logout
            </>
          ) : (
            <>
              <LogInIcon className="h-3 w-3" />
              Login
            </>
          )}
        </button>
      </div>
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={() => {
          setIsLoggedIn(true);
          setIsLoginOpen(false);
        }}
      />
      <CharacterActivity
        isOpen={isActivityOpen}
        onCloseAction={() => setIsActivityOpen(false)}
        threadId={threadId}
      />
    </div>
  );
}
