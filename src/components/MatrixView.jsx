import React, { useMemo } from 'react';
import TaskItem from './TaskItem';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const MatrixView = ({
    tasks,
    headerText,
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

    const matrixTasks = useMemo(() => {
        const sortByValueEffort = (taskList) => {
            return [...taskList].sort((t1, t2) => {
                const t1HasScores = (t1.value !== undefined && t1.value !== null) && (t1.effort !== undefined && t1.effort !== null);
                const t2HasScores = (t2.value !== undefined && t2.value !== null) && (t2.effort !== undefined && t2.effort !== null);
                
                // Tasks with scores come first
                if (t1HasScores && !t2HasScores) return -1;
                if (!t1HasScores && t2HasScores) return 1;
                
                // Both have scores: sort by index (Value/Effort) descending
                if (t1HasScores && t2HasScores) {
                    const idx1 = t1.value / t1.effort;
                    const idx2 = t2.value / t2.effort;
                    return idx2 - idx1;
                }
                
                // Neither has scores: keep original order
                return 0;
            });
        };

        return {
            doTasks: sortByValueEffort(tasks.filter(t => t.importance && t.urgency)),
            scheduleTasks: sortByValueEffort(tasks.filter(t => t.importance && !t.urgency)),
            delegateTasks: sortByValueEffort(tasks.filter(t => !t.importance && t.urgency)),
            eliminateTasks: sortByValueEffort(tasks.filter(t => !t.importance && !t.urgency)),
        };
    }, [tasks]);

    const handleDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const task = tasks.find(t => t.id.toString() === draggableId);
        if (!task) return;

        const updates = {};
        switch (destination.droppableId) {
            case 'Do':
                updates.importance = true;
                updates.urgency = true;
                break;
            case 'Schedule':
                updates.importance = true;
                updates.urgency = false;
                break;
            case 'Delegate':
                updates.importance = false;
                updates.urgency = true;
                break;
            case 'Eliminate':
                updates.importance = false;
                updates.urgency = false;
                break;
            default:
                return;
        }

        // Optimistic UI update or just call update
        if (onUpdateTask) {
             onUpdateTask({ ...task, ...updates });
        }
    };

    return (
        <div className="bg-light-surface dark:bg-dark-surface rounded-2xl shadow-neumorphic-outset dark:shadow-neumorphic-outset-dark p-6">
            <div className="mb-4">
                <p className="text-light-text-muted dark:text-dark-text-muted">
                    {headerText} - {tasks.length} tasks
                </p>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:h-lvh">
                    {[
                        { id: 'Do', title: 'Do', description: 'Urgent & Important', tasks: matrixTasks.doTasks, style: 'border-red-500/50' },
                        { id: 'Schedule', title: 'Schedule', description: 'Important & Not Urgent', tasks: matrixTasks.scheduleTasks, style: 'border-green-500/50' },
                        { id: 'Delegate', title: 'Delegate', description: 'Urgent & Not Important', tasks: matrixTasks.delegateTasks, style: 'border-blue-500/50' },
                        { id: 'Eliminate', title: 'Eliminate', description: 'Not Urgent & Not Important', tasks: matrixTasks.eliminateTasks, style: 'border-gray-500/50' },
                    ].map(({ id, title, description, tasks: groupTasks, style }) => (
                        <div
                            key={id}
                            className={`rounded-xl p-4 flex flex-col min-h-[50vh] md:min-h-0 md:h-full shadow-neumorphic-inset dark:shadow-neumorphic-inset-dark border-t-4 ${style}`}
                        >
                            <h4 className="font-bold text-lg">{title}</h4>
                            <p className="text-sm text-light-text-muted dark:text-dark-text-muted mb-4 flex-shrink-0">{description}</p>
                            <div className="overflow-y-auto h-full -mr-2 pr-2">
                                <Droppable droppableId={id}>
                                    {(provided) => (
                                        <ul
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="space-y-3 p-2 min-h-[100px]"
                                        >
                                            {(groupTasks || []).map((task, index) => (
                                                <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                    {(dragProvided) => (
                                                        <TaskItem
                                                            ref={dragProvided.innerRef}
                                                            {...dragProvided.draggableProps}
                                                            {...dragProvided.dragHandleProps}
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
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                            </div>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};


export default MatrixView;
