import React from 'react';
import { Play, Square, X, Terminal, CheckCircle2, Clock } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';

export const TasksModal: React.FC = () => {
  const isModalOpen = useTaskStore((state) => state.isModalOpen);
  const closeModal = useTaskStore((state) => state.closeModal);
  const tasks = useTaskStore((state) => state.tasks);
  const activeTaskIds = useTaskStore((state) => state.activeTaskIds);
  const runTask = useTaskStore((state) => state.runTask);
  const stopTask = useTaskStore((state) => state.stopTask);

  if (!isModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onCloseModal}
    >
      <div
        style={{
          width: '580px',
          maxHeight: '75vh',
          backgroundColor: 'var(--xivig-bg, #12141a)',
          border: '1px solid var(--xivig-border, #2c313d)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: 'var(--xivig-text, #e5e7eb)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--xivig-border, #2c313d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} style={{ color: 'var(--xivig-accent, #6c8cff)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Run Task</h2>
          </div>
          <button
            onClick={closeModal}
            style={{ background: 'none', border: 'none', color: 'var(--xivig-text-dim, #646b7a)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--xivig-text-dim, #646b7a)', fontSize: '13px' }}>
              No tasks configured in <code>.xivig/tasks.json</code> or <code>.vscode/tasks.json</code>.
            </div>
          ) : (
            tasks.map((task) => {
              const isRunning = activeTaskIds.some((id) => id.startsWith(task.label));

              return (
                <div
                  key={task.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--xivig-surface, #1d2028)',
                    border: '1px solid var(--xivig-border, #2c313d)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{task.label}</span>
                      {task.group?.kind && (
                        <span style={{ fontSize: '10px', backgroundColor: 'rgba(108, 140, 255, 0.15)', color: '#6c8cff', padding: '1px 5px', borderRadius: '3px' }}>
                          {task.group.kind}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--xivig-text-dim, #646b7a)', fontFamily: 'monospace', marginTop: '2px' }}>
                      {task.command} {(task.args || []).join(' ')}
                    </div>
                  </div>

                  <div>
                    {isRunning ? (
                      <button
                        onClick={() => {
                          const matchingId = activeTaskIds.find((id) => id.startsWith(task.label));
                          if (matchingId) stopTask(matchingId);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        <Square size={12} fill="#fff" />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => runTask(task)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        <Play size={12} fill="#fff" />
                        Run
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  function onCloseModal() {
    closeModal();
  }
};
