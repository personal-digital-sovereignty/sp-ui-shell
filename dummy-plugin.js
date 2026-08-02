export function dummyFederation() {
  return {
    name: 'dummy-federation',
    resolveId(id) {
      if (id.startsWith('sp_ui_')) {
        return '\0dummy-federation:' + id;
      }
    },
    load(id) {
      if (id.startsWith('\0dummy-federation:')) {
        return `
          export const mountSpotlight = () => {};
          export const unmountSpotlight = () => {};
          export default function() { return {}; }
        `;
      }
    }
  };
}
