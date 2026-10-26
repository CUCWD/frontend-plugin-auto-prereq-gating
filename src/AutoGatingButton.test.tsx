import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import AutoGatingButton from './AutoGatingButton';

jest.mock('@edx/frontend-platform/auth', () => ({
  getAuthenticatedHttpClient: jest.fn(),
}));

jest.mock('@openedx/paragon', () => {
  const ReactModule = jest.requireActual('react');
  return {
    Button: ({
      children,
      variant,
      size,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      variant: string;
      size: string;
    }) => ReactModule.createElement('button', { ...props, 'data-variant': variant, 'data-size': size }, children),
    Spinner: ({ screenReaderText, ...props }: React.HTMLAttributes<HTMLSpanElement> & {
      screenReaderText: string;
    }) => ReactModule.createElement('span', {
      ...props,
      className: `spinner-border ${props.className || ''}`,
      'aria-label': screenReaderText,
    }),
  };
});

const get = jest.fn();
const post = jest.fn();

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const setGatingSetting = (value: unknown) => {
  get.mockResolvedValue({
    data: {
      enable_subsection_gating: value,
    },
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  (getAuthenticatedHttpClient as jest.Mock).mockReturnValue({ get, post });
  jest.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('AutoGatingButton', () => {
  it.each([
    ['false', { value: false }],
    ['missing', undefined],
  ])('renders nothing when the setting is %s', async (_description, setting) => {
    setGatingSetting(setting);
    const { container } = render(<AutoGatingButton courseId="course-v1:org+course+run" />);

    await waitFor(() => expect(get).toHaveBeenCalledWith(
      '/api/contentstore/v0/advanced_settings/course-v1:org+course+run/',
    ));
    await act(async () => {});

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while the settings request is in flight', async () => {
    const settingsRequest = deferred<{ data: unknown }>();
    get.mockReturnValue(settingsRequest.promise);
    const { container } = render(<AutoGatingButton courseId="course-v1:org+course+run" />);

    expect(get).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();

    await act(async () => {
      settingsRequest.resolve({ data: { enable_subsection_gating: { value: false } } });
    });
  });

  it('renders the button when subsection gating is enabled', async () => {
    setGatingSetting({ value: true });
    render(<AutoGatingButton courseId="course-v1:org+course+run" />);

    expect(await screen.findByRole('button', { name: 'Auto-Setup Prerequisite Gating' })).toBeInTheDocument();
  });

  it('does not call the setup API when confirmation is cancelled', async () => {
    setGatingSetting({ value: true });
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    render(<AutoGatingButton courseId="course-v1:org+course+run" />);
    const button = await screen.findByRole('button', { name: 'Auto-Setup Prerequisite Gating' });

    fireEvent.click(button);

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(post).not.toHaveBeenCalled();
  });

  it('shows a spinner while running, then the success message for four seconds', async () => {
    setGatingSetting({ value: true });
    const setupRequest = deferred<{ data: unknown }>();
    post.mockReturnValue(setupRequest.promise);
    render(<AutoGatingButton courseId="course-v1:org+course+run" />);
    const button = await screen.findByRole('button', { name: 'Auto-Setup Prerequisite Gating' });
    jest.useFakeTimers();

    fireEvent.click(button);

    const runningButton = screen.getByRole('button', { name: /Configuring/ });
    expect(runningButton).toBeDisabled();
    expect(runningButton.querySelector('.spinner-border')).toBeInTheDocument();
    expect(post).toHaveBeenCalledWith('/auto_prereq_gating/setup/course-v1%3Aorg%2Bcourse%2Brun/');

    await act(async () => {
      setupRequest.resolve({
        data: { success: true, gating_configured: 3, total_subsections: 4 },
      });
    });

    expect(screen.getByRole('button', { name: '✓ 3 of 4 subsections gated' })).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(3999);
    });
    expect(screen.getByRole('button', { name: '✓ 3 of 4 subsections gated' })).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByRole('button', { name: 'Auto-Setup Prerequisite Gating' })).toBeInTheDocument();
  });

  it('shows a failed request message for five seconds, then resets to idle', async () => {
    setGatingSetting({ value: true });
    const setupRequest = deferred<{ data: unknown }>();
    post.mockReturnValue(setupRequest.promise);
    render(<AutoGatingButton courseId="course-v1:org+course+run" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Auto-Setup Prerequisite Gating' }));
    jest.useFakeTimers();

    await act(async () => {
      setupRequest.reject({ response: { data: { error: 'Could not configure gating' } } });
    });

    expect(screen.getByRole('button', { name: '✗ Could not configure gating' })).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(4999);
    });
    expect(screen.getByRole('button', { name: '✗ Could not configure gating' })).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByRole('button', { name: 'Auto-Setup Prerequisite Gating' })).toBeInTheDocument();
  });
});
