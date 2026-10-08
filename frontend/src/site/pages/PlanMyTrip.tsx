import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/primitives';
import { TripPlannerForm } from '@/components/TripPlannerForm';
/** The concierge trip designer as a full page (the popup uses the same form). */
const PlanMyTrip = () => (
  <Layout>
    <Container className="max-w-3xl pb-20">
      <TripPlannerForm />
    </Container>
  </Layout>
);

export default PlanMyTrip;
