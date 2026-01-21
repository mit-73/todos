import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Check, Trash2, Eye, EyeOff, Star, Flame, Shield, Pin, PinOff, Repeat, X } from 'lucide-react';
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
    const [editValue, setEditValue] = useState(task.value ?? null);
    const [editEffort, setEditEffort] = useState(task.effort ?? null);
    const [editPinMode, setEditPinMode] = useState(task.pinned || 'none');
    const [editImportance, setEditImportance] = useState(!!task.importance);
    const [editUrgency, setEditUrgency] = useState(!!task.urgency);
    const [isRevealed, setIsRevealed] = useState(false);
    const editInputRef = useRef(null);

    const isNsfw = checkIsNsfw(task.text, nsfwTagList);

    useEffect(() => {
        if (isEditing) {
            setEditText(task.text);
            setEditRecurrence(task.recurrence || 'none');
            setEditValue(task.value ?? null);
            setEditEffort(task.effort ?? null);
            setEditPinMode(task.pinned || 'none');
            setEditImportance(!!task.importance);
            setEditUrgency(!!task.urgency);
            if (editInputRef.current) {
                editInputRef.current.focus();
            }
        }
    }, [isEditing, task]);

    useEffect(() => {
        if (editInputRef.current) {
            editInputRef.current.style.height = 'auto';
            editInputRef.current.style.height = editInputRef.current.scrollHeight + 'px';
        }
    }, [editText, isEditing]);

    const handleSave = () => {
        if (editText.trim() !== '') {
            const val = (editValue === null || editValue === undefined) ? null : parseInt(editValue, 10);
            const eff = (editEffort === null || editEffort === undefined) ? null : parseInt(editEffort, 10);

            if (onUpdateTask) {
                onUpdateTask({
                    ...task,
                    text: editText.trim(),
                    recurrence: editRecurrence,
                    value: val,
                    effort: eff,
                    pinned: editPinMode,
                    importance: editImportance,
                    urgency: editUrgency
                });
            } else {
                // Fallback for components that don't pass onUpdateTask
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
                {!isEditing && (
                    isArchived ? (
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
                    )
                )}

                <div className="flex-1 min-w-0" onDoubleClick={() => !isArchived && setIsEditing(true)}>
                    {isEditing ? (
                        <div className="w-full">
                            <div className="mb-3 flex flex-wrap justify-start items-center gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={editValue ?? ''}
                                    onChange={(e) => {
                                        const next = e.target.value === '' ? null : Math.max(1, Math.min(10, parseInt(e.target.value, 10)));
                                        setEditValue(Number.isNaN(next) ? null : next);
                                    }}
                                    className="w-16 px-2 py-0.5 text-xs rounded-lg bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none"
                                    placeholder="Value"
                                />
                                <span className="text-light-text-muted dark:text-dark-text-muted">|</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={editEffort ?? ''}
                                    onChange={(e) => {
                                        const next = e.target.value === '' ? null : Math.max(1, Math.min(10, parseInt(e.target.value, 10)));
                                        setEditEffort(Number.isNaN(next) ? null : next);
                                    }}
                                    className="w-16 px-2 py-0.5 text-xs rounded-lg bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none"
                                    placeholder="Effort"
                                />
                                {(editValue !== null || editEffort !== null) && (
                                    <span
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full bg-light-surface dark:bg-dark-surface text-light-text-muted dark:text-dark-text-muted shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark"
                                        title={editValue !== null && editEffort !== null && editEffort !== 0 ? `Value/Effort = ${(editValue / editEffort).toFixed(2)}` : 'Заполните оба поля'}
                                    >
                                        =&gt; {editValue !== null && editEffort !== null && editEffort !== 0
                                            ? (editValue / editEffort).toFixed(2)
                                            : '—'}
                                        <button
                                            onClick={() => { setEditValue(null); setEditEffort(null); }}
                                            className="-mr-1 p-0.5 rounded-full hover:bg-light-bg/70 dark:hover:bg-dark-bg/70 transition-colors"
                                            title="Сбросить оба"
                                            aria-label="Сбросить значения ценности и усилия"
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <textarea
                                    ref={editInputRef}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full px-4 py-3 rounded-xl bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark focus:outline-none transition-colors resize-y min-h-[60px]"
                                    rows="3"
                                />
                            </div>
                            <div className="mt-2 mb-4 flex justify-center items-center gap-4">
                                <button onClick={() => setEditPinMode('none')} title="Pin: None" className={`p-2 rounded-full transition-all duration-150 ${editPinMode === 'none' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                                    <PinOff size={16} />
                                </button>
                                <button onClick={() => setEditPinMode('global')} title="Pin: Global" className={`p-2 rounded-full transition-all duration-150 ${editPinMode === 'global' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                                    <Shield size={16} />
                                </button>
                                <button onClick={() => setEditPinMode('local')} title="Pin: Local" className={`p-2 rounded-full transition-all duration-150 ${editPinMode === 'local' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                                    <Pin size={16} />
                                </button>
                                <div className="border-l h-6 border-light-text/20 dark:border-dark-text/20 mx-2"></div>
                                <button onClick={() => setEditImportance(!editImportance)} title={`Mark as ${editImportance ? 'Not Important' : 'Important'}`} className={`p-2 rounded-full transition-all duration-150 ${editImportance ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-amber-500' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                                    <Star size={16} className={`${editImportance ? 'fill-amber-400' : ''}`} />
                                </button>
                                <button onClick={() => setEditUrgency(!editUrgency)} title={`Mark as ${editUrgency ? 'Not Urgent' : 'Urgent'}`} className={`p-2 rounded-full transition-all duration-150 ${editUrgency ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-orange-500' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                                    <Flame size={16} className={`${editUrgency ? 'fill-orange-500' : ''}`} />
                                </button>
                                <div className="border-l h-6 border-light-text/20 dark:border-dark-text/20 mx-2"></div>
                                <div className="relative group">
                                    <button title={`Recurrence: ${editRecurrence}`} className={`p-2 rounded-full transition-all duration-150 ${editRecurrence !== 'none' ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-blue-500' : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'}`}>
                                        {editRecurrence === 'none' && <Repeat size={16} />}
                                        {editRecurrence === 'daily' && <span className="text-xs font-bold">1d</span>}
                                        {editRecurrence === 'weekly' && <span className="text-xs font-bold">1w</span>}
                                        {editRecurrence === 'monthly' && <span className="text-xs font-bold">1m</span>}
                                        {editRecurrence === 'yearly' && <span className="text-xs font-bold">1y</span>}
                                    </button>
                                    <select
                                        value={editRecurrence}
                                        onChange={(e) => setEditRecurrence(e.target.value)}
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
                            <div className="flex gap-2 mt-2 items-center justify-end flex-wrap">
                                <button onClick={() => { setIsEditing(false); setEditText(task.text); setEditRecurrence(task.recurrence || 'none'); setEditValue(task.value ?? null); setEditEffort(task.effort ?? null); setEditPinMode(task.pinned || 'none'); setEditImportance(!!task.importance); setEditUrgency(!!task.urgency); }} className="px-3 py-1 rounded-xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all">Cancel</button>
                                <button onClick={handleSave} className="px-3 py-1 rounded-xl font-semibold text-light-primary dark:text-dark-primary shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark active:shadow-neumorphic-inset active:dark:shadow-neumorphic-inset-dark transition-all">Save</button>
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
                            {task.value && task.effort && (
                                <div className="mt-1 inline-block">
                                    <div className="flex items-center gap-2 px-2 py-0.5 rounded-md text-xs font-medium bg-light-surface dark:bg-dark-surface shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark border border-light-text/5 dark:border-dark-text/5">
                                        <span className="text-green-600 dark:text-green-400">V:{task.value}</span>
                                        <span className="text-light-text-muted dark:text-dark-text-muted">|</span>
                                        <span className="text-red-600 dark:text-red-400">E:{task.effort}</span>
                                        <span className="text-light-text-muted dark:text-dark-text-muted">=&gt;</span>
                                        <span className="text-blue-600 dark:text-blue-400">{(task.value / task.effort).toFixed(2)}</span>
                                    </div>
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
