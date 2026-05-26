import React from 'react';

const DashboardHome = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 dark:bg-black/20 w-full min-h-[80vh]">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Staff Dashboard</h1>
            <p className="text-gray-500">
                Giao diện trang chủ nhân viên sẽ do Member phụ trách tự thiết kế và code.
                <br/>
                (Khung Project Frontend Setup by Member A)
            </p>
        </div>
    );
};

export default DashboardHome;