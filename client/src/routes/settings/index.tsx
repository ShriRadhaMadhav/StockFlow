import { PageContainer } from '../../layouts/PageContainer';
import { PageHeader } from '../../layouts/PageHeader';
import { EmptyState } from '../../components/ui/empty-state/EmptyState';

export default function SettingsRoute() {
  return (
    <PageContainer>
      <PageHeader title="Settings" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Settings' }]} />
      <div className="mt-6">
        <EmptyState 
          title="Module Not Initialized" 
          description="This operational view is pending implementation." 
        />
      </div>
    </PageContainer>
  );
}