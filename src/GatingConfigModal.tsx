import React, { useState } from 'react';
import {
  AlertModal,
  ActionRow,
  Button,
  Form,
} from '@openedx/paragon';
 
/**
 * GatingConfigModal
 *
 * Replaces window.confirm — lets the instructor tune prereq thresholds
 * before submitting to the backend.
 *
 * Props:
 *   isOpen       {boolean}  — controls visibility
 *   onClose      {function} — called when the modal is dismissed
 *   onConfirm    {function(config)} — called with { prereqMinCompletion, prereqMinScore }
 *   isSubmitting {boolean}  — disables the confirm button while the POST is in flight
 */
export interface GatingConfig {
  prereqMinCompletion: number;
  prereqMinScore: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: GatingConfig) => void;
  isSubmitting: boolean;
}

const GatingConfigModal = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: Props) => {
  const [prereqMinCompletion, setPrereqMinCompletion] = useState(100);
  const [prereqMinScore, setPrereqMinScore] = useState(0);
 
  const handleConfirm = () => {
    onConfirm({ prereqMinCompletion, prereqMinScore });
  };
 
  const clamp = (value: string) => Math.min(100, Math.max(0, Math.trunc(Number(value) || 0)));
 
  return (
    <AlertModal
      title="Auto-Setup Prerequisite Gating"
      isOpen={isOpen}
      onClose={onClose}
      isBlocking={isSubmitting}
      hasCloseButton={!isSubmitting}
      className="gating-config-modal"
      footerNode={(
        <ActionRow>
          <Button variant="outline-primary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Applying…' : 'Apply Gating'}
          </Button>
        </ActionRow>
      )}
    >
      <style>{`
        .pgn__modal.gating-config-modal { max-width: min(42rem, calc(100vw - 2rem)); }
        .pgn__modal.gating-config-modal .pgn__modal-header {
          background: #0b3054;
          color: white;
          min-height: 3rem;
          padding-bottom: 1.5rem;
        }
        .gating-config-modal .pgn__modal-title { color: white; }
        .gating-config-modal .pgn__modal-close-container button { color: white; }
        .gating-config-modal .gating-percent-input { width: 100px; }
        .gating-config-modal .gating-note { background: #edf5fb; border-left: 3px solid #0875c1; padding: 16px; }
      `}</style>
      <p>
        Configure how subsection prerequisites are applied across all sections
        in this course. Each subsection will require the previous one to meet
        these thresholds before unlocking.
      </p>
 
      <Form>
        <Form.Group controlId="gating-min-completion">
          <Form.Label>Minimum Completion</Form.Label>
          <div className="d-flex align-items-center">
          <Form.Control
            className="gating-percent-input"
            type="number"
            step={1}
            min={0}
            max={100}
            value={prereqMinCompletion}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrereqMinCompletion(clamp(e.target.value))}
          />
            <span className="ml-2" aria-hidden="true">%</span>
          </div>
          <Form.Text>
            How much of the previous subsection must be completed before the next unlocks (default: 100).
          </Form.Text>
        </Form.Group>
 
        <Form.Group controlId="gating-min-score">
          <Form.Label>Minimum Score</Form.Label>
          <div className="d-flex align-items-center">
          <Form.Control
            className="gating-percent-input"
            type="number"
            step={1}
            min={0}
            max={100}
            value={prereqMinScore}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrereqMinScore(clamp(e.target.value))}
          />
            <span className="ml-2" aria-hidden="true">%</span>
          </div>
          <Form.Text>
            Minimum grade required on the previous subsection before unlocking (default: 0).
          </Form.Text>
        </Form.Group>
      </Form>
      <div className="gating-note text-muted">
        The first subsection in the course is never gated — only subsequent subsections receive a prerequisite.
      </div>
    </AlertModal>
  );
};
 
export default GatingConfigModal;
