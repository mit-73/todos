import React from 'react';
import { Check } from 'lucide-react';
import TaskItem from './TaskItem';
import { formatDate } from '../utils/formatters';

const TaskList = ({ 
    tasks, 
    headerText, 
    selectedDate, 
    onToggleComplete, 
    onSaveEdit, 
    onDelete, 
    onToggleImportance, 
    onToggleUrgency, 
    onUpdatePinMode,
    onUpdateTask,
    nsfwTagList,
    locale,
    onTagClick
}) => {
    return (
        <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6">
            <div className="mb-4">
                <p className="text-light-text-muted dark:text-dark-text-muted">
                    {headerText} - {tasks.length} tasks
                </p>
            </div>
            {tasks.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-light-text-muted dark:text-dark-text-muted mb-4">
                        <Check size={48} className="mx-auto" />
                    </div>
                    <p className="text-light-text-muted dark:text-dark-text-muted">
                        No tasks for {formatDate(selectedDate, locale)}
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {tasks.map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onToggleComplete={onToggleComplete}
                            onSaveEdit={onSaveEdit}
                            onDelete={onDelete}
                            onToggleImportance={onToggleImportance}
                            onToggleUrgency={onToggleUrgency}
                            onUpdatePinMode={onUpdatePinMode}
                            onUpdateTask={onUpdateTask}
                            nsfwTagList={nsfwTagList}
                            locale={locale}
                            onTagClick={onTagClick}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
};

export default TaskList;
