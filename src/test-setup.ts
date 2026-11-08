// Polyfills for running unit tests under jsdom (the default Vitest environment).
// Ionic components such as ion-menu and ion-split-pane query `window.matchMedia`,
// which jsdom does not implement.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// Swiper Custom Elements call `el.part.add('container')`, which is not implemented by jsdom
if (typeof Element !== 'undefined' && !('part' in Element.prototype)) {
  Object.defineProperty(Element.prototype, 'part', {
    get() {
      if (!this._partTokenList) {
        const parts = new Set<string>();
        this._partTokenList = {
          add: (...tokens: string[]) => tokens.forEach((t) => parts.add(t)),
          remove: (...tokens: string[]) => tokens.forEach((t) => parts.delete(t)),
          contains: (token: string) => parts.has(token),
          toggle: (token: string, force?: boolean) => {
            if (force === true) {
              parts.add(token);
              return true;
            }
            if (force === false) {
              parts.delete(token);
              return false;
            }
            if (parts.has(token)) {
              parts.delete(token);
              return false;
            }
            parts.add(token);
            return true;
          },
          value: '',
          length: 0,
          item: (index: number) => Array.from(parts)[index] || null,
        };
      }
      return this._partTokenList;
    },
    configurable: true,
  });
}
