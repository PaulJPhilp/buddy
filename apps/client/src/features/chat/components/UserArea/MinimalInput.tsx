import React, { useRef, useState, forwardRef } from 'react';
import { PaperclipIcon, SendIcon } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { ToolBar, type ToolBarItem } from '@ui/components/ui/toolbar';
import { Button } from '@ui/components/ui/button';
import { Textarea } from '@ui/components/ui/textarea';

export interface MinimalInputProps {
  onSendMessage: (text: string) => void;
  onAttachFiles?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  primaryColor?: string;
  secondaryColor?: string;
  activePrimaryColor?: string;
  activeSecondaryColor?: string;
  toolbarConfig?: ToolBarItem[];
}

const MinimalInput = forwardRef<HTMLTextAreaElement, MinimalInputProps>(({
  onSendMessage,
  onAttachFiles,
  disabled,
  placeholder = 'Type a message...',
  className,
  primaryColor,
  secondaryColor,
  activePrimaryColor,
  activeSecondaryColor,
  toolbarConfig,
}, ref) => {
  const [text, setText] = useState('');


  const handleSubmit = () => {
    const trimmedText = text.trim();
    if (!trimmedText || disabled) return;
    
    onSendMessage(trimmedText);
    setText('');
    if (ref && 'current' in ref && ref.current) {
      ref.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Default toolbar items
  const defaultToolbarItems: ToolBarItem[] = [
    ...(onAttachFiles ? [{
      id: 'attach',
      icon: <PaperclipIcon className="h-4 w-4" />,
      action: onAttachFiles,
      tooltip: 'Attach files',
      disabled: disabled,
    } as ToolBarItem] : []),
    { id: 'spacer', type: 'spacer-expand' } as ToolBarItem,
    {
      id: 'send',
      icon: <SendIcon className="h-4 w-4" />,
      action: handleSubmit,
      tooltip: 'Send message',
      disabled: disabled || !text.trim(),
      intent: 'primary',
    } as ToolBarItem,
  ];

  const toolbarItems = toolbarConfig || defaultToolbarItems;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[80px] resize-none"
        aria-label="Message input"
        ref={ref}
      />
      <ToolBar
        commands={toolbarItems}
        variant="tiny"
        className="w-full justify-end bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75"
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        activePrimaryColor={activePrimaryColor}
        activeSecondaryColor={activeSecondaryColor}
        ariaLabel="Message input toolbar"
      />
    </div>
  );
})

export default MinimalInput;

MinimalInput.displayName = 'MinimalInput';
