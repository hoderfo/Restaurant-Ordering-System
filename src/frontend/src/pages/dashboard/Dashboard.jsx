import React from 'react'
import Sidebar from './components/Sidebar'
import { Outlet } from 'react-router-dom'
import Navbar from '../../components/design/Navbar'

const Dashboard = () => {
    return (
        <div className='flex h-screen w-full bg-background overflow-hidden font-sans'>
            {/* Sidebar */}
            <div className="flex-none h-full shadow-xl z-20">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className='flex-1 flex flex-col h-full min-w-0 bg-background overflow-hidden relative'>
                {/* Navbar within content area */}
                <div className="flex-none">
                    <Navbar />
                </div>

                {/* Page Content with Scrolling */}
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Dashboard