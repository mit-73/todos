import React from 'react';

export const formatDate = (date, locale = 'en-US', options = {}) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString(locale, options);
};

export const renderTextWithLinks = (text, setSelectedTag) => {
  const regex = /(https?:\/\/[^\s]+|#\w+)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;
    if (part.startsWith('http')) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-light-primary dark:text-dark-primary hover:underline break-all"
        >
          {part}
        </a>
      );
    }
    if (part.startsWith('#')) {
      const tag = part.substring(1);
      return (
        <button
          key={index}
          onClick={(e) => {
             e.stopPropagation();
             setSelectedTag(tag);
          }}
          className="bg-light-primary/10 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary px-1.5 py-0.5 rounded-md text-sm mx-0.5 font-medium transition-colors hover:bg-light-primary/20 dark:hover:bg-dark-primary/20"
        >
          {part}
        </button>
      );
    }
    return part;
  });
};
