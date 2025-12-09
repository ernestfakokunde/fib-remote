import { useEffect } from 'react'
import { useGlobalContext } from '../context/context'
import DashboardCard from '../components/DashboardCard'
import { Package,Wallet, DollarSign, ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import SalesChart from '../components/SalesChart'
import MonthlyProfitChart from '../components/MonthlyProfitChart'
import { FaPlus } from "react-icons/fa";
import { FaShoppingCart } from "react-icons/fa";
import { FaArrowDown } from "react-icons/fa";
import { CiDollar } from "react-icons/ci";
import ActionCard from '../components/ActionCard'
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {

  const { dashboardMetrics, fetchDashboardMetrics } = useGlobalContext();

    useEffect(()=>{
       fetchDashboardMetrics()
     },[])

     const navigate = useNavigate()

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
                  title='Low Stock Items'
                  value={dashboardMetrics.lowStockCount}
                  Icon={Wallet}
                 />
                  <DashboardCard
                  title='Total Sales Today'
                  value={`$${dashboardMetrics.totalSalesToday}`}
                  Icon={ DollarSign}
                 />
                  <DashboardCard
                  title='Total Profit Today'
                  value={`$${dashboardMetrics.totalProfitToday}`}
                  Icon={TrendingUp}
                 />

                </div>
                
                <div className='p-5 sm:p-3 grid lg:grid-cols-2 md:grid-cols-2 gap-4'>
                  <SalesChart />
                  <MonthlyProfitChart months={6} />
                </div>

                <div className='p-5 grid lg:grid-cols-2 md:grid-cols-2'>
                  {/** Add  action button here */}
                    <div className='grid grid-cols-2 gap-4 mt-4'>
                      <ActionCard bgc="bg-blue-200" textColor="text-blue-800"  link="products" icon={<FaPlus className='text-blue-800 text-sm' />} name="Add New Product"/>
                      <ActionCard bgc="bg-green-200" textColor="text-green-800" link="stock-out" icon={<FaShoppingCart className='text-green-800 text-sm' />} name="Create New Sale" />
                      <ActionCard bgc="bg-purple-200" link="stock-in" textColor="text-purple-800" icon={<FaArrowDown className='text-purple-800 text-sm' />} name="Record New Purchase" />
                      <ActionCard bgc="bg-red-200" link="reports" textColor="text-red-800" icon={<CiDollar className='text-red-800 text-sm' />} name="View Financial Report" />
                    </div>
                </div>

             </div>
  ) }

export default Dashboard