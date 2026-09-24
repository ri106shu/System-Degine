import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Layers, ListChecks, Network, HelpCircle } from 'lucide-react';
import { fetchDashboard } from '../features/dashboard/dashboardSlice';
import { useAuth } from '../hooks/useAuth';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import CoverageCard from '../components/dashboard/CoverageCard';
import OverallPreparation from '../components/dashboard/OverallPreparation';
import ModuleComparison from '../components/dashboard/ModuleComparison';
import QuickActions from '../components/dashboard/QuickActions';
import WeakAreas from '../components/dashboard/WeakAreas';
import RecentActivity from '../components/dashboard/RecentActivity';
import MockPerformance from '../components/dashboard/MockPerformance';
import TodaysPreparation from '../components/dashboard/TodaysPreparation';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { data, status } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (status === 'failed' || !data) {
    return (
      <EmptyState
        icon={Layers}
        title="Couldn't load your dashboard"
        description="Check that the API is running and reachable, then refresh."
      />
    );
  }

  const { lld, hld, overall, mocks, weakAreas, recentActivity, roadmapToday } = data;

  return (
    <div>
      <DashboardHeader user={user} />

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[#16181D] dark:text-[#E9EAEC]">Interview preparation coverage</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CoverageCard icon={Layers} label="LLD Topics" {...lld.topics} />
          <CoverageCard icon={HelpCircle} label="LLD Questions" {...lld.questions} />
          <CoverageCard icon={Network} label="HLD Topics" {...hld.topics} />
          <CoverageCard icon={ListChecks} label="HLD Questions" {...hld.questions} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <OverallPreparation overall={overall} />
        <ModuleComparison lld={lld} hld={hld} />
      </div>

      <div className="mt-5">
        <TodaysPreparation roadmapToday={roadmapToday} />
      </div>

      <div className="mt-6">
        <QuickActions />
      </div>

      <div className="mt-6">
        <WeakAreas items={weakAreas} />
      </div>

      <div className="mt-6">
        <MockPerformance mocks={mocks} />
      </div>

      <div className="mt-6">
        <RecentActivity items={recentActivity} />
      </div>
    </div>
  );
}
