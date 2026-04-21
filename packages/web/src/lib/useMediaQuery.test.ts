import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { vi, beforeEach, afterEach } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

type Listener = (e: MediaQueryListEvent) => void;

function makeHarness(): ReturnType<typeof defineComponent> {
  return defineComponent({
    setup() {
      const matches = useMediaQuery('(min-width: 768px)');
      return { matches };
    },
    render() {
      return h('div', String((this as unknown as { matches: boolean }).matches));
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMediaQuery (modern API)', () => {
  let listeners: Set<Listener>;
  let addSpy: ReturnType<typeof vi.fn>;
  let removeSpy: ReturnType<typeof vi.fn>;
  let matches: boolean;

  beforeEach(() => {
    listeners = new Set();
    matches = true;
    addSpy = vi.fn((_t: string, cb: Listener) => listeners.add(cb));
    removeSpy = vi.fn((_t: string, cb: Listener) => listeners.delete(cb));
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: () => ({
        matches,
        media: '',
        addEventListener: addSpy,
        removeEventListener: removeSpy,
      }),
    });
  });

  it('returns initial matches value', () => {
    const Harness = makeHarness();
    const wrapper = mount(Harness);
    expect(wrapper.text()).toBe('true');
  });

  it('updates on change events', async () => {
    const Harness = makeHarness();
    const wrapper = mount(Harness);
    listeners.forEach((cb) => cb({ matches: false } as MediaQueryListEvent));
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toBe('false');
  });

  it('calls removeEventListener on unmount', () => {
    const Harness = makeHarness();
    const wrapper = mount(Harness);
    wrapper.unmount();
    expect(removeSpy).toHaveBeenCalled();
  });
});

describe('useMediaQuery (legacy Safari API)', () => {
  let listeners: Set<Listener>;
  let addListener: ReturnType<typeof vi.fn>;
  let removeListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    listeners = new Set();
    addListener = vi.fn((cb: Listener) => listeners.add(cb));
    removeListener = vi.fn((cb: Listener) => listeners.delete(cb));
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: () => ({
        matches: false,
        media: '',
        addListener,
        removeListener,
      }),
    });
  });

  it('uses addListener / removeListener fallback', () => {
    const Harness = makeHarness();
    const wrapper = mount(Harness);
    expect(addListener).toHaveBeenCalled();
    wrapper.unmount();
    expect(removeListener).toHaveBeenCalled();
  });
});

describe('useMediaQuery (no matchMedia)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  it('returns a ref(false) without throwing', () => {
    const Harness = makeHarness();
    const wrapper = mount(Harness);
    expect(wrapper.text()).toBe('false');
    wrapper.unmount();
  });
});
