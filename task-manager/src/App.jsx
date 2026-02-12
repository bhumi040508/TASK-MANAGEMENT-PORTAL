import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Kanban, Plus, Trash2, X, Search, Edit3, BarChart3 } from 'lucide-react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

// 1. COLORS & STYLES
const getPriorityStyle = (priority) => {
  switch (priority) {
    case 'High': return 'bg-red-50 text-red-600 border-red-100';
    case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'Low': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    default: return 'bg-slate-50 text-slate-500 border-slate-100';
  }
};
const CHART_COLORS = ['#6366f1', '#f59e0b', '#10b981'];

// 2. DRAGGABLE CARD
function DraggableCard({ task, deleteTask, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-3 group cursor-grab active:cursor-grabbing hover:border-blue-400 transition-all">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-bold text-slate-700 leading-tight">{task.title}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onEdit(task)} className="text-blue-400 hover:text-blue-600 p-1"><Edit3 size={14} /></button>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={() => deleteTask(task.id)} className="text-red-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
        </div>
      </div>
      {task.description && <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
        <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">#{task.id.toString().slice(-4)}</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getPriorityStyle(task.priority)}`}>{task.priority}</span>
      </div>
    </div>
  );
}

// 3. DROPPABLE COLUMN
function Column({ id, title, tasks, deleteTask, onEdit }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-[0.2em]">{title}</h3>
        <span className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="bg-slate-200/40 border-2 border-dashed border-slate-300 rounded-[2rem] p-3 flex-1 overflow-y-auto min-h-[450px]">
        {tasks.map((task) => <DraggableCard key={task.id} task={task} deleteTask={deleteTask} onEdit={onEdit} />)}
        {tasks.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale">
            <Plus size={40} strokeWidth={1} />
            <p className="text-[10px] font-bold uppercase tracking-widest mt-2">No tasks added yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// 4. MAIN APP
export default function App() {
  const [view, setView] = useState('board');
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('taskflow_final')) || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "", priority: "Medium" });

  useEffect(() => localStorage.setItem('taskflow_final', JSON.stringify(tasks)), [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && ['To Do', 'In Progress', 'Done'].includes(over.id)) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: over.id } : t));
    }
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...formData } : t));
    } else {
      setTasks([...tasks, { ...formData, id: Date.now(), status: "To Do" }]);
    }
    setIsModalOpen(false);
    setFormData({ title: "", description: "", priority: "Medium" });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const chartData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'To Do').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Done', value: tasks.filter(t => t.status === 'Done').length },
  ];

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-8 pb-12 text-2xl font-black tracking-tighter text-blue-500 italic">TASKFLOW</div>
        <nav className="p-4 space-y-2 flex-1 font-semibold text-sm">
          <div onClick={() => setView('board')} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${view === 'board' ? 'bg-blue-600 shadow-lg shadow-blue-600/20 text-white' : 'text-slate-500 hover:bg-slate-800'}`}>
            <Kanban size={18}/> Board View
          </div>
          <div onClick={() => setView('analytics')} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${view === 'analytics' ? 'bg-blue-600 shadow-lg shadow-blue-600/20 text-white' : 'text-slate-500 hover:bg-slate-800'}`}>
            <BarChart3 size={18}/> Analytics
          </div>
        </nav>
        <div className="p-6 border-t border-slate-800">
            <div className="bg-slate-800 p-4 rounded-2xl text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">LoggedIn as Guest</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex items-center justify-between shrink-0 z-10">
          <div className="relative w-[400px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input type="text" placeholder="Search anything..." className="w-full bg-slate-100/50 border border-slate-200 pl-12 pr-4 py-3 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button onClick={() => { setEditingTask(null); setFormData({title:"", description:"", priority:"Medium"}); setIsModalOpen(true); }} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-500/30 active:scale-95 transition-all">
            <Plus size={18} strokeWidth={4} /> New Task
          </button>
        </header>

        {/* Dynamic Views */}
        <div className="flex-1 overflow-hidden">
          {view === 'board' ? (
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
              <div className="h-full p-10 flex gap-8 overflow-x-auto bg-slate-50">
                {['To Do', 'In Progress', 'Done'].map((col) => (
                  <Column key={col} id={col} title={col} tasks={filteredTasks.filter(t => t.status === col)} deleteTask={(id) => setTasks(t => t.filter(x => x.id !== id))} onEdit={(t) => { setEditingTask(t); setFormData({title:t.title, description:t.description || "", priority:t.priority}); setIsModalOpen(true); }} />
                ))}
              </div>
            </DndContext>
          ) : (
            <div className="h-full p-12 overflow-y-auto">
              <div className="flex justify-between items-end mb-10">
                <div>
                    <p className="text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">Workspace Statistics</p>
                    <h2 className="text-4xl font-black tracking-tight">Analytics Dashboard</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 h-[450px]">
                   <h3 className="font-black text-slate-800 mb-8 uppercase text-xs tracking-widest">Status Distribution</h3>
                   <ResponsiveContainer width="100%" height="90%">
                      <RePieChart>
                        <Pie data={chartData} innerRadius={90} outerRadius={125} paddingAngle={8} dataKey="value">
                          {chartData.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                        <Legend iconType="circle" />
                      </RePieChart>
                   </ResponsiveContainer>
                </div>
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 h-[450px]">
                   <h3 className="font-black text-slate-800 mb-8 uppercase text-xs tracking-widest">Active Task Counts</h3>
                   <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                          {chartData.map((e, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* THE SMART MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{editingTask ? "Edit Details" : "Create Task"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:bg-red-50 hover:text-red-500 p-3 rounded-full transition-all"><X size={24}/></button>
            </div>
            <div className="p-10 space-y-8">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">Task Headline</label>
                <input autoFocus className="w-full border-2 border-slate-100 p-5 rounded-[1.5rem] focus:border-blue-500 outline-none transition-all font-bold text-lg shadow-sm" placeholder="e.g. Design API structure" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} onKeyDown={handleKeyDown} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">Detailed Description</label>
                <textarea rows="4" className="w-full border-2 border-slate-100 p-5 rounded-[1.5rem] focus:border-blue-500 outline-none transition-all font-medium resize-none shadow-sm text-sm" placeholder="Add specific details or instructions..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} onKeyDown={handleKeyDown} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">Set Priority</label>
                <select className="w-full border-2 border-slate-100 p-5 rounded-[1.5rem] focus:border-blue-500 outline-none bg-white font-black uppercase text-xs tracking-widest shadow-sm cursor-pointer" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-50 rounded-[1.5rem] transition-all">Discard</button>
                <button onClick={handleSave} className="flex-1 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-blue-600 shadow-2xl shadow-blue-500/40 transition-all active:scale-95">
                  {editingTask ? "Update Record" : "Add to Board"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}