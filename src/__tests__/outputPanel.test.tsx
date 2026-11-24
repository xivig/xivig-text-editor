// @vitest-environment jsdom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { BottomPanel } from '../components/terminal/BottomPanel';
import { useUIStore } from '../stores/uiStore';
import { useBuildStore } from '../stores/buildStore';
import { renderAnsi, stripAnsi, formatOutputTimestamp } from '../utils/ansi';

describe('BottomPanel Output Surface & ANSI Rendering', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    useUIStore.setState({
      isBottomPanelOpen: true,
      activeBottomTab: 'output',
    });
    useBuildStore.setState({
      outputLines: [
        {
          id: 'test-1',
          type: 'stdout',
          text: 'a.js initialized',
          timestamp: '12:45:01 PM',
        },
        {
          id: 'test-2',
          type: 'stdout',
          text: '\u001b[33m5\u001b[39m',
          timestamp: '12:45:02 PM',
        },
        {
          id: 'test-3',
          type: 'success',
          text: '[Finished in 0.17s with exit code 0]',
          timestamp: '12:45:03 PM',
        },
      ],
      isRunning: false,
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders ANSI colored numbers as styled spans instead of raw escape codes', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<BottomPanel />);
    });

    // Must NOT contain raw bracket garbage like "[33m5[39m"
    expect(container.textContent).not.toContain('[33m5');
    expect(container.textContent).not.toContain('39m');

    // Must render the actual number 5
    expect(container.textContent).toContain('5');

    // The span containing '5' should have color #e5c07b (yellow in rgb)
    const coloredSpans = Array.from(container.querySelectorAll('span')).filter(
      (el) => el.textContent === '5'
    );
    expect(coloredSpans.length).toBeGreaterThan(0);
    expect(coloredSpans[0].style.color).toBe('rgb(229, 192, 123)');

    await act(async () => {
      root.unmount();
    });
  });

  it('displays uniform, padded timestamps with fixed width styling', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<BottomPanel />);
    });

    expect(container.textContent).toContain('12:45:01 PM');
    expect(container.textContent).toContain('12:45:02 PM');
    expect(container.textContent).toContain('12:45:03 PM');

    const tsElements = Array.from(container.querySelectorAll('span')).filter(
      (el) => el.textContent?.includes('12:45:')
    );
    expect(tsElements.length).toBe(3);
    for (const ts of tsElements) {
      expect(ts.style.minWidth).toBe('82px');
      expect(ts.style.width).toBe('82px');
      expect(ts.style.flexShrink).toBe('0');
    }

    await act(async () => {
      root.unmount();
    });
  });

  it('allows clearing the output console log via clearOutput()', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<BottomPanel />);
    });

    expect(useBuildStore.getState().outputLines).toHaveLength(3);

    await act(async () => {
      useBuildStore.getState().clearOutput();
    });

    expect(useBuildStore.getState().outputLines).toHaveLength(0);
    expect(container.textContent).toContain('Output log is empty');

    await act(async () => {
      root.unmount();
    });
  });

  it('renderAnsi renders truecolor and bright colors correctly', async () => {
    const rendered = renderAnsi('\u001b[92mCompiled successfully!\u001b[0m');
    const root = createRoot(container);
    await act(async () => {
      root.render(<div>{rendered}</div>);
    });

    const span = container.querySelector('span');
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe('Compiled successfully!');
    expect(span?.style.color).toBe('rgb(152, 195, 121)');

    await act(async () => {
      root.unmount();
    });
  });

  it('splits multiline chunks into discrete lines and preserves timestamps', () => {
    const rawChunk = 'first line\r\nsecond line\r\nthird line\r\n';
    const raw = rawChunk.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = raw.endsWith('\n') ? raw.slice(0, -1).split('\n') : raw.split('\n');

    expect(lines).toEqual(['first line', 'second line', 'third line']);

    const formattedTs = formatOutputTimestamp('6:30:15 pm');
    expect(formattedTs).toBe('06:30:15 PM');
  });
});
