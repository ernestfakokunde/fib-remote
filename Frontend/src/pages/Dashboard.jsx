import { useEffect } from 'react';
import { useGlobalContext } from '../context/context';
import DashboardCard from '../components/DashboardCard';
import {
  Package,
  Wallet,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  PlusCircle,
  ArrowDownCircle,
  Landmark,
} from 'lucide-react';
import SalesChart from '../components/SalesChart';
import MonthlyProfitChart from '../components/MonthlyProfitChart';
import ActionCard from '../components/ActionCard';
import { formatCurrency, formatNumber } from '../utils/format';
import RecentActivities from '../components/RecentActivities';

const Dashboard = () => {
  const { dashboardMetrics, fetchDashboardMetrics } = useGlobalContext();

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  return (
    <div className='page-shell mt-2 text-[var(--text)]'>
      <h2 className='animate-fade-up text-2xl font-semibold'>Dashboard</h2>
      <p className='animate-fade-up mt-2 mb-4 text-[var(--muted)]' style={{ animationDelay: '90ms' }}>
        {' '}
        Welcome Back, Here's what is happening today
      </p>

      <div className='grid lg:grid-cols-4 md:grid-cols-2 p-5 gap-4'>
        <div className='animate-fade-up' style={{ animationDelay: '160ms' }}>
          <DashboardCard
            title='Total Products'
            value={formatNumber(dashboardMetrics.totalProducts)}
            trend='+12% from last month'
            Icon={Package}
          />
        </div>
        <div className='animate-fade-up' style={{ animationDelay: '240ms' }}>
          <DashboardCard
            title='Low Stock Items'
            value={formatNumber(dashboardMetrics.lowStockCount)}
            Icon={Wallet}
          />
        </div>
        <div className='animate-fade-up' style={{ animationDelay: '320ms' }}>
          <DashboardCard
            title='Total Sales Today'
            value={formatCurrency(dashboardMetrics.totalSalesToday)}
            Icon={DollarSign}
          />
        </div>
        <div className='animate-fade-up' style={{ animationDelay: '400ms' }}>
          <DashboardCard
            title='Total Profit Today'
            value={formatCurrency(dashboardMetrics.totalProfitToday)}
            Icon={TrendingUp}
          />
        </div>
      </div>

      <div className='p-5 sm:p-3 grid lg:grid-cols-2 md:grid-cols-2 gap-4'>
        <div className='animate-pop-in' style={{ animationDelay: '460ms' }}>
          <SalesChart />
        </div>
        <div className='animate-pop-in' style={{ animationDelay: '540ms' }}>
          <MonthlyProfitChart months={6} />
        </div>
      </div>

      <div className='p-5 grid lg:grid-cols-2 gap-4 md:grid-cols-2'>
        {/** Add  action button here */}
        <div className='animate-fade-up grid grid-cols-2 gap-4 mt-4' style={{ animationDelay: '620ms' }}>
          <div className='animate-pop-in' style={{ animationDelay: '680ms' }}>
            <ActionCard
              bgColor='var(--primary)'
              textColor='white'
              link='products'
              icon={<PlusCircle size={28} />}
              name='Add New Product'
            />
          </div>
          <div className='animate-pop-in' style={{ animationDelay: '740ms' }}>
            <ActionCard
              bgColor='#10B981'
              textColor='white'
              link='stock-out'
              icon={<ShoppingCart size={28} />}
              name='Create New Sale'
            />
          </div>
          <div className='animate-pop-in' style={{ animationDelay: '800ms' }}>
            <ActionCard
              bgColor='#8B5CF6'
              textColor='white'
              link='stock-in'
              icon={<ArrowDownCircle size={28} />}
              name='Record New Purchase'
            />
          </div>
          <div className='animate-pop-in' style={{ animationDelay: '860ms' }}>
            <ActionCard
              bgColor='#EF4444'
              textColor='white'
              link='reports'
              icon={<Landmark size={28} />}
              name='View Financial Report'
            />
          </div>
        </div>

      </div>
      <div className='animate-fade-up p-5 grid grid-cols-1 gap-4' style={{ animationDelay: '920ms' }}>
        <RecentActivities />
      </div>
      
    </div>
  );
};

export default Dashboard;
