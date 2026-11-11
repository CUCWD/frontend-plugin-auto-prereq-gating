import React, { useEffect, useRef, useState } from 'react';
import { getAuthenticatedHttpClient } from '@edx/frontend-platform/auth';
import { getConfig } from '@edx/frontend-platform';
import { Button, Spinner } from '@openedx/paragon';
import GatingConfigModal, { GatingConfig } from './GatingConfigModal';

type OperationStatus = 'idle' | 'running' | 'success' | 'error';

interface AutoGatingButtonProps {
  courseId?: string;
}

/**
 * Adds sequential prerequisite gating to every subsection in the course.
 * The Ulmo course outline slot passes courseId directly as a prop.
 */
const AutoGatingButton = ({ courseId }: AutoGatingButtonProps) => {
  const [gatingEnabled, setGatingEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [opStatus, setOpStatus] = useState<OperationStatus>('idle');
  const [opMessage, setOpMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;

    setGatingEnabled(false);
    if (!courseId) {
      setSettingsLoading(false);
      return () => {
        isCurrentRequest = false;
      };
    }

    setSettingsLoading(true);
    getAuthenticatedHttpClient()
      .get(`${getConfig().STUDIO_BASE_URL}/api/contentstore/v0/advanced_settings/${courseId}`)
      .then(({ data }: { data: { enable_subsection_gating?: { value?: boolean } } }) => {
        if (!isCurrentRequest) {
          return;
        }
        const setting = data.enable_subsection_gating;
        setGatingEnabled(!!(setting && setting.value === true));
      })
      .catch(() => {
        if (isCurrentRequest) {
          setGatingEnabled(false);
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setSettingsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [courseId]);

  useEffect(() => () => {
    if (resetTimeout.current) {
      clearTimeout(resetTimeout.current);
    }
  }, []);

  if (settingsLoading || !gatingEnabled) {
    return null;
  }

  const resetOperationStatusAfter = (duration: number) => {
    if (resetTimeout.current) {
      clearTimeout(resetTimeout.current);
    }
    resetTimeout.current = setTimeout(() => {
      setOpStatus('idle');
      setOpMessage('');
      resetTimeout.current = null;
    }, duration);
  };

  const handleApply = async (config: GatingConfig) => {
    if (!courseId) { return; }

    if (resetTimeout.current) {
      clearTimeout(resetTimeout.current);
    }
    setOpStatus('running');
    setOpMessage('');

    try {
      const { data } = await getAuthenticatedHttpClient()
        .post(`${getConfig().STUDIO_BASE_URL}/auto_prereq_gating/setup/${encodeURIComponent(courseId)}/`, config);

      if (data.success) {
        setOpStatus('success');
        setOpMessage(`✓ ${data.gating_configured} of ${data.total_subsections} subsections gated`);
        resetOperationStatusAfter(4000);
      } else {
        setOpStatus('error');
        setOpMessage(data.error || 'Unknown error');
        resetOperationStatusAfter(5000);
      }
    } catch (error) {
      const responseError = error as { response?: { data?: { error?: string } } };
      setOpStatus('error');
      setOpMessage(responseError.response?.data?.error || 'Network error');
      resetOperationStatusAfter(5000);
    } finally {
      setModalOpen(false);
    }
  };

  const variantMap: Record<OperationStatus, 'primary' | 'success' | 'danger'> = {
    idle: 'primary',
    running: 'primary',
    success: 'success',
    error: 'danger',
  };

  return (
    <>
      <Button
        variant={variantMap[opStatus]}
        onClick={() => { if (opStatus === 'idle') { setModalOpen(true); } }}
        disabled={opStatus === 'running'}
        className="mr-2"
        title="Configure sequential subsection prerequisites."
      >
        {opStatus === 'running' && (
        <Spinner animation="border" size="sm" className="mr-1" screenReaderText="Configuring" />
        )}
        {opStatus === 'running' && 'Configuring…'}
        {opStatus === 'success' && opMessage}
        {opStatus === 'error' && `✗ ${opMessage}`}
        {opStatus === 'idle' && 'Auto-Setup Prerequisite Gating'}
      </Button>
      <GatingConfigModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={handleApply} isSubmitting={opStatus === 'running'} />
    </>
  );
};

export default AutoGatingButton;
