import React, { useState } from 'react';
import { wbsService } from '../../../services/wbsService';
import TaskItem from './TaskItem';

const PhaseItem = ({ phase, tasks, projectId, canEdit, onUpdate }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');

    const handleDeletePhase = async () => {
        if (!window.confirm('Delete this phase and all its tasks?')) return;
        try {
            await wbsService.deletePhase(projectId, phase.PhaseID);
            onUpdate();
        } catch (err) {
            console.error('Error deleting phase:', err);
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            await wbsService.createTask(projectId, {
                phaseId: phase.PhaseID,
                name: newTaskName,
                order: tasks.length + 1,
                status: 'Not Started'
            });
            setNewTaskName('');
            setShowAddTask(false);
            onUpdate();
        } catch (err) {
            console.error('Error creating task:', err);
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-100 p-3 flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                        <svg
                            className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <h3 className="font-semibold text-gray-800">{phase.Name}</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {tasks.length} tasks
                    </span>
                </div>

                {canEdit && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddTask(true)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            + Add Task
                        </button>
                        <button
                            onClick={handleDeletePhase}
                            className="text-red-600 hover:text-red-800 text-sm"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {isExpanded && (
                <div className="bg-white p-4">
                    {showAddTask && (
                        <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
                            <input
                                type="text"
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                className="flex-grow p-2 border rounded text-sm"
                                placeholder="Task name..."
                                autoFocus
                                required
                            />
                            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Add</button>
                            <button
                                type="button"
                                onClick={() => setShowAddTask(false)}
                                className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                            >
                                Cancel
                            </button>
                        </form>
                    )}

                    <div className="space-y-2">
                        {tasks.length === 0 ? (
                            <p className="text-sm text-gray-400 italic pl-2">No tasks in this phase.</p>
                        ) : (
                            tasks.map(task => (
                                <TaskItem
                                    key={task.TaskID}
                                    task={task}
                                    projectId={projectId}
                                    canEdit={canEdit}
                                    onUpdate={onUpdate}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhaseItem;
