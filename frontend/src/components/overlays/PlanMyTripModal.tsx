import { __ } from '@wordpress/i18n';
import type { PlanTripOptions } from '@/site/context';
import { TripPlannerForm } from '../TripPlannerForm';
import { Modal } from './Modal';

type PlanMyTripModalProps = { options: PlanTripOptions; onClose: () => void };

const PlanMyTripModal = ({ options, onClose }: PlanMyTripModalProps) => (
  <Modal onClose={onClose} variant="sheet" label={__('Plan your Thailand journey', 'suntourz')} className="md:max-w-4xl">
    <TripPlannerForm options={options} onClose={onClose} />
  </Modal>
);

export default PlanMyTripModal;
