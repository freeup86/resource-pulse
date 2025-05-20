// ScenarioCheckbox.jsx
import React, { useCallback, useRef } from 'react';

const ScenarioCheckbox = ({
  isChecked,
  onChange,
  id
}) => {
  // Use a ref for the container element
  const containerRef = useRef(null);

  const stopPropagation = useCallback((e) => {
    if (!e) return;

    // Aggressively stop event propagation
    e.stopPropagation();
    e.preventDefault();
    if (e.nativeEvent) {
      e.nativeEvent.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      e.nativeEvent.preventDefault();
    }
    return false;
  }, []);

  const handleChange = useCallback((e) => {
    // Prevent event from propagating up
    stopPropagation(e);

    // Call the parent's onChange handler with the ID
    onChange(id);

    return false;
  }, [id, onChange, stopPropagation]);

  // Position the container to intercept click events
  // We'll use a div that covers the whole checkbox cell area
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onClick={handleChange}
      onMouseDown={stopPropagation}
      onMouseUp={stopPropagation}
      onDoubleClick={stopPropagation}
    >
      <div
        className="absolute inset-0"
        onClick={handleChange}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
      />

      <label
        className="relative z-10 flex h-5 w-5 items-center justify-center"
        onClick={handleChange}
        onMouseDown={stopPropagation}
        onMouseUp={stopPropagation}
      >
        <input
          type="checkbox"
          checked={isChecked}
          className="h-4 w-4 text-blue-600 cursor-pointer"
          onChange={handleChange}
          onClick={stopPropagation}
          style={{ pointerEvents: 'none' }}
        />
      </label>
    </div>
  );
};

export default ScenarioCheckbox;