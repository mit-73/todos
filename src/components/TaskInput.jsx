import React, { useState, useRef, useEffect } from 'react';
import { Send, Pin, PinOff, Shield, Star, Flame, X, Repeat, CalendarCheck } from 'lucide-react';

const TaskInput = ({ onAddTask, allTags, isDisabled }) => {
    const [inputValue, setInputValue] = useState('');
    const [pinMode, setPinMode] = useState('none');
    const [isImportant, setIsImportant] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [recurrence, setRecurrence] = useState('none');
    const [tagSuggestions, setTagSuggestions] = useState([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);
    const [highlightedTagIndex, setHighlightedTagIndex] = useState(0);

    const textareaRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [inputValue]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                textareaRef.current && !textareaRef.current.contains(event.target) &&
                suggestionsRef.current && !suggestionsRef.current.contains(event.target)
            ) {
                setShowTagSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const { value, selectionStart } = e.target;
        setInputValue(value);

        // Find the word the cursor is currently in or at the end of
        const textBeforeCursor = value.slice(0, selectionStart);
        const lastWordStartIndex = textBeforeCursor.search(/#\S*$/);

        if (lastWordStartIndex !== -1) {
            const currentTagQuery = textBeforeCursor.slice(lastWordStartIndex + 1);
            const suggestions = allTags
                .map(([tag]) => tag)
                .filter(tag =>
                    tag.toLowerCase().startsWith(currentTagQuery.toLowerCase())
                );

            if (suggestions.length > 0) {
                setTagSuggestions(suggestions);
                setShowTagSuggestions(true);
                setHighlightedTagIndex(0);
            } else {
                setShowTagSuggestions(false);
            }
        } else {
            setShowTagSuggestions(false);
        }
    };

    const selectTagSuggestion = (selectedTag) => {
        if (!textareaRef.current) return;
        const { value, selectionStart } = textareaRef.current;

        const textBeforeCursor = value.slice(0, selectionStart);
        const lastWordStartIndex = textBeforeCursor.search(/#\S*$/);
        const textAfterCursor = value.slice(selectionStart);

        const newValue =
            value.slice(0, lastWordStartIndex) +
            '#' +
            selectedTag +
            ' ' +
            textAfterCursor;

        setInputValue(newValue);
        setShowTagSuggestions(false);

        setTimeout(() => {
            if (!textareaRef.current) return;
            const newCursorPosition = (value.slice(0, lastWordStartIndex) + '#' + selectedTag + ' ').length;
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
    };

    const handleKeyPress = (e) => {
        if (showTagSuggestions && tagSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedTagIndex(prev => (prev + 1) % tagSuggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedTagIndex(prev => (prev - 1 + tagSuggestions.length) % tagSuggestions.length);
                return;
            }
            if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey) {
                e.preventDefault();
                selectTagSuggestion(tagSuggestions[highlightedTagIndex]);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowTagSuggestions(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitTask();
        }
    };

    const submitTask = () => {
        if (inputValue.trim()) {
            onAddTask({
                text: inputValue.trim(),
                pinned: pinMode,
                urgency: isUrgent,
                importance: isImportant,
                recurrence: recurrence
            });
            setInputValue('');
            setPinMode('none');
            setIsUrgent(false);
            setIsImportant(false);
            setRecurrence('none');
        }
    };

    return (
        <div className="mt-6 pt-4 border-t border-light-text/10 dark:border-dark-text/10">
            <div className="relative">
                {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div ref={suggestionsRef} className="absolute bottom-full mb-2 w-full bg-light-surface dark:bg-dark-surface rounded-lg shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark z-10 max-h-48 overflow-y-auto">
                        <ul className="p-1">
                            {tagSuggestions.map((tag, index) => (
                                <li key={tag}>
                                    <button
                                        onClick={() => selectTagSuggestion(tag)}
                                        onMouseOver={() => setHighlightedTagIndex(index)}
                                        className={`w-full text-left px-3 py-2 rounded-md text-sm ${index === highlightedTagIndex
                                            ? 'bg-light-primary/20 dark:bg-dark-primary/20'
                                            : ''
                                            } hover:bg-light-primary/10 dark:hover:bg-dark-primary/10`}
                                    >
                                        #{tag}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    disabled={isDisabled}
                    placeholder="Добавить новую задачу..."
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none transition-colors resize-y min-h-[60px]"
                    rows="3"
                />
                <button
                    onClick={submitTask}
                    disabled={!inputValue.trim()}
                    className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all duration-150 ${inputValue.trim() ?
                        'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark active:shadow-neumorphic-inset-sm active:dark:shadow-neumorphic-inset-sm-dark text-light-primary' :
                        'text-light-text-muted dark:text-dark-text-muted cursor-not-allowed'}`}
                >
                    <Send size={20} />
                </button>
            </div>
            <div className="mt-3 flex justify-center items-center gap-4">
                <button onClick={() => setPinMode('none')} title="Pin: None" className={`p-2 rounded-full transition-all duration-150 ${pinMode === 'none' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                    <PinOff size={16} />
                </button>
                <button onClick={() => setPinMode('global')} title="Pin: Global" className={`p-2 rounded-full transition-all duration-150 ${pinMode === 'global' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                    <Shield size={16} />
                </button>
                <button onClick={() => setPinMode('local')} title="Pin: Local" className={`p-2 rounded-full transition-all duration-150 ${pinMode === 'local' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                    <Pin size={16} />
                </button>
                <div className="border-l h-6 border-light-text/20 dark:border-dark-text/20 mx-2"></div>
                <button onClick={() => setIsImportant(!isImportant)} title={`Mark as ${isImportant ? 'Not Important' : 'Important'}`} className={`p-2 rounded-full transition-all duration-150 ${isImportant ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-amber-500' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                    <Star size={16} className={`${isImportant ? 'fill-amber-400' : ''}`} />
                </button>
                <button onClick={() => setIsUrgent(!isUrgent)} title={`Mark as ${isUrgent ? 'Not Urgent' : 'Urgent'}`} className={`p-2 rounded-full transition-all duration-150 ${isUrgent ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-orange-500' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                    <Flame size={16} className={`${isUrgent ? 'fill-orange-500' : ''}`} />
                </button>
                <div className="border-l h-6 border-light-text/20 dark:border-dark-text/20 mx-2"></div>
                <div className="relative group">
                     <button title={`Recurrence: ${recurrence}`} className={`p-2 rounded-full transition-all duration-150 ${recurrence !== 'none' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-blue-500' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                         {recurrence === 'none' && <Repeat size={16} />}
                         {recurrence === 'daily' && <span className="text-xs font-bold">1d</span>}
                         {recurrence === 'weekly' && <span className="text-xs font-bold">1w</span>}
                         {recurrence === 'monthly' && <span className="text-xs font-bold">1m</span>}
                         {recurrence === 'yearly' && <span className="text-xs font-bold">1y</span>}
                     </button>
                     <select 
                         value={recurrence}
                         onChange={(e) => setRecurrence(e.target.value)}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     >
                         <option value="none">No Recurrence</option>
                         <option value="daily">Daily</option>
                         <option value="weekly">Weekly</option>
                         <option value="monthly">Monthly</option>
                         <option value="yearly">Yearly</option>
                     </select>
                </div>
            </div>
            <div className="text-xs text-light-text-muted dark:text-dark-text-muted mt-2 text-center">
                Press Enter to submit, Shift+Enter for new line
            </div>
        </div>
    );
};

export default TaskInput;
