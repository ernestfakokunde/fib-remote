import { useEffect } from 'react'
import { useGlobalContext } from '../context/context'
import DashboardCard from '../components/DashboardCard'
import { Package,Wallet, DollarSign, ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";

const Dashboard = () => {

  const { dashboardMetrics, fetchDashboardMetrics } = useGlobalContext();

    useEffect(()=>{
       fetchDashboardMetrics()
     },[])

      return (
      <div className='mt-2 container text-black'>
            <h2 className='text-2xl font-semibold'>Dashboard</h2>
            <p className='mt-2 mb-4 text-gray-800'> Welcome Back, Here's what is happening today</p>

            <div className='grid lg:grid-cols-4 md:grid-cols-2 p-5 gap-4'>
                 <DashboardCard
                  title='Total Products'
                  value={dashboardMetrics.totalProducts}
                  trend="+12% from last month"
                  Icon={Package}
                 />

                  <DashboardCard
                  title='Total Stock Value'
                  value={dashboardMetrics.totalProducts}
                  Icon={Wallet}
                 />
                  <DashboardCard
                  title='Total Sales Today'
                  value={dashboardMetrics.totalProducts}
                  Icon={ DollarSign}
                 />
                  <DashboardCard
                  title='Total Profit Today'
                  value={dashboardMetrics.totalProducts}
                  Icon={TrendingUp}
                 />

                </div>
             </div>
  ) }

export default Dashboard