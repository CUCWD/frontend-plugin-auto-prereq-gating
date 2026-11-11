/* eslint-disable max-len, react/button-has-type */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import GatingConfigModal from './GatingConfigModal';

jest.mock('@openedx/paragon', () => {
  const ReactModule = jest.requireActual('react');
  const FormContext = ReactModule.createContext(undefined);
  const Group = ({ children, controlId }: any) => (
    <FormContext.Provider value={controlId}><div>{children}</div></FormContext.Provider>
  );
  const Form = ({ children }: any) => <form>{children}</form>;
  Form.Group = Group;
  Form.Label = function ({ children }: any) {
    const controlId = ReactModule.useContext(FormContext);
    return <label htmlFor={controlId}>{children}</label>;
  };
  Form.Control = function (props: any) {
    const controlId = ReactModule.useContext(FormContext);
    return <input {...props} id={controlId} />;
  };
  Form.Text = function ({ children }: any) {
    return <small>{children}</small>;
  };
  return {
    Form, ActionRow: ({ children }: any) => <div>{children}</div>, Button: ({ children, variant, ...props }: any) => <button {...props}>{children}</button>, AlertModal: ({ children, footerNode, isOpen }: any) => (isOpen ? <div>{children}{footerNode}</div> : null),
  };
});

const props = {
  isOpen: true, onClose: jest.fn(), onConfirm: jest.fn(), isSubmitting: false,
};
beforeEach(() => jest.clearAllMocks());

describe('GatingConfigModal', () => {
  it('renders default values', () => {
    render(<GatingConfigModal {...props} />);
    expect(screen.getByLabelText(/minimum completion/i)).toHaveValue(100);
    expect(screen.getByLabelText(/minimum score/i)).toHaveValue(0);
  });
  it('confirms the selected values', () => {
    render(<GatingConfigModal {...props} />);
    fireEvent.change(screen.getByLabelText(/minimum score/i), { target: { value: '80' } });
    fireEvent.click(screen.getByText('Apply Gating'));
    expect(props.onConfirm).toHaveBeenCalledWith({ prereqMinCompletion: 100, prereqMinScore: 80 });
  });
  it('cancels', () => {
    render(<GatingConfigModal {...props} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(props.onClose).toHaveBeenCalled();
  });
  it('disables actions during submission', () => {
    render(<GatingConfigModal {...props} isSubmitting />);
    expect(screen.getByText('Applying…')).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });
  it('clamps values', () => {
    render(<GatingConfigModal {...props} />);
    fireEvent.change(screen.getByLabelText(/minimum completion/i), { target: { value: '150' } });
    expect(screen.getByLabelText(/minimum completion/i)).toHaveValue(100);
    fireEvent.change(screen.getByLabelText(/minimum score/i), { target: { value: '-1' } });
    expect(screen.getByLabelText(/minimum score/i)).toHaveValue(0);
  });
});
