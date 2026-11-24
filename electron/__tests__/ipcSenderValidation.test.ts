import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';

vi.mock('electron', () => {
  return {
    BrowserWindow: {
      fromWebContents: vi.fn(),
    },
    app: {
      getPath: vi.fn(() => 'C:\\temp'),
    },
  };
});

import { BrowserWindow } from 'electron';
import { validateIpcSender, getValidatedWindow, setExpectedRendererDist } from '../main/security';

describe('Security: IPC Sender Validation', () => {
  const originalEnv = process.env.VITE_DEV_SERVER_URL;
  const mockDevUrl = 'http://localhost:5173/';
  const mockDistPath = path.resolve('E:/0.2027-project/2/xivig-text-editor/dist');

  beforeEach(() => {
    setExpectedRendererDist(mockDistPath);
  });

  afterEach(() => {
    process.env.VITE_DEV_SERVER_URL = originalEnv;
    vi.restoreAllMocks();
  });

  it('rejects IPC events with missing sender or senderFrame', () => {
    const invalidEvent1 = { sender: null, senderFrame: null } as any;
    const invalidEvent2 = { sender: {} as any, senderFrame: null } as any;
    const invalidEvent3 = { sender: null, senderFrame: {} as any } as any;

    expect(validateIpcSender(invalidEvent1)).toBe(false);
    expect(validateIpcSender(invalidEvent2)).toBe(false);
    expect(validateIpcSender(invalidEvent3)).toBe(false);
  });

  it('rejects IPC events where webContents does not belong to an active BrowserWindow', () => {
    const dummyWebContents = {} as any;
    vi.spyOn(BrowserWindow, 'fromWebContents').mockReturnValue(null);

    const event = {
      sender: dummyWebContents,
      senderFrame: { url: 'http://localhost:5173' },
    } as any;

    expect(validateIpcSender(event)).toBe(false);
  });

  it('rejects IPC invocations originating from child frames or iframes', () => {
    const mainFrame = { url: 'http://localhost:5173/' };
    const childIframe = { url: 'http://localhost:5173/preview.html' };

    const dummyWebContents = {
      mainFrame,
    } as any;

    const mockWin = { isDestroyed: () => false } as any;
    vi.spyOn(BrowserWindow, 'fromWebContents').mockReturnValue(mockWin);

    const eventFromChildFrame = {
      sender: dummyWebContents,
      senderFrame: childIframe, // Not mainFrame!
    } as any;

    expect(validateIpcSender(eventFromChildFrame)).toBe(false);
  });

  it('in development mode, accepts main frame matching VITE_DEV_SERVER_URL', () => {
    process.env.VITE_DEV_SERVER_URL = mockDevUrl;

    const mainFrame = { url: 'http://localhost:5173/index.html' };
    const dummyWebContents = {
      mainFrame,
    } as any;

    const mockWin = { isDestroyed: () => false } as any;
    vi.spyOn(BrowserWindow, 'fromWebContents').mockReturnValue(mockWin);

    const event = {
      sender: dummyWebContents,
      senderFrame: mainFrame,
    } as any;

    expect(validateIpcSender(event)).toBe(true);
  });

  it('in development mode, rejects unauthorized external or mismatched frame URLs', () => {
    process.env.VITE_DEV_SERVER_URL = mockDevUrl;

    const attackFrame = { url: 'https://attacker.com/malicious.html' };
    const dummyWebContents = {
      mainFrame: attackFrame,
    } as any;

    const mockWin = { isDestroyed: () => false } as any;
    vi.spyOn(BrowserWindow, 'fromWebContents').mockReturnValue(mockWin);

    const event = {
      sender: dummyWebContents,
      senderFrame: attackFrame,
    } as any;

    expect(validateIpcSender(event)).toBe(false);
  });

  it('getValidatedWindow throws Security Exception on invalid sender', () => {
    const badEvent = { sender: null, senderFrame: null } as any;
    expect(() => getValidatedWindow(badEvent)).toThrow(
      /Security Exception: Unauthorized IPC sender/
    );
  });

  it('getValidatedWindow returns active BrowserWindow on valid sender', () => {
    process.env.VITE_DEV_SERVER_URL = mockDevUrl;

    const mainFrame = { url: 'http://localhost:5173/' };
    const dummyWebContents = { mainFrame } as any;
    const mockWin = { id: 42, isDestroyed: () => false } as any;

    vi.spyOn(BrowserWindow, 'fromWebContents').mockReturnValue(mockWin);

    const event = {
      sender: dummyWebContents,
      senderFrame: mainFrame,
    } as any;

    const win = getValidatedWindow(event);
    expect(win).toBe(mockWin);
    expect(win.id).toBe(42);
  });
});
