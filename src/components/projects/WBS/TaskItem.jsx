import React, { useState } from 'react';
import { wbsService } from '../../../services/wbsService';

const TaskItem = ({ task, projectId, canEdit, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: task.Name,
        status: task.Status,
        percentComplete: task.PercentComplete || 0
    });

    const handleUpdate = async () => {
        try {
            await wbsService.updateTask(projectId, task.TaskID, editData);
            setIsEditing(false);
            onUpdate();
        } catch (err) {
            console.error('Error updating task:', err);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await wbsService.deleteTask(projectId, task.TaskID);
            onUpdate();
        } catch (err) {
            console.error('Error deleting task:', err);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 p-2 border rounded bg-blue-50">
                <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="flex-grow p-1 border rounded text-sm"
                />
                <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="p-1 border rounded text-sm"
                >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                </select>
                <input
                    type="number"
                    value={editData.percentComplete}
                    onChange={(e) => setEditData({ ...editData, percentComplete: parseInt(e.target.value) })}
                    className="w-16 p-1 border rounded text-sm"
                    min="0"
                    max="100"
                />
                <button onClick={handleUpdate} className="text-green-600 hover:text-green-800 text-sm font-bold">✓</button>
                <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700 text-sm">✕</button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group border border-transparent hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-3 flex-grow">
                <div className={`w-2 h-2 rounded-full ${task.Status === 'Completed' ? 'bg-green-500' :
                        task.Status === 'In Progress' ? 'bg-blue-500' :
                            task.Status === 'Blocked' ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                <span className={`text-sm text-gray-700 ${task.Status === 'Completed' ? 'line-through text-gray-400' : ''}`}>
                    {task.Name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(task.Status)}`}>
                    {task.Status}
                </span>
                {task.PercentComplete > 0 && (
                    <span className="text-xs text-gray-500">
                        {task.PercentComplete}%
                    </span>
                )}
                {task.AssignedToName && (
                    <span className="text-xs flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        👤 {task.AssignedToName}
                    </span>
                )}
            </div>

            {canEdit && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                    >
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className="text-red-600 hover:text-red-800 text-xs"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default TaskItem;
