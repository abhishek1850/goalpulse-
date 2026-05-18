import ComingSoon from '../components/ComingSoon';
import { TrendingUp } from 'lucide-react';

const TeamProgress = () => (
  <ComingSoon
    icon={TrendingUp}
    title="Team Progress"
    description="Get a bird's-eye view of how your entire team is progressing against their goals, with detailed breakdowns by quarter and category."
    features={[
      'Team-wide progress charts',
      'Individual member tracking',
      'Quarter-over-quarter trends',
      'Goal completion rates',
    ]}
  />
);

export default TeamProgress;
