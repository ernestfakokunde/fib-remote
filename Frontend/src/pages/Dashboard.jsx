import { useEffect } from 'react';
import { useGlobalContext } from '../context/context';
import DashboardCard from '../components/DashboardCard';
import SpectraAI from '../components/SpectraAI';
import Footer from '../components/Footer';
import {
  Package,
  Wallet,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  ArrowDownCircle,
  Landmark,
} from 'lucide-react';
import SalesChart from '../components/SalesChart';
import MonthlyProfitChart from '../components/MonthlyProfitChart';
import ActionCard from '../components/ActionCard';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatNumber } from '../utils/format';
import RecentActivities from '../components/RecentActivities';

const Dashboard = () => {
  const { dashboardMetrics, fetchDashboardMetrics } = useGlobalContext();

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const navigate = useNavigate();

  return (
    <div className='mt-2 container text-[var(--text)]'>
      <h2 className='text-2xl font-semibold'>Dashboard</h2>
      <p className='mt-2 mb-4 text-[var(--muted)]'>
        {' '}
        Welcome Back, Here's what is happening today
      </p>

      <div className='grid lg:grid-cols-4 md:grid-cols-2 p-5 gap-4'>
        <DashboardCard
          title='Total Products'
          value={formatNumber(dashboardMetrics.totalProducts)}
          trend='+12% from last month'
          Icon={Package}
        />

        <DashboardCard
          title='Low Stock Items'
          value={formatNumber(dashboardMetrics.lowStockCount)}
          Icon={Wallet}
        />
        <DashboardCard
          title='Total Sales Today'
          value={formatCurrency(dashboardMetrics.totalSalesToday)}
          Icon={DollarSign}
        />
        <DashboardCard
          title='Total Profit Today'
          value={formatCurrency(dashboardMetrics.totalProfitToday)}
          Icon={TrendingUp}
        />
      </div>

      <div className='p-5 sm:p-3 grid lg:grid-cols-2 md:grid-cols-2 gap-4'>
        <SalesChart />
        <MonthlyProfitChart months={6} />
      </div>

      <div className='p-5 grid lg:grid-cols-2 gap-4 md:grid-cols-2'>
        {/** Add  action button here */}
        <div className='grid grid-cols-2 gap-4 mt-4'>
          <ActionCard
            bgColor='var(--primary)'
            textColor='white'
            link='products'
            icon={<PlusCircle size={28} />}
            name='Add New Product'
          />
          <ActionCard
            bgColor='#10B981'
            textColor='white'
            link='stock-out'
            icon={<ShoppingCart size={28} />}
            name='Create New Sale'
          />
          <ActionCard
            bgColor='#8B5CF6'
            textColor='white'
            link='stock-in'
            icon={<ArrowDownCircle size={28} />}
            name='Record New Purchase'
          />
          <ActionCard
            bgColor='#EF4444'
            textColor='white'
            link='reports'
            icon={<Landmark size={28} />}
            name='View Financial Report'
          />
        </div>

        <div className='mt-4'>
          <SpectraAI />
        </div>
      </div>
      <div className='p-5 grid grid-cols-1 gap-4'>
        <RecentActivities />
      </div>
      
    </div>
  );
};

export default Dashboard;
