import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ChipPicker from '../ChipPicker';

describe('ChipPicker', () => {
  it('renders all options as chips', () => {
    const { getByText } = render(
      <ChipPicker options={['A', 'B', 'C']} value="A" onChange={jest.fn()} />
    );
    expect(getByText('A')).toBeTruthy();
    expect(getByText('B')).toBeTruthy();
    expect(getByText('C')).toBeTruthy();
  });

  it('single-select fires onChange with new value', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <ChipPicker options={['A', 'B']} value="A" onChange={onChange} />
    );
    fireEvent.press(getByText('B'));
    expect(onChange).toHaveBeenCalledWith('B');
  });

  it('multi-select toggles values in/out of selection', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <ChipPicker options={['A', 'B', 'C']} value={['A']} onChange={onChange} mode="multi" />
    );
    fireEvent.press(getByText('B'));
    expect(onChange).toHaveBeenCalledWith(['A', 'B']);
  });

  it('multi-select silently ignores taps beyond max', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <ChipPicker options={['A', 'B', 'C', 'D']} value={['A', 'B', 'C']} onChange={onChange} mode="multi" max={3} />
    );
    fireEvent.press(getByText('D'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('accepts {label, value} objects', () => {
    const { getByText } = render(
      <ChipPicker
        options={[{ label: 'Per Track', value: 'per-track' }]}
        value="per-track"
        onChange={jest.fn()}
      />
    );
    expect(getByText('Per Track')).toBeTruthy();
  });
});
