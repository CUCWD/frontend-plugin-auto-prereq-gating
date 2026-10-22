import React, { useState } from 'react';
import { ActionRow, Button, ModalDialog } from '@openedx/paragon';
import { getConfig } from '@edx/frontend-platform';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';

const AutoGatingButton = () => {
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleClick = () => setIsConfirmOpen(true);

  const configureGating = async () => {
    setIsConfirmOpen(false);
    const courseMatch = window.location.pathname.match(/\/course\/([^/]+)/);
    if (!courseMatch) {
      setStatus('Could not determine the current course.');
      return;
    }

    setIsLoading(true);
    setStatus('');
    try {
      const { data } = await getAuthenticatedHttpClient().post(
        `${getConfig().STUDIO_BASE_URL}/auto_prereq_gating/configure/`,
        { course_key: decodeURIComponent(courseMatch[1]) },
      );
      setStatus(`Configured ${data.gates_configured} prerequisite gates.`);
    } catch (error) {
      const responseError = error as { response?: { data?: { error?: string } } };
      setStatus(responseError.response?.data?.error || 'Could not configure prerequisite gating.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="primary" onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Setting up gating…' : 'Auto-Setup Gating'}
      </Button>
      {status && <span className="small ml-2" role="status" aria-live="polite">{status}</span>}
      <ModalDialog
        title="Set up prerequisite gating?"
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        hasCloseButton
        isOverflowVisible={false}
      >
        <ModalDialog.Header>
          <ModalDialog.Title>Set up prerequisite gating?</ModalDialog.Title>
        </ModalDialog.Header>
        <ModalDialog.Body>
          This replaces prerequisite settings on the course subsections with a
          sequential chain requiring 100% completion of the previous subsection.
        </ModalDialog.Body>
        <ModalDialog.Footer>
          <ActionRow>
            <ModalDialog.CloseButton variant="tertiary">Cancel</ModalDialog.CloseButton>
            <Button onClick={configureGating}>Apply gating</Button>
          </ActionRow>
        </ModalDialog.Footer>
      </ModalDialog>
    </>
  );
};

export default AutoGatingButton;
