import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Check, Trash2, Eye, EyeOff, Star, Flame, Shield, Pin, PinOff, Repeat } from 'lucide-react';
import { formatDate, renderTextWithLinks } from '../utils/formatters';
import { checkIsNsfw } from '../utils/helpers';

const TaskItem = forwardRef(({ 
  task, 
  onToggleComplete, 
  onSaveEdit, 
  onDelete, 
  onToggleImportance, 
  onToggleUrgency, 
  onUpdatePinMode,
  onUpdateTask,
  nsfwTagList, 
  locale,
  onTagClick,
  isArchived = false,
  onRestore,
  ...props
}, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editRecurrence, setEditRecurrence] = useState(task.recurrence || 'none');
  const [isRevealed, setIsRevealed] = useState(false);
  const editInputRef = useRef(null);
  
  const isNsfw = checkIsNsfw(task.text, nsfwTagList);
  
  useEffect(() => {
    if (isEditing) {
        setEditText(task.text);
        setEditRecurrence(task.recurrence || 'none');
        if (editInputRef.current) {
             editInputRef.current.focus();
        }
    }
  }, [isEditing, task]);

  const handleSave = () => {
    if (editText.trim() !== '') {
        if (onUpdateTask && editRecurrence !== task.recurrence) {
             onUpdateTask({ ...task, text: editText.trim(), recurrence: editRecurrence });
        } else {
             onSaveEdit(task.id, editText.trim());
        }
        setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSave();
      } else if (e.key === 'Escape') {
          setIsEditing(false);
          setEditText(task.text);
      }
  };

  const contentHidden = isNsfw && !isRevealed;

  return (
    <li 
      ref={ref}
      {...props}
      className={`flex items-start justify-between p-4 rounded-xl transition-all duration-200 shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark ${task.pinned !== 'none' && !isArchived ? 'bg-light-primary/5 dark:bg-dark-primary/5' : ''} ${props.className || ''}`}
    >
      <div className="flex items-start space-x-3 flex-1">
         {/* Checkbox / Restore Button */}
         {isArchived ? (
            <button
                onClick={() => onRestore(task.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 mt-1 flex-shrink-0 ${task.completed ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary dark:text-dark-primary' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}
            >
                {task.completed && <Check size={16} />}
            </button>
         ) : (
            <button
                onClick={() => onToggleComplete(task.id)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 mt-1 flex-shrink-0 ${task.completed ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark bg-light-primary text-light-primary-text' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}
            >
                {task.completed && <Check size={16} />}
            </button>
         )}

         <div className="flex-1 min-w-0" onDoubleClick={() => !isArchived && setIsEditing(true)}>
            {isEditing ? (
                <div className="w-full">
                    <textarea 
                        ref={editInputRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 rounded-lg bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none resize-y"
                        rows="3"
                    />
                    <div className="flex gap-2 mt-2 items-center">
                        <button onClick={handleSave} className="px-3 py-1 rounded-xl font-semibold text-light-primary dark:text-dark-primary shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all">Save</button>
                        <button onClick={() => { setIsEditing(false); setEditText(task.text); }} className="px-3 py-1 rounded-xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all">Cancel</button>
                        
                        {!isArchived && onUpdateTask && (
                           <div className="ml-auto relative group">
                                <button className={`p-1.5 rounded-lg flex items-center gap-1 text-xs transition-all ${editRecurrence !== 'none' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-light-text-muted dark:text-dark-text-muted hover:bg-light-bg-secondary dark:hover:bg-dark-surface'}`}>
                                    <Repeat size={14} />
                                    <span className="capitalize">{editRecurrence === 'none' ? 'No Repeat' : editRecurrence}</span>
                                </button>
                                <select 
                                    value={editRecurrence}
                                    onChange={(e) => setEditRecurrence(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                >
                                    <option value="none">No Repeat</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                           </div>
                        )}
                    </div>
                </div>
            ) : contentHidden ? (
                <span className="text-light-text-muted dark:text-dark-text-muted italic">Content hidden</span>
            ) : (
                <>
                    <span className={`${task.completed ? 'text-light-text-muted dark:text-dark-text-muted line-through' : ''} whitespace-pre-wrap break-all`}>
                        {renderTextWithLinks(task.text, onTagClick)}
                    </span>
                    {(task.pinned === 'none' || task.pinned === 'local') && task.dueDate && (
                        <div className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1 flex items-center gap-2">
                            <span>Due: {formatDate(task.dueDate, locale)}</span>
                            {task.recurrence && task.recurrence !== 'none' && (
                                <span className="flex items-center gap-1 text-blue-500" title={`Repeats: ${task.recurrence}`}>
                                    <Repeat size={12} />
                                    <span className="capitalize">{task.recurrence}</span>
                                </span>
                            )}
                        </div>
                    )}
                    {task.pinned === 'global' && task.createdAt && (
                        <div className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                            Created: {formatDate(task.createdAt, locale)}
                        </div>
                    )}
                </>
            )}
         </div>
      </div>

      {!isEditing && (
        <div className="flex items-center space-x-1 ml-2 self-center">
             {isNsfw && (
                <button 
                  onClick={() => setIsRevealed(!isRevealed)}
                  className="p-1 rounded-full text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
                >
                    {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
             )}

             {(!isNsfw || isRevealed) && (
                 isArchived ? (
                    <button 
                        onClick={() => onDelete(task.id)}
                        className="text-light-text-muted dark:text-dark-text-muted hover:text-light-danger dark:hover:text-dark-danger transition-colors mt-1"
                    >
                        <Trash2 size={20} />
                    </button>
                 ) : (
                    <>
                        <button 
                            onClick={() => onToggleImportance(task.id)} 
                            className={`p-1 rounded-full transition-colors ${task.importance ? 'text-amber-500' : 'text-light-text-muted dark:text-dark-text-muted'}`}
                        >
                            <Star size={16} className={task.importance ? 'fill-amber-400' : 'fill-none'} />
                        </button>
                        <button 
                            onClick={() => onToggleUrgency(task.id)} 
                            className={`p-1 rounded-full transition-colors ${task.urgency ? 'text-orange-500' : 'text-light-text-muted dark:text-dark-text-muted'}`}
                        >
                            <Flame size={16} className={task.urgency ? 'fill-orange-500' : 'fill-none'} />
                        </button>
                        <div className="relative w-6 h-6 flex items-center justify-center">
                            <select 
                                value={task.pinned} 
                                onChange={(e) => onUpdatePinMode(task.id, e.target.value)} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                                <option value="none">None</option>
                                <option value="global">Global</option>
                                <option value="local">Local</option>
                            </select>
                            <div className="pointer-events-none">
                                {task.pinned === 'global' && <Shield size={16} />}
                                {task.pinned === 'local' && <Pin size={16} />}
                                {task.pinned === 'none' && <PinOff size={16} className="text-light-text-muted dark:text-dark-text-muted" />}
                            </div>
                        </div>
                    </>
                 )
             )}
        </div>
      )}
    </li>
  );
});

TaskItem.displayName = 'TaskItem';

export default TaskItem;
