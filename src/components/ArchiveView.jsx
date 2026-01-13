import React, { useState } from 'react';
import { Archive, Trash2, Check, Eye, EyeOff } from 'lucide-react';
import { formatDate, renderTextWithLinks } from '../utils/formatters';
import { checkIsNsfw } from '../utils/helpers';

const ArchiveView = ({
    archivedTasks,
    onRestore,
    onDelete,
    nsfwTagList,
    locale,
    onTagClick
}) => {
    const [revealedNsfw, setRevealedNsfw] = useState({});

    return (
        <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6">
            <div className="mb-4">
                <p className="text-light-text-muted dark:text-dark-text-muted">
                    Archived - {archivedTasks.length} tasks
                </p>
            </div>
            {archivedTasks.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-light-text-muted dark:text-dark-text-muted mb-4">
                        <Archive size={48} className="mx-auto" />
                    </div>
                    <p className="text-light-text-muted dark:text-dark-text-muted">No archived tasks yet.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {[...archivedTasks]
                        .sort((a, b) => new Date(b.archivedAt) - new Date(a.archivedAt))
                        .map((task) => {
                            const isNsfw = checkIsNsfw(task.text, nsfwTagList);
                            const isRevealed = revealedNsfw[task.id];

                            return (
                                <li
                                    key={task.id}
                                    className="flex items-start justify-between p-4 rounded-xl shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark"
                                >
                                    <div className="flex items-start space-x-3 flex-1">
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                                            <button
                                                onClick={() => onRestore(task)}
                                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 mt-1 flex-shrink-0 ${task.completed
                                                        ? 'shadow-neumorphic-inset-sm dark:shadow-neumorphic-inset-sm-dark text-light-primary dark:text-dark-primary'
                                                        : 'shadow-neumorphic-outset-sm dark:shadow-neumorphic-outset-sm-dark'
                                                    }`}
                                            >
                                                {task.completed && <Check size={16} />}
                                            </button>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {isNsfw && !isRevealed ? (
                                                <span className="text-light-text-muted dark:text-dark-text-muted italic">Content hidden</span>
                                            ) : (
                                                <>
                                                    <span
                                                        className={`${task.completed ?
                                                                'text-light-text-muted dark:text-dark-text-muted line-through' :
                                                                ''
                                                            } whitespace-pre-wrap break-all`}
                                                    >
                                                        {renderTextWithLinks(task.text, onTagClick)}
                                                    </span>
                                                    {(task.pinned === 'none' || task.pinned === 'local') && task.dueDate && (
                                                        <div className="text-xs text-light-text-muted dark:text-dark-text-muted mt-1">
                                                            Due: {formatDate(task.dueDate, locale)}
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
                                    <div className="flex items-start space-x-2 ml-2">
                                        {isNsfw && (
                                            <button
                                                onClick={() => setRevealedNsfw(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                                                className="text-light-text-muted dark:text-dark-text-muted hover:text-light-text dark:hover:text-dark-text transition-colors mt-1"
                                                title={isRevealed ? "Hide content" : "Show content"}
                                            >
                                                {isRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        )}
                                        {(!isNsfw || isRevealed) && (
                                            <button
                                                onClick={() => onDelete(task.id)}
                                                className="text-light-text-muted dark:text-dark-text-muted hover:text-light-danger dark:hover:text-dark-danger transition-colors mt-1"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                </ul>
            )}
        </div>
    );
};

export default ArchiveView;
