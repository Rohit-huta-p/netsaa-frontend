/**
 * SearchableMultiSelect — dismiss behaviour.
 *
 * Covers the two modes:
 *   • inline (default) — opening shows the inline panel, never the overlay backdrop.
 *   • overlay          — opening mounts a full-screen backdrop whose press closes the
 *                        dropdown (tap-outside-to-close), while toggling an option or
 *                        adding a custom value keeps it open.
 *
 * Uses react-test-renderer directly (same harness as the profile smoke tests); no
 * native measure is available, so the field's measureInWindow is a no-op and the
 * popover opens via setOpen — exactly the web/test path the component is built for.
 */
import React from 'react';

const TestRenderer = require('react-test-renderer');
import { SearchableMultiSelect } from '../SearchableMultiSelect';

const OPTS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

function setup(props: any = {}) {
  let r: any;
  TestRenderer.act(() => {
    r = TestRenderer.create(
      <SearchableMultiSelect
        selected={props.selected ?? []}
        options={OPTS}
        onToggle={props.onToggle ?? (() => {})}
        {...props}
      />
    );
  });
  return r;
}

// A testID surfaces on several fiber nodes (component + host views), so assert on
// presence, and fire a handler on whichever node actually carries it.
const nodes = (r: any, testID: string) => r.root.findAll((n: any) => n.props.testID === testID);
const exists = (r: any, testID: string) => nodes(r, testID).length > 0;
const fire = (r: any, testID: string, handler = 'onPress', ...args: any[]) => {
  const node = nodes(r, testID).find((n: any) => typeof n.props[handler] === 'function');
  if (!node) throw new Error(`no ${handler} on testID "${testID}"`);
  TestRenderer.act(() => { node.props[handler](...args); });
};

describe('SearchableMultiSelect', () => {
  it('inline by default: opening shows the inline panel, never an overlay backdrop', () => {
    const r = setup();
    expect(exists(r, 'msms-backdrop')).toBe(false);
    fire(r, 'msms-field');
    // Panel is open inline: options are mounted, but there is no Modal backdrop.
    expect(exists(r, 'msms-opt-a')).toBe(true);
    expect(exists(r, 'msms-backdrop')).toBe(false);
  });

  it('overlay: an outside tap on the backdrop closes the dropdown', () => {
    const r = setup({ overlay: true });
    expect(exists(r, 'msms-backdrop')).toBe(false);
    fire(r, 'msms-field');
    expect(exists(r, 'msms-backdrop')).toBe(true); // opened
    fire(r, 'msms-backdrop');
    expect(exists(r, 'msms-backdrop')).toBe(false); // closed on outside tap
  });

  it('overlay: toggling an option keeps the dropdown open', () => {
    const onToggle = jest.fn();
    const r = setup({ overlay: true, onToggle });
    fire(r, 'msms-field');
    fire(r, 'msms-opt-b');
    expect(onToggle).toHaveBeenCalledWith('b');
    expect(exists(r, 'msms-backdrop')).toBe(true); // still open
  });

  it('overlay: adding a custom value keeps it open and emits the typed value', () => {
    const onToggle = jest.fn();
    const r = setup({ overlay: true, allowCustom: true, onToggle });
    fire(r, 'msms-field');
    fire(r, 'msms-search', 'onChangeText', 'Jazz');
    fire(r, 'msms-addrow');
    expect(onToggle).toHaveBeenCalledWith('Jazz');
    expect(exists(r, 'msms-backdrop')).toBe(true); // still open
  });

  it('a custom-selected value (not in options) renders as the FIRST pill, selected', () => {
    // 'Jazz' isn't in OPTS; 'a' is. Custom should sort ahead of the curated options.
    const r = setup({ overlay: true, allowCustom: true, selected: ['a', 'Jazz'] });
    fire(r, 'msms-field'); // open the sheet
    const pillIds = r.root
      .findAll((n: any) => typeof n.props.testID === 'string'
        && n.props.testID.startsWith('msms-opt-')
        && typeof n.props.onPress === 'function')
      .map((n: any) => n.props.testID);
    expect(pillIds[0]).toBe('msms-opt-Jazz');        // custom is first
    expect(pillIds).toContain('msms-opt-a');          // curated options still present
  });
});
