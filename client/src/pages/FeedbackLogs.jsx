import ComingSoon from '../components/ComingSoon';
import { BookOpen } from 'lucide-react';

const FeedbackLogs = () => (
  <ComingSoon
    icon={BookOpen}
    title="Feedback Logs"
    description="View a complete history of all feedback you have given to your team members, with filters by employee, goal, and date range."
    features={[
      'Full feedback history',
      'Filter by employee or goal',
      'Acknowledged vs. pending',
      'Export feedback reports',
    ]}
  />
);

export default FeedbackLogs;
