import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Main from '../index';

describe('My Component', () => {
  it('renders displays the passed message', async () => {
    const { findByText } = render(<Main message="Hello World" />);
    const content = await findByText('Hello World');
    expect(content).toBeTruthy();
  });
  it('renders displays the default message', async () => {
    const { findByText } = render(<Main />);
    const content = await findByText('No Message');
    expect(content).toBeTruthy();
  });
});
