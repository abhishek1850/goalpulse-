import ComingSoon from '../components/ComingSoon';
import { MessageSquare } from 'lucide-react';

const Feedback = () => (
  <ComingSoon
    icon={MessageSquare}
    title="Feedback"
    description="View and respond to feedback from your manager. Track your growth through structured performance conversations."
    features={[
      'Manager feedback threads',
      'Goal-linked comments',
      'Acknowledgement system',
      'Feedback history timeline',
    ]}
  />
);

export default Feedback;
