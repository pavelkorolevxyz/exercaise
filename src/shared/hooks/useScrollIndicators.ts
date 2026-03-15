import { useCallback } from 'react';

/**
 * Ref-callback that adds data-scroll-top / data-scroll-bottom attributes
 * to a scrollable container, enabling CSS border indicators.
 */
export function useScrollIndicators() {
  return useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const update = () => {
      node.toggleAttribute('data-scroll-top', node.scrollTop > 0);
      node.toggleAttribute(
        'data-scroll-bottom',
        node.scrollTop + node.clientHeight < node.scrollHeight - 1,
      );
    };
    update();
    node.addEventListener('scroll', update, { passive: true });
    const obs = new MutationObserver(update);
    obs.observe(node, { childList: true, subtree: true });
    return () => {
      node.removeEventListener('scroll', update);
      obs.disconnect();
    };
  }, []);
}
