import React from 'react'
import AdminSidebar from './Components/AdminSidebar'
import { Outlet } from 'react-router-dom'
import Navbar from '../../components/design/Navbar'

const AdminLayout = () => {
    return (
        <div className='w-full h-screen flex bg-background overflow-hidden font-sans'>
            {/* Sidebar */}
            <div className="flex-none h-full shadow-xl z-20">
                <AdminSidebar />
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

export default AdminLayout
