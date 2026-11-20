/* eslint-disable react/prop-types */
import React from 'react';
import '@testing-library/jest-dom';
import {
  act, render, screen, fireEvent,
} from '@testing-library/react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import AutoGatingButton from './AutoGatingButton';

jest.mock('@edx/frontend-platform', () => ({
  getConfig: () => ({ STUDIO_BASE_URL: 'http://studio.example.test' }),
}));
jest.mock('@edx/frontend-platform/auth', () => ({ getAuthenticatedHttpClient: jest.fn() }));
jest.mock('@openedx/paragon', () => ({
  Button: ({ children, variant, ...props }) => <button type="button" {...props}>{children}</button>,
  Spinner: () => <span>Configuring</span>,
}));
jest.mock('./GatingConfigModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm }) => (isOpen
    ? <button type="button" onClick={() => onConfirm({ prereqMinCompletion: 100, prereqMinScore: 0 })}>Apply Gating</button>
    : null),
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const courseId = 'course-v1:org+c+r';

beforeEach(() => {
  jest.resetAllMocks();
  getAuthenticatedHttpClient.mockReturnValue({ get: mockGet, post: mockPost });
});

test('renders nothing while settings are loading', () => {
  mockGet.mockReturnValue(new Promise(() => {}));
  const { container } = render(<AutoGatingButton courseId={courseId} />);
  expect(container).toBeEmptyDOMElement();
});

test('renders nothing when gating is disabled', async () => {
  mockGet.mockResolvedValue({ data: { enable_subsection_gating: { value: false } } });
  const { container } = render(<AutoGatingButton courseId={courseId} />);
  await act(async () => {});
  expect(container).toBeEmptyDOMElement();
});

test('renders button when gating is enabled', async () => {
  mockGet.mockResolvedValue({ data: { enable_subsection_gating: { value: true } } });
  render(<AutoGatingButton courseId={courseId} />);
  expect(await screen.findByText('Auto-Setup Prerequisite Gating')).toBeInTheDocument();
});

test.each([
  ['success', { data: { success: true, gating_configured: 4, total_subsections: 5 } }, '✓ 4 of 5 subsections gated'],
  ['error', { response: { data: { error: 'Subsection Prerequisites must be enabled' } } }, '✗ Subsection Prerequisites must be enabled'],
])('shows %s message after applying gating', async (result, response, message) => {
  mockGet.mockResolvedValue({ data: { enable_subsection_gating: { value: true } } });
  if (result === 'success') { mockPost.mockResolvedValue(response); } else { mockPost.mockRejectedValue(response); }
  render(<AutoGatingButton courseId={courseId} refreshCourseOutline={jest.fn()} />);
  fireEvent.click(await screen.findByText('Auto-Setup Prerequisite Gating'));
  fireEvent.click(screen.getByText('Apply Gating'));
  expect(await screen.findByText(message)).toBeInTheDocument();
});

test('asks for a manual refresh when the host cannot update the outline', async () => {
  mockGet.mockResolvedValue({ data: { enable_subsection_gating: { value: true } } });
  mockPost.mockResolvedValue({ data: { success: true, gating_configured: 1, total_subsections: 2 } });
  render(<AutoGatingButton courseId={courseId} />);
  fireEvent.click(await screen.findByText('Auto-Setup Prerequisite Gating'));
  fireEvent.click(screen.getByText('Apply Gating'));
  expect(await screen.findByText(/refresh the page to update the outline/)).toBeInTheDocument();
});
