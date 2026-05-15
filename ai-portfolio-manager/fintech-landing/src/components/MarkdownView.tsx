import React from 'react';

export default function MarkdownView({ content }: { content: string }) {
  if (!content) return null;

  const renderText = (text: string) => {
    // Basic bold **text** parsing
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(<ul key={`list-${elements.length}`} className="mb-4 space-y-1.5 ml-1">{listItems}</ul>);
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle empty lines
    if (line.trim() === '') {
      flushList();
      elements.push(<div key={`space-${i}`} className="h-2" />);
      continue;
    }

    // Handle horizontal rules
    if (line.startsWith('---')) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="border-white/10 my-6" />);
      continue;
    }

    // Handle Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={i} className="text-white text-md font-semibold mt-4 mb-2">{renderText(line.slice(4))}</h3>);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={i} className="text-gold text-lg font-bold mt-5 mb-3">{renderText(line.slice(3))}</h2>);
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={i} className="text-white text-xl font-bold mt-6 mb-4">{renderText(line.slice(2))}</h1>);
      continue;
    }

    // Handle Lists
    if (line.startsWith('- ') || line.match(/^\d+\.\s/)) {
      inList = true;
      const isBullet = line.startsWith('- ');
      const text = isBullet ? line.slice(2) : line.replace(/^\d+\.\s/, '');
      listItems.push(
        <li key={i} className="flex gap-2.5 items-start text-sm text-white/70 leading-relaxed">
          <span className="text-gold/50 mt-0.5">{isBullet ? '•' : line.match(/^\d+\./)?.[0]}</span>
          <span>{renderText(text)}</span>
        </li>
      );
      continue;
    }

    // Paragraph
    flushList();
    elements.push(<p key={i} className="text-white/70 text-sm leading-relaxed mb-1.5">{renderText(line)}</p>);
  }
  
  flushList();

  return <div className="markdown-view">{elements}</div>;
}
