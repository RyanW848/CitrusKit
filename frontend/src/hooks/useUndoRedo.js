import { useCallback, useEffect, useRef, useState } from "react";

export default function useUndoRedo(onExecute) {
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const onExecuteRef = useRef(onExecute);
  useEffect(() => { onExecuteRef.current = onExecute; }, [onExecute]);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const sync = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const push = useCallback((action) => {
    undoStack.current.push(action);
    if (undoStack.current.length > 20) undoStack.current.shift();
    redoStack.current = [];
    sync();
  }, [sync]);

  const undo = useCallback(async () => {
    const action = undoStack.current.pop();
    if (!action) return;
    sync();
    try {
      await action.undo();
      redoStack.current.push(action);
    } catch {
      // server state authoritative; refresh will correct any mismatch
    }
    sync();
    await onExecuteRef.current?.();
  }, [sync]);

  const redo = useCallback(async () => {
    const action = redoStack.current.pop();
    if (!action) return;
    sync();
    try {
      await action.redo();
      undoStack.current.push(action);
    } catch {
      // same as above
    }
    sync();
    await onExecuteRef.current?.();
  }, [sync]);

  return { push, undo, redo, canUndo, canRedo };
}
